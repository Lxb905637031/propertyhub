import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CatalogModule } from "../catalog/catalog.module";
import { InventoryModule } from "../inventory/inventory.module";
import { ProviderModule } from "../integrations/providers/provider.module";
import { OrdersController } from "./orders.controller";
import {
  MemoryOrderRepository,
  ORDER_REPOSITORY,
  PrismaOrderRepository,
  usePrismaOrderRepository,
} from "./orders.repository";
import { OrdersService } from "./orders.service";

@Module({
  imports: [CatalogModule, InventoryModule, ProviderModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    MemoryOrderRepository,
    PrismaOrderRepository,
    {
      provide: ORDER_REPOSITORY,
      inject: [ConfigService, MemoryOrderRepository, PrismaOrderRepository],
      useFactory: (
        configService: ConfigService,
        memoryRepository: MemoryOrderRepository,
        prismaRepository: PrismaOrderRepository,
      ) =>
        usePrismaOrderRepository(configService)
          ? prismaRepository
          : memoryRepository,
    },
  ],
})
export class OrdersModule {}
