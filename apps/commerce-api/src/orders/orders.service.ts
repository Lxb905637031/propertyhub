import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { OrderDetails, OrderItemSummary } from "@propertyhub/contracts";
import { randomUUID } from "node:crypto";
import { CatalogService } from "../catalog/catalog.service";
import { InventoryService } from "../inventory/inventory.service";
import {
  LOGISTICS_PROVIDER,
  PAYMENT_PROVIDER,
} from "../integrations/providers/provider.types";
import type {
  LogisticsProvider,
  PaymentProvider,
} from "../integrations/providers/provider.types";
import { moveOrderStatus } from "./order-state";
import { ORDER_REPOSITORY, type OrderRepository } from "./orders.repository";
import type {
  CreateOrderDto,
  PayOrderDto,
  PaymentCallbackDto,
  ShipOrderDto,
} from "./orders.dto";

@Injectable()
export class OrdersService {
  private readonly pendingOperations = new Map<string, Promise<void>>();

  constructor(
    private readonly catalogService: CatalogService,
    private readonly inventoryService: InventoryService,
    @Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
    @Inject(LOGISTICS_PROVIDER)
    private readonly logisticsProvider: LogisticsProvider,
  ) {}

  async create(input: CreateOrderDto): Promise<OrderDetails> {
    if (input.source !== "B2C_RETAIL") {
      throw new BadRequestException("当前演示仅支持普通购买");
    }
    if (!Array.isArray(input.items) || !input.items.length) {
      throw new BadRequestException("订单至少需要一件商品");
    }
    const quantities = new Map<string, number>();
    for (const item of input.items) {
      quantities.set(
        item.skuId,
        (quantities.get(item.skuId) ?? 0) + item.quantity,
      );
    }
    const items: OrderItemSummary[] = [];
    for (const [skuId, quantity] of quantities) {
      const product = await this.catalogService.getBySkuId(skuId);
      items.push({
        skuId,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: product.price * quantity,
      });
    }
    const id = randomUUID();
    const order: OrderDetails = {
      id,
      orderNo: `PH-${id}`,
      source: input.source,
      status: "PENDING_PAYMENT",
      totalAmount: items.reduce((total, item) => total + item.subtotal, 0),
      createdAt: new Date().toISOString(),
      items,
    };
    // 价格来自服务端商品快照；先整体锁库，再写入订单。
    await this.inventoryService.reserve(id, items);
    return this.repository.save(order);
  }

  list(): Promise<OrderDetails[]> {
    return this.repository.list();
  }

  getById(id: string): Promise<OrderDetails> {
    return this.repository.getById(id);
  }

  pay(id: string, input: PayOrderDto = {}): Promise<OrderDetails> {
    return this.runExclusive(id, async (order) => {
      if (order.status !== "PENDING_PAYMENT") {
        throw new ConflictException("当前订单不允许发起支付");
      }
      // 已创建的支付流水直接复用，网络重试不能切换成另一笔支付。
      if (order.paymentId) return order;
      const result = await this.paymentProvider.createPayment({
        orderId: id,
        amount: order.totalAmount,
        idempotencyKey: id,
        scenario: input.scenario ?? "success",
      });
      order.paymentId = result.paymentId;
      if (result.status === "FAILED") {
        await this.inventoryService.release(id);
        order.status = moveOrderStatus(order.status, "CANCELLED");
      }
      return order;
    });
  }

  async paymentCallback(input: PaymentCallbackDto): Promise<OrderDetails> {
    const order = await this.repository.findByPaymentId(input.paymentId);
    if (!order) throw new NotFoundException("支付流水不存在");

    return this.runExclusive(order.id, async (current) => {
      const result = await this.paymentProvider.verifyCallback({
        ...input,
        idempotencyKey: `callback:${input.paymentId}`,
      });
      if (!result.accepted) throw new BadRequestException("支付回调签名无效");

      // 验签必须先于去重；发货、收货后的重复通知同样返回当前状态。
      if (
        ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(current.status)
      ) {
        return current;
      }
      if (current.status !== "PENDING_PAYMENT") {
        throw new ConflictException("订单已关闭，不能处理支付回调");
      }
      if (result.status === "SUCCEEDED") {
        await this.inventoryService.consume(current.id);
        current.status = moveOrderStatus(current.status, "PAID");
      } else {
        await this.inventoryService.release(current.id);
        current.status = moveOrderStatus(current.status, "CANCELLED");
      }
      return current;
    });
  }

  ship(id: string, input: ShipOrderDto): Promise<OrderDetails> {
    return this.runExclusive(id, async (order) => {
      if (order.status === "SHIPPED" || order.status === "COMPLETED")
        return order;
      if (order.status !== "PAID") {
        throw new ConflictException("只有已支付订单可以发货");
      }
      const shipment = await this.logisticsProvider.createShipment({
        orderId: id,
        ...input,
      });
      if (shipment.status === "FAILED")
        throw new ConflictException("模拟物流创建失败");
      // 外部调用成功后再推进状态，失败时允许从原状态重试。
      order.trackingNo = shipment.trackingNo;
      order.status = moveOrderStatus(order.status, "PROCESSING");
      order.status = moveOrderStatus(order.status, "SHIPPED");
      return order;
    });
  }

  complete(id: string): Promise<OrderDetails> {
    return this.runExclusive(id, async (order) => {
      if (order.status === "COMPLETED") return order;
      order.status = moveOrderStatus(order.status, "COMPLETED");
      // 已售出的商品不会因确认收货而重新成为可售库存。
      return order;
    });
  }

  cancel(id: string): Promise<OrderDetails> {
    return this.runExclusive(id, async (order) => {
      if (order.status === "CANCELLED") return order;
      const next = moveOrderStatus(order.status, "CANCELLED");
      await this.inventoryService.release(id);
      order.status = next;
      return order;
    });
  }

  private async runExclusive(
    id: string,
    operation: (order: OrderDetails) => Promise<OrderDetails>,
  ): Promise<OrderDetails> {
    const previous = this.pendingOperations.get(id) ?? Promise.resolve();
    let unlock!: () => void;
    const gate = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    this.pendingOperations.set(id, gate);
    // 把同一订单的异步操作串行化，防止 await Provider 时取消/重复回调交错。
    // 这个锁只适用于本地单进程 Demo；多实例部署需要数据库事务与唯一约束。
    await previous;
    try {
      const current = await this.repository.getById(id);
      const updated = await operation(current);
      return this.repository.save(updated);
    } finally {
      unlock();
      if (this.pendingOperations.get(id) === gate)
        this.pendingOperations.delete(id);
    }
  }
}
