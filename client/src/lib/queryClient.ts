import { QueryClient, QueryFunction } from "@tanstack/react-query";

/* ✅ SINGLE SOURCE OF TRUTH */
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://sacredheartpharma-backend.onrender.com";

/* ---------------------------------
   Helper
---------------------------------- */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
}

/* ---------------------------------
   API REQUEST
---------------------------------- */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // ✅ REQUIRED FOR JWT COOKIE
  });

  await throwIfResNotOk(res);
  return res.json();
}

/* ---------------------------------
   React Query fetcher
---------------------------------- */
type UnauthorizedBehavior = "throw" | "returnNull";

export const getQueryFn =
  <T>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const res = await fetch(
      `${API_BASE_URL}${queryKey.join("/")}`,
      { credentials: "include" }
    );

    if (res.status === 401 && on401 === "returnNull") {
      return null as T;
    }

    await throwIfResNotOk(res);
    return res.json();
  };

/* ---------------------------------
   Query Client
---------------------------------- */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: Infinity,
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});