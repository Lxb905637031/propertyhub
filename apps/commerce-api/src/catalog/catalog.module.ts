import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { CatalogController } from "./catalog.controller";
import {
  CATALOG_REPOSITORY,
  MemoryCatalogRepository,
  PrismaCatalogRepository,
  usePrismaPersistence,
} from "./catalog.repository";
import { CatalogService } from "./catalog.service";

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    MemoryCatalogRepository,
    PrismaCatalogRepository,
    {
      provide: CATALOG_REPOSITORY,
      inject: [ConfigService, MemoryCatalogRepository, PrismaCatalogRepository],
      useFactory: (
        configService: ConfigService,
        memoryRepository: MemoryCatalogRepository,
        prismaRepository: PrismaCatalogRepository,
      ) =>
        usePrismaPersistence(configService)
          ? prismaRepository
          : memoryRepository,
    },
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
