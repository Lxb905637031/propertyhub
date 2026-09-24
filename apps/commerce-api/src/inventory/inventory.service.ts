import { Inject, Injectable } from "@nestjs/common";
import {
  INVENTORY_REPOSITORY,
  type InventoryRepository,
  type InventoryReservationItem,
} from "./inventory.repository";

@Injectable()
export class InventoryService {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repository: InventoryRepository,
  ) {}

  reserve(orderId: string, items: InventoryReservationItem[]): Promise<void> {
    return this.repository.reserve(orderId, items);
  }

  consume(orderId: string): Promise<void> {
    return this.repository.consume(orderId);
  }

  release(orderId: string): Promise<void> {
    return this.repository.release(orderId);
  }
}
