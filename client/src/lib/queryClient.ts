import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://sacredheartpharma-backend.onrender.com";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // 🔥 REQUIRED
  });

  await throwIfResNotOk(res);
  return res;
}

export const getQueryFn =
  ({ on401 }: { on401: "returnNull" | "throw" }) =>
  async ({ queryKey }: any) => {
    const res = await fetch(
      `${API_BASE_URL}${queryKey.join("/")}`,
      { credentials: "include" }
    );

    if (on401 === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      retry: false,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});