import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getToken } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
}

export const getQueryFn: <T>() => QueryFunction<T> =
  () =>
  async ({ queryKey }) => {
    const token = getToken();

    const res = await fetch(`${API_BASE_URL}${queryKey.join("/")}`, {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : undefined,
    });

    if (res.status === 401) return null as any;

    await throwIfResNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      retry: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});