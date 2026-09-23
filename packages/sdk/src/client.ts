import {
  ApiError,
  type ApiErrorPayload,
  type OrderSummary,
} from '@propertyhub/contracts';

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | undefined;
  fetch?: typeof globalThis.fetch;
}

export interface ApiClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
  orders: {
    getById(id: string): Promise<OrderSummary>;
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function parseErrorPayload(value: unknown, status: number): ApiError {
  const fallback: ApiErrorPayload = {
    code: 'HTTP_ERROR',
    message: `Request failed with status ${status}`,
  };

  if (!value || typeof value !== 'object') {
    return new ApiError(status, fallback);
  }

  const candidate = value as Partial<ApiErrorPayload>;
  return new ApiError(status, {
    code: candidate.code ?? fallback.code,
    message: candidate.message ?? fallback.message,
    details: candidate.details,
    requestId: candidate.requestId,
  });
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchFn = options.fetch ?? globalThis.fetch;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');

    const accessToken = options.getAccessToken?.();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetchFn(`${baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        payload = undefined;
      }
      throw parseErrorPayload(payload, response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  return {
    request,
    orders: {
      getById: (id) => request<OrderSummary>(`/orders/${encodeURIComponent(id)}`),
    },
  };
}
