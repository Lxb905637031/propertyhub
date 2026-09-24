/**
 * 统一给配置模块补齐开发环境默认值，并在启动时拒绝明显错误的端口配置。
 * 生产环境应通过平台密钥或 Secret 注入这些变量，而不是把真实值写进仓库。
 */
export function validateEnvironment(config: Record<string, unknown>) {
  const port = Number(config.PORT ?? 4000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return {
    ...config,
    PORT: port,
    CORS_ORIGINS: config.CORS_ORIGINS ?? "http://localhost:3000",
    DATABASE_URL:
      config.DATABASE_URL ??
      "postgresql://propertyhub:propertyhub@localhost:5432/propertyhub",
    REDIS_URL: config.REDIS_URL ?? "redis://localhost:6379",
    PROVIDER_MODE: config.PROVIDER_MODE ?? "mock",
    PERSISTENCE_MODE: config.PERSISTENCE_MODE ?? "memory",
  };
}

export function parseCorsOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
