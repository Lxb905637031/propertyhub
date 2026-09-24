# PropertyHub

PropertyHub 是一个面向物业集团的采购与积分福利商城 Demo。它把商品、SKU、库存、购物车、订单、审批、模拟支付、履约、售后、报表和审计串成一条可以演示的业务链路。

项目使用 pnpm + Turborepo Monorepo：前端是 Next.js、React、TypeScript 和 Tailwind CSS，后端是 NestJS、Node.js、Prisma，数据服务使用 PostgreSQL 和 Redis。界面采用白、浅灰、石墨黑和少量蓝色，保持克制的系统风格。

## 当前范围

首版刻意使用可替换的 Mock Provider：

- `MockPaymentProvider`：模拟支付创建、成功/失败/超时和重复回调。
- `MockSmsProvider`：写入通知记录，不连接短信网关。
- `MockErpProvider`：模拟订单同步、失败和重试边界。
- `MockLogisticsProvider`：生成运单号和物流状态。

当前不包含 AI、微信小程序、真实微信/支付宝支付、真实短信或需要商务合同的 ERP/物流接口。这样可以使用免费额度部署 Demo，同时把未来替换真实服务需要的接口和幂等边界保留下来。

## 目录

```text
apps/web              Next.js 商城前台和管理后台
apps/commerce-api     NestJS 商城领域 API
packages/contracts    前后端共享状态和错误契约
packages/sdk          类型安全 API Client
packages/config       公共 TypeScript 配置入口
packages/ui           预留公共 Tailwind UI 边界
docs/product.md       产品价值、玩法和面试演示路径
docs/architecture.md  模块边界、事务和 Provider 设计
```

## 本地启动

环境要求：Node.js 22+、pnpm 11+、Docker Desktop。

```bash
cp .env.example .env
pnpm install --frozen-lockfile
docker compose up -d

# 终端一：启动 API
cp apps/commerce-api/.env.example apps/commerce-api/.env
pnpm --filter @propertyhub/commerce-api dev

# 终端二：启动 Web
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @propertyhub/web dev
```

打开 <http://localhost:3000>，API 健康检查地址为 <http://localhost:4000/api/health>。

停止本地服务：

```bash
docker compose down
```

如需清空本地数据库和 Redis 数据，确认无须保留后再执行 `docker compose down -v`。

## 常用命令

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config
```

`apps/commerce-api/prisma/schema.prisma` 是当前租户和用户边界。加入业务表后，使用 Prisma migration 管理数据库结构；生产环境不使用 `db push` 或自动同步 schema。

## 产品闭环

```text
登录 -> 选品 -> SKU/库存校验 -> 购物车结算
  -> 企业采购审批（B2B）
  -> 创建订单 -> 锁定库存/积分
  -> 模拟支付与幂等回调
  -> 发货与模拟物流 -> 确认收货
  -> 售后/退款 -> 报表、对账和审计
```

每个领域的详细价值、角色、状态机和面试演示方式见 [docs/product.md](docs/product.md)，技术边界见 [docs/architecture.md](docs/architecture.md)。

## 免费 Demo 发布建议

可以把 Web 部署到 Vercel 或 Cloudflare Pages，把 API 部署到 Render/Koyeb，把 PostgreSQL 部署到 Supabase/Neon，把 Redis 部署到 Upstash。免费额度通常有休眠、容量、带宽和 SLA 限制，适合面试 Demo 和学习环境，不能直接当作生产 SLA。发布前需要配置真实平台的环境变量，并执行 migration。

## Commit 学习路径

```text
38fe880  产品和架构基线
96d0b4d  pnpm workspace 与 Turborepo
4d1781d  contracts、SDK、UI 边界
8864c86  Next.js Web 商城/后台壳层
e71cf30  NestJS API、健康检查、Provider、Prisma 基线
```

后续每个业务闭环单独提交，commit message 会说明涉及的领域、事务边界和验证命令，方便按记录回看整个项目。
