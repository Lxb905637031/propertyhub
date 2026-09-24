import { Injectable } from "@nestjs/common";
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
 * 测试参数中带有 `fail` 或 `timeout` 时，会稳定地产生失败/超时分支。
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (input.idempotencyKey.includes("timeout")) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return {
      paymentId: stableId("pay", input.idempotencyKey),
      status: input.idempotencyKey.includes("fail") ? "FAILED" : "PENDING",
      provider: "mock-payment",
    };
  }

  async verifyCallback(
    input: VerifyPaymentCallbackInput,
  ): Promise<VerifyPaymentCallbackResult> {
    return {
      accepted: input.signature === "mock-signature",
      status: input.paymentId.includes("fail") ? "FAILED" : "SUCCEEDED",
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
