const assert = require("node:assert/strict");
const test = require("node:test");
const { PrismaClient } = require("@prisma/client");
const { ConflictException } = require("@nestjs/common");
const {
  PrismaInventoryRepository,
} = require("../dist/inventory/inventory.repository.js");

const databaseUrl = process.env.TEST_DATABASE_URL;

test(
  "prisma inventory reservations survive repository replacement",
  { skip: !databaseUrl },
  async () => {
    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    const skuId = `test-sku-${Date.now()}`;
    const orderId = `test-order-${Date.now()}`;

    try {
      await prisma.product.create({
        data: {
          id: `test-product-${Date.now()}`,
          skuId,
          name: "持久化库存测试商品",
          category: "测试",
          price: 1,
          availableStock: 4,
        },
      });

      const firstRepository = new PrismaInventoryRepository(prisma);
      await firstRepository.reserve(orderId, [{ skuId, quantity: 2 }]);

      // 用新的仓储实例模拟 API 重启后的进程，不依赖原进程内存状态。
      const afterRestartRepository = new PrismaInventoryRepository(prisma);
      await afterRestartRepository.consume(orderId);
      await assert.rejects(
        () => afterRestartRepository.release(orderId),
        (error) => error instanceof ConflictException,
      );

      const product = await prisma.product.findUnique({ where: { skuId } });
      assert.equal(product.availableStock, 2);
      const reservation = await prisma.inventoryReservation.findUnique({
        where: { orderId },
      });
      assert.equal(reservation.status, "CONSUMED");
    } finally {
      await prisma.inventoryReservation.deleteMany({ where: { orderId } });
      await prisma.product.deleteMany({ where: { skuId } });
      await prisma.$disconnect();
    }
  },
);
