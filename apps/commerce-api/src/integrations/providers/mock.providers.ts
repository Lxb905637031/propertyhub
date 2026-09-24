import { GatewayTimeoutException, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  CreateShipmentInput,
  CreateShipmentResult,
  ErpProvider,
  LogisticsProvider,
  PaymentProvider,
  RefundPaymentInput,
  RefundPaymentResult,
  SendSmsInput,
  SendSmsResult,
  SmsProvider,
  SyncOrderInput,
  SyncOrderResult,
  VerifyPaymentCallbackInput,
  VerifyPaymentCallbackResult,
} from "./provider.types";

function stableId(prefix: string, value: string): string {
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
}

/**
 * Mock Provider 保留真实支付所需的接口形状，方便未来替换实现。
 * 演示场景显式传入，不从业务 ID 猜测成功或失败。签名只是 Demo 标记，不能用于真实支付。
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private readonly results = new Map<string, CreatePaymentResult>();

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (input.scenario === "timeout") {
      throw new GatewayTimeoutException("模拟支付超时，可以重试或取消订单");
    }

    const previous = this.results.get(input.idempotencyKey);
    if (previous) return { ...previous };
    const result: CreatePaymentResult = {
      paymentId: stableId("pay", input.idempotencyKey),
      status: input.scenario === "fail" ? "FAILED" : "PENDING",
      provider: "mock-payment",
    };
    this.results.set(input.idempotencyKey, result);
    return { ...result };
  }

  async verifyCallback(
    input: VerifyPaymentCallbackInput,
  ): Promise<VerifyPaymentCallbackResult> {
    const payment = [...this.results.values()].find(
      (candidate) => candidate.paymentId === input.paymentId,
    );
    // Mock Provider 重启后会丢失进程内 Map；支付单号由订单幂等键稳定生成，
    // 因此可以像真实网关一样，仅凭格式恢复这笔成功支付的验签结果。
    const paymentIdLooksValid = /^pay_[a-f0-9]{16}$/.test(input.paymentId);
    return {
      accepted:
        (Boolean(payment) || paymentIdLooksValid) &&
        input.signature === "mock-signature",
      status: payment?.status === "FAILED" ? "FAILED" : "SUCCEEDED",
      paymentId: input.paymentId,
    };
  }

  async refund(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    return {
      refundId: stableId("refund", input.idempotencyKey),
      status: input.idempotencyKey.includes("fail") ? "FAILED" : "SUCCEEDED",
    };
  }
}

@Injectable()
export class MockSmsProvider implements SmsProvider {
  async send(input: SendSmsInput): Promise<SendSmsResult> {
    return {
      messageId: stableId("sms", `${input.recipient}:${input.template}`),
      status: input.recipient.includes("fail") ? "FAILED" : "SENT",
    };
  }
}

@Injectable()
export class MockErpProvider implements ErpProvider {
  async syncOrder(input: SyncOrderInput): Promise<SyncOrderResult> {
    return {
      syncId: stableId("erp", `${input.orderId}:${input.event}`),
      status: input.orderId.includes("fail") ? "FAILED" : "ACCEPTED",
    };
  }
}

@Injectable()
export class MockLogisticsProvider implements LogisticsProvider {
  async createShipment(
    input: CreateShipmentInput,
  ): Promise<CreateShipmentResult> {
    return {
      trackingNo: stableId("mock-track", input.orderId),
      status: input.orderId.includes("fail") ? "FAILED" : "CREATED",
    };
  }
}
