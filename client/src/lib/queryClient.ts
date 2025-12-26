import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://sacredheartpharma-backend.onrender.com";

/* ---------------------------------
   Helper
---------------------------------- */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data?.error || message;
    } catch {}
    throw new Error(message);
  }
}

/* ---------------------------------
   ✅ FIXED apiRequest (OBJECT-BASED)
---------------------------------- */
type ApiRequestOptions = {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

export async function apiRequest({
  url,
  method = "GET",
  body,
}: ApiRequestOptions) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // ✅ REQUIRED FOR COOKIE AUTH
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
    const res = await fetch(`${API_BASE_URL}${queryKey.join("/")}`, {
      credentials: "include",
    });

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