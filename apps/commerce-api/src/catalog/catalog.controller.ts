import { Controller, Get, Param } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller("products")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  list() {
    return this.catalogService.list();
  }

  @Get(":skuId")
  getBySkuId(@Param("skuId") skuId: string) {
    return this.catalogService.getBySkuId(skuId);
  }
}
