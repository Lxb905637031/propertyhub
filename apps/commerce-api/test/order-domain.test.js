const assert = require("node:assert/strict");
const test = require("node:test");
const { BadRequestException, ConflictException } = require("@nestjs/common");
const { CatalogService } = require("../dist/catalog/catalog.service.js");
const { InventoryService } = require("../dist/inventory/inventory.service.js");
const { moveOrderStatus } = require("../dist/orders/order-state.js");

test("order state machine rejects an illegal transition", () => {
  assert.throws(
    () => moveOrderStatus("PENDING_PAYMENT", "SHIPPED"),
    (error) => error instanceof BadRequestException,
  );
});

test("inventory reservation consumes or releases exactly once", () => {
  const catalog = new CatalogService();
  const inventory = new InventoryService(catalog);
  const skuId = catalog.list()[0].skuId;
  const originalStock = catalog.getBySkuId(skuId).availableStock;

  inventory.reserve("order-1", [{ skuId, quantity: 2 }]);
  assert.equal(catalog.getBySkuId(skuId).availableStock, originalStock - 2);
  inventory.consume("order-1");
  assert.throws(
    () => inventory.release("order-1"),
    (error) => error instanceof ConflictException,
  );

  inventory.reserve("order-2", [{ skuId, quantity: 1 }]);
  inventory.release("order-2");
  inventory.release("order-2");
  assert.equal(catalog.getBySkuId(skuId).availableStock, originalStock - 2);
});
