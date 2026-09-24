import { BadRequestException } from "@nestjs/common";
import type { OrderStatus } from "@propertyhub/contracts";

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_APPROVAL: ["PENDING_PAYMENT", "CANCELLED"],
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDING"],
  PROCESSING: ["SHIPPED", "REFUNDING"],
  SHIPPED: ["COMPLETED", "REFUNDING"],
  COMPLETED: ["REFUNDING"],
  CANCELLED: [],
  REFUNDING: ["REFUNDED"],
  REFUNDED: [],
};

export function moveOrderStatus(
  current: OrderStatus,
  next: OrderStatus,
): OrderStatus {
  if (!(transitions[current] ?? []).includes(next)) {
    throw new BadRequestException(`订单状态不能从 ${current} 变更为 ${next}`);
  }

  return next;
}
