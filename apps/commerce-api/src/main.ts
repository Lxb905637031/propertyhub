import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { parseCorsOrigins } from "./common/config/environment";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigins = parseCorsOrigins(
    configService.get<string>("CORS_ORIGINS", "http://localhost:3000"),
  );

  app.use(helmet());
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  const port = configService.get<number>("PORT", 4000);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
