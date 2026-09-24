import { Injectable, NotFoundException } from "@nestjs/common";
import type { ProductSummary } from "@propertyhub/contracts";

/**
 * 第一条业务闭环先使用内存目录，让 API 可以在没有数据库迁移的情况下运行。
 * 目录通过服务边界暴露，后续替换为 Prisma Repository 时，Controller 和订单服务不需要改动。
 */
const seedProducts: ProductSummary[] = [
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
export class CatalogService {
  private readonly products = new Map(
    seedProducts.map((product) => [product.skuId, { ...product }]),
  );

  list(): ProductSummary[] {
    return [...this.products.values()].map((product) => ({ ...product }));
  }

  getBySkuId(skuId: string): ProductSummary {
    const product = this.products.get(skuId);
    if (!product) {
      throw new NotFoundException(`SKU ${skuId} 不存在`);
    }

    return { ...product };
  }

  changeAvailableStock(skuId: string, delta: number): void {
    const product = this.products.get(skuId);
    if (!product) throw new NotFoundException(`SKU ${skuId} 不存在`);
    product.availableStock += delta;
  }
}
