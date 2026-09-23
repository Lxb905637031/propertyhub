import Link from "next/link";

const products = [
  {
    name: "商用抽纸 24 包",
    category: "日常清洁",
    price: "¥69.00",
    stock: "库存充足",
  },
  {
    name: "工程维修工具箱",
    category: "工程物资",
    price: "¥268.00",
    stock: "剩余 18 件",
  },
  {
    name: "员工关怀礼盒",
    category: "积分福利",
    price: "1,200 积分",
    stock: "可兑换",
  },
];

export default function StorePage() {
  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link
            className="text-[17px] font-semibold tracking-[-0.02em]"
            href="/"
          >
            PropertyHub
          </Link>
          <div className="flex items-center gap-5 text-sm text-muted">
            <Link className="text-ink" href="/store">
              商城
            </Link>
            <Link href="/">工作台</Link>
            <button
              className="rounded-full border border-line px-4 py-2 text-ink"
              type="button"
            >
              购物车 0
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="flex flex-col justify-between gap-5 border-b border-line pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-sm font-medium text-accent">
              南山物业福利商城
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em]">
              为项目和团队选好所需
            </h1>
            <p className="mt-3 text-[15px] text-muted">
              企业采购与积分兑换，共用一套清晰的订单流程。
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="rounded-full bg-white px-4 py-2">办公用品</span>
            <span className="rounded-full bg-white px-4 py-2">工程物资</span>
            <span className="rounded-full bg-white px-4 py-2">积分福利</span>
          </div>
        </div>
        <section className="grid gap-4 pt-8 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article
              className="rounded-2xl border border-line bg-white p-5 shadow-subtle"
              key={product.name}
            >
              <div className="flex aspect-[4/3] items-end rounded-xl bg-[#f0f1f3] p-4">
                <span className="text-xs font-medium text-muted">
                  {product.category}
                </span>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium">{product.name}</h2>
                  <p className="mt-2 text-xs text-muted">{product.stock}</p>
                </div>
                <p className="whitespace-nowrap text-sm font-semibold">
                  {product.price}
                </p>
              </div>
              <button
                className="mt-5 w-full rounded-xl border border-ink px-4 py-3 text-sm font-medium transition hover:bg-ink hover:text-white"
                type="button"
              >
                加入购物车
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
