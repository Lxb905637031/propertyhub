const assert = require("node:assert/strict");
const test = require("node:test");
const { BadRequestException, ConflictException } = require("@nestjs/common");
const {
  MemoryCatalogRepository,
} = require("../dist/catalog/catalog.repository.js");
const { CatalogService } = require("../dist/catalog/catalog.service.js");
const {
  MemoryInventoryRepository,
} = require("../dist/inventory/inventory.repository.js");
const { InventoryService } = require("../dist/inventory/inventory.service.js");
const { moveOrderStatus } = require("../dist/orders/order-state.js");

test("order state machine rejects an illegal transition", () => {
  assert.throws(
    () => moveOrderStatus("PENDING_PAYMENT", "SHIPPED"),
    (error) => error instanceof BadRequestException,
  );
});

test("inventory reservation consumes or releases exactly once", async () => {
  const catalog = new CatalogService(new MemoryCatalogRepository());
  const inventory = new InventoryService(
    new MemoryInventoryRepository(catalog),
  );
  const skuId = (await catalog.list())[0].skuId;
  const originalStock = (await catalog.getBySkuId(skuId)).availableStock;

  await inventory.reserve("order-1", [{ skuId, quantity: 2 }]);
  assert.equal(
    (await catalog.getBySkuId(skuId)).availableStock,
    originalStock - 2,
  );
  await inventory.consume("order-1");
  await assert.rejects(
    () => inventory.release("order-1"),
    (error) => error instanceof ConflictException,
  );

  await inventory.reserve("order-2", [{ skuId, quantity: 1 }]);
  await inventory.release("order-2");
  await inventory.release("order-2");
  assert.equal(
    (await catalog.getBySkuId(skuId)).availableStock,
    originalStock - 2,
  );
});
