import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { InventoryModule } from "../inventory/inventory.module";
import { ProviderModule } from "../integrations/providers/provider.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [CatalogModule, InventoryModule, ProviderModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
