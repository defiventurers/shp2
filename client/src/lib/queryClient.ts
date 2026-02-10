import { QueryClient, QueryFunction } from "@tanstack/react-query";

/* ✅ MUST MATCH VERCEL ENV NAME */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
}

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

type UnauthorizedBehavior = "throw" | "returnNull";

export const getQueryFn =
  <T>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const res = await fetch(
      `${API_BASE_URL}${queryKey.join("/")}`,
      {
        credentials: "include",
      }
    );

    if (res.status === 401 && on401 === "returnNull") {
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
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
