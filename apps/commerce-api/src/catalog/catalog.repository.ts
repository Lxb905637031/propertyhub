import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ProductSummary } from "@propertyhub/contracts";
import { PrismaService } from "../database/prisma.service";

export const CATALOG_REPOSITORY = Symbol("CATALOG_REPOSITORY");

export interface CatalogRepository {
  list(): Promise<ProductSummary[]>;
  getBySkuId(skuId: string): Promise<ProductSummary>;
  changeAvailableStock(skuId: string, delta: number): Promise<void>;
}

export const seedProducts: ProductSummary[] = [
  {
    id: "product-cleaning-paper",
    skuId: "sku-cleaning-paper-24",
    name: "商用抽纸 24 包",
    category: "日常清洁",
    price: 69,
    availableStock: 120,
  },
  {
    id: "product-toolbox",
    skuId: "sku-toolbox-standard",
    name: "工程维修工具箱",
    category: "工程物资",
    price: 268,
    availableStock: 18,
  },
  {
    id: "product-care-box",
    skuId: "sku-care-box",
    name: "员工关怀礼盒",
    category: "积分福利",
    price: 99,
    pointsPrice: 1200,
    availableStock: 36,
  },
];

@Injectable()
export class MemoryCatalogRepository implements CatalogRepository {
  private readonly products = new Map(
    seedProducts.map((product) => [product.skuId, { ...product }]),
  );

  async list(): Promise<ProductSummary[]> {
    return [...this.products.values()].map((product) => ({ ...product }));
  }

  async getBySkuId(skuId: string): Promise<ProductSummary> {
    const product = this.products.get(skuId);
    if (!product) throw new NotFoundException(`SKU ${skuId} 不存在`);
    return { ...product };
  }

  async changeAvailableStock(skuId: string, delta: number): Promise<void> {
    const product = this.products.get(skuId);
    if (!product) throw new NotFoundException(`SKU ${skuId} 不存在`);
    if (product.availableStock + delta < 0) {
      throw new ConflictException(`SKU ${skuId} 库存不足`);
    }
    product.availableStock += delta;
  }
}

@Injectable()
export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ProductSummary[]> {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });
    return products.map((product) => this.toSummary(product));
  }

  async getBySkuId(skuId: string): Promise<ProductSummary> {
    const product = await this.prisma.product.findFirst({
      where: { skuId, active: true },
    });
    if (!product) throw new NotFoundException(`SKU ${skuId} 不存在`);
    return this.toSummary(product);
  }

  async changeAvailableStock(skuId: string, delta: number): Promise<void> {
    const updated = await this.prisma.product.updateMany({
      where:
        delta < 0
          ? { skuId, active: true, availableStock: { gte: -delta } }
          : { skuId, active: true },
      data: { availableStock: { increment: delta } },
    });
    if (!updated.count)
      throw new ConflictException(`SKU ${skuId} 库存不足或已下架`);
  }

  private toSummary(product: {
    id: string;
    skuId: string;
    name: string;
    category: string;
    price: number;
    pointsPrice: number | null;
    availableStock: number;
  }): ProductSummary {
    return {
      id: product.id,
      skuId: product.skuId,
      name: product.name,
      category: product.category,
      price: product.price,
      pointsPrice: product.pointsPrice ?? undefined,
      availableStock: product.availableStock,
    };
  }
}

export function usePrismaPersistence(configService: ConfigService): boolean {
  return configService.get<string>("PERSISTENCE_MODE", "memory") === "prisma";
}
