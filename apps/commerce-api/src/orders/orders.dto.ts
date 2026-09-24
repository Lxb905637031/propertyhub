import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CreateOrderItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  skuId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity!: number;
}

export class CreateOrderDto {
  // 当前切片只支持普通购买；审批和积分账本完成前不开放对应下单入口。
  @IsIn(["B2C_RETAIL"])
  source!: "B2C_RETAIL";

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}

export class PayOrderDto {
  @IsOptional()
  @IsIn(["success", "fail", "timeout"])
  scenario?: "success" | "fail" | "timeout";
}

export class PaymentCallbackDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  paymentId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  signature!: string;
}

export class ShipOrderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  recipient!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  address!: string;
}
