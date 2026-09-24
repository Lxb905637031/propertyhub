const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const products = [
  {
    id: "product-cleaning-paper",
    skuId: "sku-cleaning-paper-24",
    name: "商用抽纸 24 包",
    category: "日常清洁",
    price: 69,
    availableStock: 120,
  },
  {
    id: "product-toolbox",
    skuId: "sku-toolbox-standard",
    name: "工程维修工具箱",
    category: "工程物资",
    price: 268,
    availableStock: 18,
  },
  {
    id: "product-care-box",
    skuId: "sku-care-box",
    name: "员工关怀礼盒",
    category: "积分福利",
    price: 99,
    pointsPrice: 1200,
    availableStock: 36,
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { skuId: product.skuId },
      update: product,
      create: product,
    });
  }
  console.log(`Seeded ${products.length} products`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
