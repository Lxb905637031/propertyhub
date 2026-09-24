import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnvironment } from "./common/config/environment";
import { HealthModule } from "./health/health.module";
import { ProviderModule } from "./integrations/providers/provider.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    HealthModule,
    ProviderModule,
  ],
})
export class AppModule {}
