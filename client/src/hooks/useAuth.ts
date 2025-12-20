import { useQuery } from "@tanstack/react-query";

export type User = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
};

export function useAuth() {
  const { data, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
  });

  return {
    user: data,
    isLoading,
    isAuthenticated: !!data,
  };
}
