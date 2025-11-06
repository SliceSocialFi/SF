import { SLICE_API_URL } from "@slice/data/constants";
import { Status } from "@slice/data/enums";
import type { Oembed, STS } from "@slice/types/api";
import { hydrateAuthTokens } from "@/store/persisted/useAuthStore";
import { isTokenExpiringSoon, refreshTokens } from "./tokenManager";

// Cấu hình API chung cho ứng dụng web
interface ApiConfig {
  baseUrl?: string;
  headers?: HeadersInit;
}

const config: ApiConfig = {
  // Prefer Vite-exposed env var for client builds, fallback to package constant
  baseUrl: SLICE_API_URL,
  headers: {
    "Content-Type": "application/json"
  }
};

const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const { accessToken, refreshToken } = hydrateAuthTokens();
  let token = accessToken;

  if (token && refreshToken && isTokenExpiringSoon(token)) {
    try {
      token = await refreshTokens(refreshToken);
    } catch {}
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);

  let response: Response;

  try {
    const base = (config.baseUrl || '').replace(/\/$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const baseHeaders = (config.headers as Record<string, string>) || {};
    const headers: Record<string, string> = {
      ...baseHeaders
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    response = await fetch(`${base}${path}`, {
      ...options,
      credentials: "include",
      headers,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result = await response.json();

  if (result.status === Status.Success) {
    return result.data;
  }

  throw new Error(result.error);
};

export const hono = {
  metadata: {
    sts: (): Promise<STS> => {
      return fetchApi<STS>("/metadata/sts", { method: "GET" });
    }
  },
  oembed: {
    get: (url: string): Promise<Oembed> => {
      return fetchApi<Oembed>(`/oembed/get?url=${url}`, { method: "GET" });
    }
  },
  pageview: {
    create: async (path: string) => {
      try {
        await fetchApi<{ ok: boolean }>("/pageview", {
          body: JSON.stringify({ path }),
          method: "POST"
        });
      } catch (error) {
        console.error("Failed to track pageview:", error);
      }
    }
  },
  posts: {
    create: async (payload: { slug: string; type?: string }) =>
      fetchApi<{ ok: boolean; skipped?: boolean }>("/posts", {
        body: JSON.stringify(payload),
        method: "POST"
      })
  }
};
