import Link from "next/link";

const metrics = [
  { label: "待处理采购", value: "08", note: "需要审批" },
  { label: "待发货订单", value: "23", note: "库存已锁定" },
  { label: "库存预警", value: "05", note: "需要补货" },
  { label: "本月采购额", value: "¥128,640", note: "较上月 +12.6%" },
];

const shortcuts = [
  ["新建采购申请", "/admin"],
  ["维护商品库存", "/admin"],
  ["查看待发货订单", "/admin"],
  ["进入积分商城", "/store"],
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-10">
            <Link
              className="text-[17px] font-semibold tracking-[-0.02em]"
              href="/"
            >
              PropertyHub
            </Link>
            <nav
              className="hidden items-center gap-7 text-sm text-muted md:flex"
              aria-label="主导航"
            >
              <Link className="text-ink" href="/">
                工作台
              </Link>
              <Link href="/store">商城</Link>
              <Link href="/admin">管理后台</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted sm:inline">南山物业 · 总部</span>
            <button
              className="rounded-full border border-line px-4 py-2 text-ink transition hover:border-ink"
              type="button"
            >
              林旭彬
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-sm font-medium text-accent">物业采购中心</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink md:text-4xl">
              采购工作台
            </h1>
            <p className="mt-3 text-[15px] text-muted">
              今天，所有采购、库存和履约状态都在这里。
            </p>
          </div>
          <Link
            className="inline-flex w-fit items-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
            href="/store"
          >
            浏览商城
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </Link>
        </section>

        <section
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="业务概览"
        >
          {metrics.map((metric) => (
            <article
              className="rounded-2xl border border-line bg-white p-5 shadow-subtle"
              key={metric.label}
            >
              <p className="text-sm text-muted">{metric.label}</p>
              <p className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
                {metric.value}
              </p>
              <p className="mt-2 text-xs text-muted">{metric.note}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.45fr_1fr]">
          <article className="rounded-2xl border border-line bg-white p-6 shadow-subtle">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em]">
                  采购进度
                </h2>
                <p className="mt-1 text-sm text-muted">
                  按当前审批和履约状态聚合
                </p>
              </div>
              <Link className="text-sm text-accent" href="/admin">
                查看全部 →
              </Link>
            </div>
            <div className="mt-7 space-y-5">
              {[
                ["办公耗材季度采购", "审批中", "¥18,460", "bg-amber-400"],
                ["工程部维修物资", "待发货", "¥36,820", "bg-blue-500"],
                ["员工福利兑换批次", "履约中", "¥9,760", "bg-emerald-500"],
              ].map(([name, status, amount, color]) => (
                <div className="flex items-center gap-4" key={name}>
                  <span
                    className={`h-2 w-2 rounded-full ${color}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="mt-1 text-xs text-muted">{status}</p>
                  </div>
                  <span className="text-sm font-medium">{amount}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-line bg-white p-6 shadow-subtle">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em]">
                  快捷入口
                </h2>
                <p className="mt-1 text-sm text-muted">常用业务操作</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {shortcuts.map(([label, href]) => (
                <Link
                  className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm transition hover:border-ink"
                  href={href}
                  key={label}
                >
                  <span>{label}</span>
                  <span aria-hidden="true" className="text-muted">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
