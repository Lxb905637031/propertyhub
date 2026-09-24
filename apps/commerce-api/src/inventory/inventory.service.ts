import { ConflictException, Injectable } from "@nestjs/common";
import { CatalogService } from "../catalog/catalog.service";

export interface InventoryReservation {
  skuId: string;
  quantity: number;
}

interface Reservation {
  items: InventoryReservation[];
  status: "RESERVED" | "CONSUMED" | "RELEASED";
}

@Injectable()
export class InventoryService {
  private readonly reservations = new Map<string, Reservation>();

  constructor(private readonly catalogService: CatalogService) {}

  reserve(orderId: string, items: InventoryReservation[]): void {
    if (this.reservations.has(orderId)) {
      throw new ConflictException("订单已锁定过库存");
    }
    const quantities = new Map<string, number>();
    for (const item of items) {
      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
        throw new ConflictException("库存数量必须为正整数");
      }
      quantities.set(
        item.skuId,
        (quantities.get(item.skuId) ?? 0) + item.quantity,
      );
    }
    const merged = [...quantities].map(([skuId, quantity]) => ({
      skuId,
      quantity,
    }));
    for (const item of merged) {
      if (
        item.quantity >
        this.catalogService.getBySkuId(item.skuId).availableStock
      ) {
        throw new ConflictException(`SKU ${item.skuId} 库存不足`);
      }
    }

    // 单进程内同步完成所有 SKU 的校验与锁定，中间不能 await。
    // 接入 PostgreSQL 时须替换为事务和条件更新，不能把内存锁当作分布式锁。
    for (const item of merged) {
      this.catalogService.changeAvailableStock(item.skuId, -item.quantity);
    }
    this.reservations.set(orderId, { items: merged, status: "RESERVED" });
  }

  consume(orderId: string): void {
    const reservation = this.reservations.get(orderId);
    if (reservation?.status === "CONSUMED") return;
    if (!reservation || reservation.status !== "RESERVED") {
      throw new ConflictException("订单没有可扣减的锁定库存");
    }
    // 支付成功把锁定量转为售出量；可售量在锁库时已减少，不能再次扣减。
    reservation.status = "CONSUMED";
  }

  release(orderId: string): void {
    const reservation = this.reservations.get(orderId);
    if (!reservation || reservation.status === "RELEASED") return;
    if (reservation.status === "CONSUMED") {
      throw new ConflictException("已售出库存只能通过售后流程返还");
    }
    for (const item of reservation.items) {
      this.catalogService.changeAvailableStock(item.skuId, item.quantity);
    }
    reservation.status = "RELEASED";
  }
}
