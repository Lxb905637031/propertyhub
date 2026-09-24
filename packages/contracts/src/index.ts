export const orderSources = [
  "B2B_PURCHASE",
  "B2C_RETAIL",
  "POINTS_REDEEM",
] as const;

export type OrderSource = (typeof orderSources)[number];

export const orderStatuses = [
  "PENDING_APPROVAL",
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDING",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const paymentStatuses = [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "EXPIRED",
  "REFUNDED",
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

export interface OrderSummary {
  id: string;
  orderNo: string;
  source: OrderSource;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
}

export interface ProductSummary {
  id: string;
  skuId: string;
  name: string;
  category: string;
  price: number;
  pointsPrice?: number;
  availableStock: number;
}

export interface OrderItemSummary {
  skuId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderDetails extends OrderSummary {
  items: OrderItemSummary[];
  paymentId?: string;
  trackingNo?: string;
}

export interface CreateOrderRequest {
  source: OrderSource;
  items: Array<{ skuId: string; quantity: number }>;
}

export interface PayOrderRequest {
  scenario?: "success" | "fail" | "timeout";
}

export interface PaymentCallbackRequest {
  paymentId: string;
  signature: string;
}

export interface ShipOrderRequest {
  recipient: string;
  address: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly details: unknown;
  readonly requestId?: string;
  readonly status: number;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
    this.requestId = payload.requestId;
  }
}
