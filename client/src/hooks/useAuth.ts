import { useQuery } from "@tanstack/react-query";

type User = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
};

async function fetchMe(): Promise<User | null> {
  const res = await fetch("/api/auth/me", {
    credentials: "include",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export function useAuth() {
  const {
    data,
    isLoading,
    isFetching,
  } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  return {
    user: data,
    isLoading: isLoading || isFetching,
    isAuthenticated: !!data,
  };
}
