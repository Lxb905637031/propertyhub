import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CatalogModule } from "../catalog/catalog.module";
import { DatabaseModule } from "../database/database.module";
import { InventoryService } from "./inventory.service";
import {
  INVENTORY_REPOSITORY,
  MemoryInventoryRepository,
  PrismaInventoryRepository,
  usePrismaInventoryRepository,
} from "./inventory.repository";

@Module({
  imports: [ConfigModule, DatabaseModule, CatalogModule],
  providers: [
    InventoryService,
    MemoryInventoryRepository,
    PrismaInventoryRepository,
    {
      provide: INVENTORY_REPOSITORY,
      inject: [
        ConfigService,
        MemoryInventoryRepository,
        PrismaInventoryRepository,
      ],
      useFactory: (
        configService: ConfigService,
        memoryRepository: MemoryInventoryRepository,
        prismaRepository: PrismaInventoryRepository,
      ) =>
        usePrismaInventoryRepository(configService)
          ? prismaRepository
          : memoryRepository,
    },
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
