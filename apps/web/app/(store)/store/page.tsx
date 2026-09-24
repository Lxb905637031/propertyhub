"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { OrderDetails, ProductSummary } from "@propertyhub/contracts";
import { createApiClient } from "@propertyhub/sdk";

const fallbackProducts: ProductSummary[] = [
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

const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
});

export default function StorePage() {
  const [products, setProducts] = useState(fallbackProducts);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [order, setOrder] = useState<OrderDetails>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("演示环境：可直接从商品走到模拟支付");

  useEffect(() => {
    api.catalog
      .list()
      .then(setProducts)
      .catch(() => setMessage("API 尚未启动，当前展示本地种子商品"));
  }, []);

  const cartItems = useMemo(
    () =>
      products
        .filter((product) => cart[product.skuId])
        .map((product) => ({ product, quantity: cart[product.skuId] ?? 0 })),
    [cart, products],
  );
  const total = cartItems.reduce(
    (sum, { product, quantity }) => sum + product.price * quantity,
    0,
  );

  const addToCart = (skuId: string) => {
    setCart((current) => ({
      ...current,
      [skuId]: (current[skuId] ?? 0) + 1,
    }));
    setMessage("商品已加入购物车");
  };

  const checkout = async () => {
    if (!cartItems.length) {
      setMessage("请先选择商品");
      return;
    }

    setLoading(true);
    try {
      const created = await api.orders.create({
        source: "B2C_RETAIL",
        items: cartItems.map(({ product, quantity }) => ({
          skuId: product.skuId,
          quantity,
        })),
      });
      const pendingPayment = await api.orders.pay(created.id, {
        scenario: "success",
      });
      const paid = await api.orders.paymentCallback({
        paymentId: pendingPayment.paymentId ?? "",
        signature: "mock-signature",
      });
      setOrder(paid);
      setCart({});
      setMessage("模拟支付成功，库存已完成锁定");
    } catch {
      setMessage("下单失败，请确认 API 和库存服务已启动");
    } finally {
      setLoading(false);
    }
  };

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
            <span className="rounded-full border border-line px-4 py-2 text-ink">
              购物车 {cartItems.length}
            </span>
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
              商品目录和库存由 Commerce API 提供，支付使用可重复演示的 Mock
              Provider。
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="rounded-full bg-white px-4 py-2">办公用品</span>
            <span className="rounded-full bg-white px-4 py-2">工程物资</span>
            <span className="rounded-full bg-white px-4 py-2">积分福利</span>
          </div>
        </div>
        <p className="mt-6 text-sm text-muted" role="status">
          {message}
        </p>
        <section className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article
              className="rounded-2xl border border-line bg-white p-5 shadow-subtle"
              key={product.skuId}
            >
              <div className="flex aspect-[4/3] items-end rounded-xl bg-[#f0f1f3] p-4">
                <span className="text-xs font-medium text-muted">
                  {product.category}
                </span>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium">{product.name}</h2>
                  <p className="mt-2 text-xs text-muted">
                    可用库存 {product.availableStock}
                  </p>
                </div>
                <p className="whitespace-nowrap text-sm font-semibold">
                  ¥{product.price.toFixed(2)}
                </p>
              </div>
              <button
                className="mt-5 w-full rounded-xl border border-ink px-4 py-3 text-sm font-medium transition hover:bg-ink hover:text-white"
                onClick={() => addToCart(product.skuId)}
                type="button"
              >
                加入购物车
              </button>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.45fr_1fr]">
          <article className="rounded-2xl border border-line bg-white p-6 shadow-subtle">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em]">
                  结算预览
                </h2>
                <p className="mt-1 text-sm text-muted">库存校验后创建订单</p>
              </div>
              <span className="text-lg font-semibold">¥{total.toFixed(2)}</span>
            </div>
            <div className="mt-6 space-y-3">
              {cartItems.length ? (
                cartItems.map(({ product, quantity }) => (
                  <div
                    className="flex items-center justify-between text-sm"
                    key={product.skuId}
                  >
                    <span>
                      {product.name} × {quantity}
                    </span>
                    <span>¥{(product.price * quantity).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">购物车还是空的</p>
              )}
            </div>
            <button
              className="mt-6 w-full rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              disabled={loading || !cartItems.length}
              onClick={checkout}
              type="button"
            >
              {loading ? "处理中…" : "创建订单并模拟支付"}
            </button>
          </article>

          <article className="rounded-2xl border border-line bg-white p-6 shadow-subtle">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              最近一次订单
            </h2>
            <p className="mt-1 text-sm text-muted">支付回调会先验签再去重</p>
            {order ? (
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">订单号</span>
                  <span>{order.orderNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">状态</span>
                  <span className="font-medium text-emerald-600">
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">金额</span>
                  <span>¥{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                完成一次结算后显示订单状态
              </p>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
