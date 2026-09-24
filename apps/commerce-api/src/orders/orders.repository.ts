import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { OrderDetails } from "@propertyhub/contracts";
import { PrismaService } from "../database/prisma.service";

export const ORDER_REPOSITORY = Symbol("ORDER_REPOSITORY");

export interface OrderRepository {
  list(): Promise<OrderDetails[]>;
  getById(id: string): Promise<OrderDetails>;
  findByPaymentId(paymentId: string): Promise<OrderDetails | undefined>;
  save(order: OrderDetails): Promise<OrderDetails>;
}

@Injectable()
export class MemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, OrderDetails>();

  async list(): Promise<OrderDetails[]> {
    return [...this.orders.values()].reverse().map((order) => this.copy(order));
  }

  async getById(id: string): Promise<OrderDetails> {
    const order = this.orders.get(id);
    if (!order) throw new NotFoundException(`订单 ${id} 不存在`);
    return this.copy(order);
  }

  async findByPaymentId(paymentId: string): Promise<OrderDetails | undefined> {
    const order = [...this.orders.values()].find(
      (candidate) => candidate.paymentId === paymentId,
    );
    return order ? this.copy(order) : undefined;
  }

  async save(order: OrderDetails): Promise<OrderDetails> {
    this.orders.set(order.id, this.copy(order));
    return this.copy(order);
  }

  private copy(order: OrderDetails): OrderDetails {
    return { ...order, items: order.items.map((item) => ({ ...item })) };
  }
}

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<OrderDetails[]> {
    const orders = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((order) => this.toDetails(order));
  }

  async getById(id: string): Promise<OrderDetails> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException(`订单 ${id} 不存在`);
    return this.toDetails(order);
  }

  async findByPaymentId(paymentId: string): Promise<OrderDetails | undefined> {
    const order = await this.prisma.order.findUnique({
      where: { paymentId },
      include: { items: true },
    });
    return order ? this.toDetails(order) : undefined;
  }

  async save(order: OrderDetails): Promise<OrderDetails> {
    const saved = await this.prisma.order.upsert({
      where: { id: order.id },
      create: {
        id: order.id,
        orderNo: order.orderNo,
        source: order.source,
        status: order.status,
        totalAmount: order.totalAmount,
        paymentId: order.paymentId,
        trackingNo: order.trackingNo,
        createdAt: new Date(order.createdAt),
        items: {
          create: order.items.map((item) => ({
            skuId: item.skuId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            product: { connect: { skuId: item.skuId } },
          })),
        },
      },
      update: {
        status: order.status,
        totalAmount: order.totalAmount,
        paymentId: order.paymentId,
        trackingNo: order.trackingNo,
        items: {
          deleteMany: {},
          create: order.items.map((item) => ({
            skuId: item.skuId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            product: { connect: { skuId: item.skuId } },
          })),
        },
      },
      include: { items: true },
    });
    return this.toDetails(saved);
  }

  private toDetails(order: {
    id: string;
    orderNo: string;
    source: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
    paymentId: string | null;
    trackingNo: string | null;
    items: Array<{
      skuId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
  }): OrderDetails {
    return {
      id: order.id,
      orderNo: order.orderNo,
      source: order.source as OrderDetails["source"],
      status: order.status as OrderDetails["status"],
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toISOString(),
      paymentId: order.paymentId ?? undefined,
      trackingNo: order.trackingNo ?? undefined,
      items: order.items.map((item) => ({ ...item })),
    };
  }
}

export function usePrismaOrderRepository(
  configService: ConfigService,
): boolean {
  return configService.get<string>("PERSISTENCE_MODE", "memory") === "prisma";
}
