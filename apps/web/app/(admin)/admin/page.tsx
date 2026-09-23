import Link from "next/link";

const menus = [
  ["商品与库存", "维护 SKU、价格和库存流水"],
  ["采购审批", "处理组织采购申请和审批节点"],
  ["订单履约", "查看待支付、待发货和售后订单"],
  ["报表与对账", "按组织和订单来源查看业务数据"],
];

export default function AdminPage() {
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
            <Link href="/">工作台</Link>
            <Link className="text-ink" href="/admin">
              管理后台
            </Link>
            <span className="rounded-full border border-line px-4 py-2 text-ink">
              管理员
            </span>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="border-b border-line pb-8">
          <p className="mb-3 text-sm font-medium text-accent">运营管理</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            商城管理后台
          </h1>
          <p className="mt-3 text-[15px] text-muted">
            从商品、库存到订单履约，统一管理企业交易。
          </p>
        </div>
        <section className="grid gap-4 pt-8 md:grid-cols-2">
          {menus.map(([title, description]) => (
            <Link
              className="group rounded-2xl border border-line bg-white p-6 shadow-subtle transition hover:-translate-y-0.5 hover:border-ink"
              href="/admin"
              key={title}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-[-0.02em]">
                  {title}
                </h2>
                <span
                  aria-hidden="true"
                  className="text-muted transition group-hover:translate-x-1"
                >
                  →
                </span>
              </div>
              <p className="mt-3 text-sm text-muted">{description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
