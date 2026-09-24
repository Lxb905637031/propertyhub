import { Inject, Injectable } from "@nestjs/common";
import type { ProductSummary } from "@propertyhub/contracts";
import {
  CATALOG_REPOSITORY,
  type CatalogRepository,
} from "./catalog.repository";

@Injectable()
export class CatalogService {
  constructor(
    @Inject(CATALOG_REPOSITORY)
    private readonly repository: CatalogRepository,
  ) {}

  list(): Promise<ProductSummary[]> {
    return this.repository.list();
  }

  getBySkuId(skuId: string): Promise<ProductSummary> {
    return this.repository.getBySkuId(skuId);
  }

  changeAvailableStock(skuId: string, delta: number): Promise<void> {
    return this.repository.changeAvailableStock(skuId, delta);
  }
}
