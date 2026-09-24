export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  idempotencyKey: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  provider: string;
}

export interface VerifyPaymentCallbackInput {
  paymentId: string;
  idempotencyKey: string;
  signature: string;
}

export interface VerifyPaymentCallbackResult {
  accepted: boolean;
  status: "SUCCEEDED" | "FAILED";
  paymentId: string;
}

export interface RefundPaymentInput {
  paymentId: string;
  amount: number;
  idempotencyKey: string;
}

export interface RefundPaymentResult {
  refundId: string;
  status: "SUCCEEDED" | "FAILED";
}

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyCallback(
    input: VerifyPaymentCallbackInput,
  ): Promise<VerifyPaymentCallbackResult>;
  refund(input: RefundPaymentInput): Promise<RefundPaymentResult>;
}

export interface SendSmsInput {
  recipient: string;
  template: string;
  variables: Record<string, string>;
}

export interface SendSmsResult {
  messageId: string;
  status: "QUEUED" | "SENT" | "FAILED";
}

export interface SmsProvider {
  send(input: SendSmsInput): Promise<SendSmsResult>;
}

export interface SyncOrderInput {
  orderId: string;
  event: "CREATED" | "PAID" | "SHIPPED" | "REFUNDED";
}

export interface SyncOrderResult {
  syncId: string;
  status: "ACCEPTED" | "FAILED";
}

export interface ErpProvider {
  syncOrder(input: SyncOrderInput): Promise<SyncOrderResult>;
}

export interface CreateShipmentInput {
  orderId: string;
  recipient: string;
  address: string;
}

export interface CreateShipmentResult {
  trackingNo: string;
  status: "CREATED" | "FAILED";
}

export interface LogisticsProvider {
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
}

export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");
export const SMS_PROVIDER = Symbol("SMS_PROVIDER");
export const ERP_PROVIDER = Symbol("ERP_PROVIDER");
export const LOGISTICS_PROVIDER = Symbol("LOGISTICS_PROVIDER");
