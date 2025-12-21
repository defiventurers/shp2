import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://sacredheartpharma-backend.onrender.com";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json();
}

export const getQueryFn: <T>(options: {
  on401: "throw" | "returnNull";
}) => QueryFunction<T> =
  ({ on401 }) =>
  async ({ queryKey }) => {
    const res = await fetch(`${API_BASE_URL}${queryKey[0]}`, {
      credentials: "include",
    });

    if (on401 === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});