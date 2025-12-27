import { useQuery } from "@tanstack/react-query";

type User = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  isAdmin?: boolean;
};

export function useAuth() {
  const { data, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store", // 🔥 CRITICAL
      });

      return res.json();
    },
    staleTime: 0,        // 🔥 CRITICAL
    cacheTime: 0,        // 🔥 CRITICAL
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    user: data,
    isLoading,
    isAuthenticated: !!data,
  };
}
