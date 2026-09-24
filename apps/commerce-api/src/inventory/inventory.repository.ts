import { ConflictException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";
import { CatalogService } from "../catalog/catalog.service";

export const INVENTORY_REPOSITORY = Symbol("INVENTORY_REPOSITORY");

export interface InventoryReservationItem {
  skuId: string;
  quantity: number;
}

export interface InventoryRepository {
  reserve(orderId: string, items: InventoryReservationItem[]): Promise<void>;
  consume(orderId: string): Promise<void>;
  release(orderId: string): Promise<void>;
}

function mergeItems(
  items: InventoryReservationItem[],
): InventoryReservationItem[] {
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
  return [...quantities].map(([skuId, quantity]) => ({ skuId, quantity }));
}

@Injectable()
export class MemoryInventoryRepository implements InventoryRepository {
  private readonly reservations = new Map<
    string,
    {
      items: InventoryReservationItem[];
      status: "RESERVED" | "CONSUMED" | "RELEASED";
    }
  >();

  constructor(private readonly catalogService: CatalogService) {}

  async reserve(
    orderId: string,
    items: InventoryReservationItem[],
  ): Promise<void> {
    if (this.reservations.has(orderId)) {
      throw new ConflictException("订单已锁定过库存");
    }
    const merged = mergeItems(items);
    for (const item of merged) {
      const product = await this.catalogService.getBySkuId(item.skuId);
      if (item.quantity > product.availableStock) {
        throw new ConflictException(`SKU ${item.skuId} 库存不足`);
      }
    }
    for (const item of merged) {
      await this.catalogService.changeAvailableStock(
        item.skuId,
        -item.quantity,
      );
    }
    this.reservations.set(orderId, { items: merged, status: "RESERVED" });
  }

  async consume(orderId: string): Promise<void> {
    const reservation = this.reservations.get(orderId);
    if (reservation?.status === "CONSUMED") return;
    if (!reservation || reservation.status !== "RESERVED") {
      throw new ConflictException("订单没有可扣减的锁定库存");
    }
    reservation.status = "CONSUMED";
  }

  async release(orderId: string): Promise<void> {
    const reservation = this.reservations.get(orderId);
    if (!reservation || reservation.status === "RELEASED") return;
    if (reservation.status === "CONSUMED") {
      throw new ConflictException("已售出库存只能通过售后流程返还");
    }
    for (const item of reservation.items) {
      await this.catalogService.changeAvailableStock(item.skuId, item.quantity);
    }
    reservation.status = "RELEASED";
  }
}

@Injectable()
export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async reserve(
    orderId: string,
    items: InventoryReservationItem[],
  ): Promise<void> {
    const merged = mergeItems(items);

    await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.inventoryReservation.findUnique({
        where: { orderId },
      });
      if (existing) throw new ConflictException("订单已锁定过库存");

      // 所有 SKU 与锁定记录在同一个事务中更新，任意一个 SKU 不足都会整体回滚。
      for (const item of merged) {
        const updated = await transaction.product.updateMany({
          where: {
            skuId: item.skuId,
            active: true,
            availableStock: { gte: item.quantity },
          },
          data: { availableStock: { decrement: item.quantity } },
        });
        if (!updated.count) {
          throw new ConflictException(`SKU ${item.skuId} 库存不足或已下架`);
        }
      }

      await transaction.inventoryReservation.create({
        data: {
          orderId,
          items: { create: merged },
        },
      });
    });
  }

  async consume(orderId: string): Promise<void> {
    const updated = await this.prisma.inventoryReservation.updateMany({
      where: { orderId, status: "RESERVED" },
      data: { status: "CONSUMED" },
    });
    if (updated.count) return;

    const reservation = await this.prisma.inventoryReservation.findUnique({
      where: { orderId },
    });
    if (reservation?.status === "CONSUMED") return;
    throw new ConflictException("订单没有可扣减的锁定库存");
  }

  async release(orderId: string): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const changed = await transaction.inventoryReservation.updateMany({
        where: { orderId, status: "RESERVED" },
        data: { status: "RELEASED" },
      });
      if (!changed.count) {
        const reservation = await transaction.inventoryReservation.findUnique({
          where: { orderId },
        });
        if (!reservation || reservation.status === "RELEASED") return;
        throw new ConflictException("已售出库存只能通过售后流程返还");
      }

      const reservation = await transaction.inventoryReservation.findUnique({
        where: { orderId },
        include: { items: true },
      });
      if (!reservation) throw new ConflictException("库存锁定记录不存在");

      for (const item of reservation.items) {
        const updated = await transaction.product.updateMany({
          where: { skuId: item.skuId, active: true },
          data: { availableStock: { increment: item.quantity } },
        });
        if (!updated.count) {
          throw new ConflictException(`SKU ${item.skuId} 不存在或已下架`);
        }
      }
    });
  }
}

export function usePrismaInventoryRepository(
  configService: ConfigService,
): boolean {
  return configService.get<string>("PERSISTENCE_MODE", "memory") === "prisma";
}
