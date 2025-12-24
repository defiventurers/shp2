import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<any> {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export const getQueryFn: <T>() => QueryFunction<T> =
  () =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("auth_token");

    const res = await fetch(`${API_BASE_URL}${queryKey.join("")}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});