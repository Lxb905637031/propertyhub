# PropertyHub 架构说明

## 1. 总体架构

PropertyHub 使用 pnpm workspace + Turborepo 管理 Monorepo，采用模块化单体 API。商城和管理后台共用一个 Next.js Web 应用，后端使用独立的 NestJS 领域 API。

```text
浏览器
  |
  v
apps/web (Next.js + React + Tailwind)
  |
  | packages/sdk + packages/contracts
  v
apps/commerce-api (NestJS)
  |
  +--> PostgreSQL / Prisma
  +--> Redis / BullMQ
  +--> Provider adapters
          +--> MockPaymentProvider
          +--> MockSmsProvider
          +--> MockErpProvider
          +--> MockLogisticsProvider
```

## 2. 目录边界

```text
apps/
  web/                 # 商城前台与管理后台
  commerce-api/        # 商城领域 API
packages/
  sdk/                 # 类型安全 API 客户端
  contracts/           # 前后端共享契约
  config/              # 公共工程配置
  ui/                  # 可复用 Tailwind UI（按需沉淀）
docs/
  product.md           # 产品玩法、价值和演示路径
  architecture.md      # 架构边界和约束
```

## 3. Web 应用

`apps/web` 使用 Next.js App Router：

- `app/(store)`：商品浏览、购物车、结算、订单、积分和售后。
- `app/(admin)`：商品、库存、采购审批、履约、报表和系统运营。
- `app/login`：登录和租户选择。
- `components`：只放 Web 应用独有的组合组件。
- `lib`：会话、SDK 初始化、格式化和页面级辅助逻辑。

商城和后台共享同一个认证上下文和 API SDK，但通过权限守卫控制可访问页面和接口。

## 4. Commerce API

`apps/commerce-api` 按领域模块组织，而不是按 Controller/Service 全局平铺：

```text
auth             登录、Token 和会话
tenants          租户、组织和项目
users            成员、角色和数据权限
catalog          分类、SPU、SKU、价格和上下架
cart             购物车和结算草稿
checkout         价格、优惠券、积分和库存预校验
orders           订单状态机和订单快照
inventory        仓库、库存、锁定、扣减和流水
payments         支付流水、Provider 和回调
fulfillment      发货、运单和物流轨迹
after-sales      退款、退货和换货
points           积分账户、冻结、扣减和返还
procurement      采购申请和审批流
reporting        报表、导出和对账
audit            操作日志和状态变更记录
integrations     Provider、Webhook、队列和同步任务
```

Controller 只负责鉴权、参数接收和响应映射。业务规则放在 Service/Domain 层，数据库访问通过 Repository 或 Prisma 查询封装。订单、库存、积分和支付回调的事务边界由后端统一决定。

## 5. 共享包

### `packages/contracts`

存放前后端共享的纯 TypeScript 契约：

- 订单来源和订单状态。
- 支付、物流、审批和售后状态。
- API 错误结构。
- 请求参数和响应类型。

不能在这里放 NestJS 装饰器、数据库查询或业务副作用。

### `packages/sdk`

提供浏览器使用的类型安全 API 客户端。它负责 Base URL、认证 Token、JSON 序列化、错误转换和常用请求方法。它不能实现库存扣减、订单状态推进等业务规则。

### `packages/config`

存放 TypeScript、ESLint、Prettier 和 Tailwind 的共享基础配置。应用可以覆盖少量应用级差异，但不能复制整套配置。

### `packages/ui`

只有组件在 Web 前台和管理后台真实复用后才沉淀到这里。首版优先保证业务边界，不提前建设完整设计系统。

## 6. Provider 边界

后端核心模块依赖接口，不依赖具体服务商：

```ts
interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyCallback(input: VerifyCallbackInput): Promise<PaymentCallbackResult>;
  refund(input: RefundPaymentInput): Promise<RefundPaymentResult>;
}
```

支付、短信、ERP 和物流都遵循同样的依赖反转原则。Mock Provider 用于本地开发、免费部署和回归测试；未来的真实 Provider 只负责供应商协议、签名、错误映射和回调转换。

## 7. 数据一致性原则

- 所有业务表包含 `tenantId`，后端从认证上下文取得租户，不信任客户端传入的租户边界。
- 下单锁定库存，支付成功扣减，取消或超时释放。
- 支付回调通过支付流水号、幂等键和唯一约束去重。
- 订单、库存、积分的关键变更在明确事务内完成。
- 外部同步使用队列、重试、死信和人工重放。
- 商品、价格、地址和 SKU 信息以订单快照保留，避免历史订单随商品修改而变化。
- 所有状态变化和关键操作写入审计记录。

## 8. 本地开发服务

Docker Compose 首版只提供：

- PostgreSQL：持久化租户、用户和业务数据。
- Redis：缓存、短期锁和 BullMQ 队列。

支付、短信、ERP 和物流不需要额外容器，Mock Provider 在 API 进程内运行。

## 9. 环境分层

```text
.env.example                  # 文档化变量名称，不放秘密
apps/web/.env.example         # Web API 地址和公开配置
apps/commerce-api/.env.example# 数据库、Redis、JWT 和 Provider 配置
```

建议环境：`local`、`test`、`demo`。生产环境只有在替换真实服务并完成安全评审后再建立，不把免费 Demo 误称为生产 SLA。

## 10. 请求和发布流程

```text
页面交互
  -> SDK 请求
  -> API Guard / Validation
  -> Domain Service
  -> Transaction / Repository
  -> Outbox 或 Queue（需要异步时）
  -> Provider Adapter（需要外部同步时）
  -> 结构化响应和审计记录
```

发布前执行：

```text
lint -> typecheck -> test -> build -> migration -> deploy
```

首版部署可以使用免费额度：Web 使用 Vercel/Cloudflare Pages，API 使用 Render/Koyeb，PostgreSQL 使用 Supabase/Neon，Redis 使用 Upstash。免费平台的休眠、容量和 SLA 限制必须在 README 中明确记录。

## 11. 搭线阶段提交顺序

1. `docs: add product and architecture baseline`
2. `chore: initialize monorepo workspace`
3. `chore: add shared contracts sdk and ui boundaries`
4. `chore: scaffold next web shell`
5. `chore: scaffold commerce api and mock providers`
6. `chore: add local infrastructure and project readme`
7. 后续每个业务闭环单独提交，并在 commit body 记录验证命令。

## 12. 第一条可运行业务切片

当前已接通一条 B2C 演示链路：

```text
GET /api/products
  -> POST /api/orders
  -> POST /api/orders/:id/pay
  -> POST /api/orders/payments/mock/callback
  -> POST /api/orders/:id/ship
  -> POST /api/orders/:id/complete
```

目录、库存和订单暂时使用进程内 Repository，目的是先把 DTO 校验、库存锁定、状态机、Provider 调用、幂等回调和错误响应串起来。API 重启后数据会重新加载种子目录；下一阶段会把这些 Repository 替换为 Prisma + PostgreSQL 事务，并保留相同的 Controller 契约。
