# PropertyHub Monorepo 搭线设计

## 目标

搭建一个可持续迭代、可免费部署演示的物业企业采购与积分福利商城 Monorepo。首阶段只完成工程骨架、产品说明、架构边界和本地基础设施，不实现具体业务模块。

## 产品范围

PropertyHub 面向物业集团，支持三种交易来源：企业采购、普通购买和积分兑换。产品首版通过商品、库存、购物车、订单、模拟支付、模拟物流、售后、采购审批、积分和报表形成业务闭环。

支付、短信、ERP 和物流均通过 Provider 接口隔离，首版使用 Mock 实现：

- `MockPaymentProvider`：模拟成功、失败、超时和重复回调。
- `MockSmsProvider`：只记录发送结果，并通过站内通知展示，不发送真实短信。
- `MockErpProvider`：通过 JSON/CSV 导入导出和 Webhook 模拟商品、库存和订单同步。
- `MockLogisticsProvider`：生成运单号并推进物流轨迹。

微信小程序、真实微信/支付宝支付、真实短信和需要商务合同的 ERP/物流接口不属于当前版本。

## Monorepo 边界

```text
apps/web            Next.js 商城前台与管理后台
apps/commerce-api   NestJS 领域 API
packages/sdk       前端使用的类型安全 API SDK
packages/contracts 前后端共享 DTO、枚举和状态契约
packages/config    TypeScript、ESLint、Tailwind 等公共配置
packages/ui        后续沉淀的 Tailwind UI 组件
```

`apps/web` 使用 Next.js App Router，通过 `(store)` 和 `(admin)` 路由分组承载商城与管理后台。`apps/commerce-api` 独立拥有数据库、事务和业务规则。前端只能通过 SDK 调用 API，不能直接访问数据库。

首版采用模块化单体 API，不拆微服务。后端模块按领域组织：认证、租户、用户、商品、购物车、结算、订单、库存、支付、履约、售后、积分、采购、报表、审计和外部集成。

## 技术基线

- Node.js 22+
- pnpm workspace
- Turborepo 用于任务编排
- Next.js + React + TypeScript
- NestJS + Prisma
- PostgreSQL
- Redis + BullMQ
- Tailwind CSS
- Docker Compose

## 视觉基线

前端使用 Tailwind CSS，整体为克制的苹果风格：系统字体、白/浅灰/石墨色、少量蓝色强调、细边框、轻阴影和充足留白。不得使用紫色渐变、霓虹光效、机器人插画、AI 聊天气泡或其他强 AI 视觉元素。

## 注释基线

后端代码使用英文标识符，复杂业务规则使用简洁中文注释。注释重点解释模块职责、事务边界、库存和订单状态不变量、幂等处理、队列重试和 Mock Provider 的替换边界；不为显而易见的赋值和循环添加空洞注释。

## 免费演示部署基线

低流量演示环境可以使用 Vercel/Cloudflare Pages 托管 Web，Render/Koyeb 托管 API，Supabase/Neon 承载 PostgreSQL，Upstash 承载 Redis。平台额度和休眠限制不视为商业生产 SLA。

## Git 提交规则

每个独立阶段完成后提交一次，commit message 使用 Conventional Commits。commit body 说明变更内容、设计原因和验证命令。远程仓库地址为 `https://github.com/Lxb905637031/propertyhub.git`；本地先保持可审阅的 commit 历史，推送需要在每个阶段验证通过后进行。
