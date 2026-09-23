# PropertyHub Monorepo Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the initial PropertyHub Monorepo skeleton with a Next.js web app, a NestJS commerce API, shared SDK/contracts/config packages, product documentation, and local infrastructure that is ready for the first vertical business slice.

**Architecture:** Use a pnpm workspace orchestrated by Turborepo. The single Next.js app contains `(store)` and `(admin)` route groups, while `apps/commerce-api` owns domain modules and persistence. Shared API contracts and a typed client live in `packages/contracts` and `packages/sdk`; no frontend code accesses the database directly.

**Tech Stack:** Node.js 22+, pnpm, Turborepo, Next.js, React, TypeScript, NestJS, Prisma, PostgreSQL, Redis, BullMQ, Tailwind CSS, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-23-propertyhub-monorepo-design.md`

## Global Constraints

- Use `apps/commerce-api` as the semantic backend project name.
- Use Tailwind CSS with a restrained Apple-like visual baseline; do not add AI-themed visuals or copy.
- Keep payment, SMS, ERP, and logistics behind replaceable Provider interfaces; this bootstrap only defines boundaries and local infrastructure.
- Add concise Chinese comments to non-obvious backend business boundaries; avoid trivial narration.
- Use ASCII in source identifiers and configuration; Chinese is allowed in documentation and explanatory comments.
- Keep every task independently verifiable and commit each completed task with Conventional Commits.

### Task 1: Add product and architecture documentation

**Files:**
- Create: `docs/product.md`
- Create: `docs/architecture.md`

**Interfaces:**
- Produces the product walkthrough and module boundaries referenced by the README and later implementation tasks.

- [ ] **Step 1: Write `docs/product.md`**

Document the product goal, roles, three transaction scenarios, the complete demo walkthrough, business value, MVP scope, explicit non-goals, Mock Provider behavior, and future replacement strategy. Use concrete example actors and state transitions.

- [ ] **Step 2: Write `docs/architecture.md`**

Document the workspace tree, app/package responsibilities, API module boundaries, request flow, transaction ownership, Provider replacement boundary, local services, environment names, and planned commit sequence.

- [ ] **Step 3: Verify documentation references**

Run: `rg -n "commerce-api|MockPaymentProvider|MockSmsProvider|MockErpProvider|MockLogisticsProvider|apps/web|packages/sdk" docs/product.md docs/architecture.md`

Expected: every named boundary appears in the relevant document and no document claims real third-party integration.

- [ ] **Step 4: Commit**

```bash
git add docs/product.md docs/architecture.md
git commit -m "docs: add product and architecture baseline"
```

### Task 2: Initialize the workspace and shared tooling

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `tsconfig.base.json`
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.base.json`

**Interfaces:**
- Produces workspace scripts `dev`, `build`, `lint`, `typecheck`, and `test`.
- Produces shared TypeScript settings consumed by all TypeScript packages.

- [ ] **Step 1: Add root package metadata and scripts**

Define the workspace as private, pin package manager `pnpm@11.16.0`, and add scripts that delegate to Turborepo: `dev`, `build`, `lint`, `typecheck`, `test`, and `format`.

- [ ] **Step 2: Add workspace and Turborepo configuration**

Include `apps/*` and `packages/*` workspaces. Configure task dependencies so `build`, `lint`, `typecheck`, and `test` respect package dependencies and cache outputs only for build artifacts.

- [ ] **Step 3: Add repository hygiene files**

Ignore `node_modules`, `.next`, `dist`, `coverage`, `.env*` except `.env.example`, local database volumes, and editor/system files. Set UTF-8, LF, and two-space indentation in `.editorconfig`.

- [ ] **Step 4: Verify workspace discovery**

Run: `pnpm install`

Expected: pnpm creates a lockfile and recognizes every workspace package without lifecycle errors.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .gitignore .editorconfig tsconfig.base.json packages/config
git commit -m "chore: initialize monorepo workspace"
```

### Task 3: Scaffold the shared contracts, SDK, and UI package

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/sdk/package.json`
- Create: `packages/sdk/src/client.ts`
- Create: `packages/sdk/src/index.ts`
- Create: `packages/ui/package.json`
- Create: `packages/ui/src/index.ts`

**Interfaces:**
- `packages/contracts` exports `OrderSource`, `OrderStatus`, `PaymentStatus`, and `ApiError`.
- `packages/sdk` exports `createApiClient(options)` and uses `ApiError` for typed failures.
- `packages/ui` exports only the package entry point until actual shared components are needed.

- [ ] **Step 1: Add failing contract typecheck fixture**

Create a type-level usage in `packages/sdk/src/client.ts` that imports the shared enums and returns a typed `ApiError` from failed requests. Run `pnpm typecheck --filter @propertyhub/sdk` and verify it fails because the contracts package is not present.

- [ ] **Step 2: Implement contracts**

Define string enums or literal unions for order source and state values. Keep transport contracts independent from NestJS decorators.

- [ ] **Step 3: Implement the typed API client**

Implement `createApiClient({ baseUrl, getAccessToken })` with `request<T>(path, init)` and an `orders.getById(id)` example. The client must parse non-2xx responses into `ApiError` and attach a bearer token only when available.

- [ ] **Step 4: Add the UI package boundary**

Export a placeholder package entry point without adding a component system prematurely. Tailwind primitives will be added when the web shell needs them.

- [ ] **Step 5: Run verification**

Run: `pnpm typecheck --filter @propertyhub/contracts --filter @propertyhub/sdk --filter @propertyhub/ui`

Expected: PASS with zero TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add packages/contracts packages/sdk packages/ui pnpm-lock.yaml
git commit -m "chore: add shared contracts sdk and ui boundaries"
```

### Task 4: Scaffold the Next.js web shell

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/app/(store)/page.tsx`
- Create: `apps/web/app/(admin)/page.tsx`

**Interfaces:**
- Web imports `@propertyhub/sdk`, `@propertyhub/contracts`, and shared config through workspace dependencies.
- Routes `/`, `/admin`, and `/store` render stable shell pages without requiring the API to be running.

- [ ] **Step 1: Add the Next.js app configuration**

Configure strict TypeScript, Tailwind/PostCSS, workspace package transpilation, and a system-font-first theme. Use neutral colors with one restrained blue accent; do not add gradients or AI copy.

- [ ] **Step 2: Build the route-group shell**

Add a root layout with navigation and a small status footer. Add a store landing page and admin landing page that explain the current product context and expose links to the future workflows.

- [ ] **Step 3: Add a smoke test**

Add a small test or static route assertion that verifies the app exports the expected root route labels. Run the app build to validate App Router compilation.

- [ ] **Step 4: Verify**

Run: `pnpm build --filter @propertyhub/web`

Expected: Next.js build completes with exit code 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "chore: scaffold next web shell"
```

### Task 5: Scaffold the NestJS commerce API

**Files:**
- Create: `apps/commerce-api/package.json`
- Create: `apps/commerce-api/tsconfig.json`
- Create: `apps/commerce-api/nest-cli.json`
- Create: `apps/commerce-api/src/main.ts`
- Create: `apps/commerce-api/src/app.module.ts`
- Create: `apps/commerce-api/src/health/health.controller.ts`
- Create: `apps/commerce-api/src/integrations/providers/*.ts`
- Create: `apps/commerce-api/prisma/schema.prisma`

**Interfaces:**
- API exposes `GET /health`.
- Provider interfaces expose `PaymentProvider`, `SmsProvider`, `ErpProvider`, and `LogisticsProvider` methods with Mock implementations.
- Prisma schema contains the initial tenant/user boundary only; business tables are added in the first feature slice.

- [ ] **Step 1: Add API bootstrap and health route**

Configure NestJS validation, CORS from an environment allowlist, a global API prefix, and a health controller that returns service name and status.

- [ ] **Step 2: Add provider interfaces and mocks**

Define typed interfaces and deterministic Mock implementations. Add concise Chinese comments at the replacement boundary and around simulated failure/timeout behavior.

- [ ] **Step 3: Add Prisma baseline**

Create the PostgreSQL datasource, generator, and `Tenant`/`User` models with tenant ownership fields. Do not add order or inventory models in the scaffold task.

- [ ] **Step 4: Verify API compilation**

Run: `pnpm build --filter @propertyhub/commerce-api`

Expected: NestJS compilation completes with exit code 0.

- [ ] **Step 5: Commit**

```bash
git add apps/commerce-api
git commit -m "chore: scaffold commerce api and mock providers"
```

### Task 6: Add local infrastructure, environment examples, and root README

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `apps/web/.env.example`
- Create: `apps/commerce-api/.env.example`
- Create: `README.md`

**Interfaces:**
- Local services expose PostgreSQL and Redis on documented ports.
- README provides exact commands for install, development, health check, typecheck, build, and test.

- [ ] **Step 1: Add Docker Compose services**

Define PostgreSQL and Redis with named volumes, health checks, non-default local credentials from environment variables, and no production claims.

- [ ] **Step 2: Add environment examples**

Document API port, web API URL, database URL, Redis URL, CORS origins, JWT placeholders, and provider selection variables using non-secret example values.

- [ ] **Step 3: Write the root README**

Explain the project, workspace tree, local setup, commands, demo scope, Mock Provider limitations, and how future commits map to the product workflow.

- [ ] **Step 4: Verify local infrastructure configuration**

Run: `docker compose config`

Expected: Compose renders successfully and contains only the declared PostgreSQL and Redis services.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .env.example apps/web/.env.example apps/commerce-api/.env.example README.md
git commit -m "chore: add local infrastructure and project readme"
```

### Task 7: Run the bootstrap verification gate and prepare remote push

**Files:**
- Modify: any files needed to fix verification failures from Tasks 1-6.

- [ ] **Step 1: Install dependencies**

Run: `pnpm install --frozen-lockfile`

Expected: install completes without modifying the lockfile.

- [ ] **Step 2: Run all static checks**

Run: `pnpm lint && pnpm typecheck && pnpm build`

Expected: all tasks exit 0.

- [ ] **Step 3: Run tests**

Run: `pnpm test`

Expected: all configured tests pass; if no tests exist yet, the command must still exit 0 with an explicit no-test configuration.

- [ ] **Step 4: Inspect Git history**

Run: `git log --oneline --decorate -n 10 && git status --short`

Expected: each completed bootstrap task has its own commit and the working tree is clean.

- [ ] **Step 5: Push only after verification**

Run: `git push -u origin main`

Expected: the verified local commit history appears on `https://github.com/Lxb905637031/propertyhub`.
