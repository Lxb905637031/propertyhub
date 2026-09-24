import { Module } from "@nestjs/common";
import {
  ERP_PROVIDER,
  LOGISTICS_PROVIDER,
  PAYMENT_PROVIDER,
  SMS_PROVIDER,
} from "./provider.types";
import {
  MockErpProvider,
  MockLogisticsProvider,
  MockPaymentProvider,
  MockSmsProvider,
} from "./mock.providers";

@Module({
  providers: [
    MockPaymentProvider,
    MockSmsProvider,
    MockErpProvider,
    MockLogisticsProvider,
    { provide: PAYMENT_PROVIDER, useExisting: MockPaymentProvider },
    { provide: SMS_PROVIDER, useExisting: MockSmsProvider },
    { provide: ERP_PROVIDER, useExisting: MockErpProvider },
    { provide: LOGISTICS_PROVIDER, useExisting: MockLogisticsProvider },
  ],
  exports: [PAYMENT_PROVIDER, SMS_PROVIDER, ERP_PROVIDER, LOGISTICS_PROVIDER],
})
export class ProviderModule {}
