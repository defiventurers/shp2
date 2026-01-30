import { useEffect, useState } from "react";

export type User = {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔑 Load user from backend cookie
  async function fetchMe() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/me`,
        {
          credentials: "include", // 🔥 REQUIRED
        }
      );

      const data = await res.json();
      setUser(data ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  // 🔓 Logout (backend + frontend)
  async function logout() {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
    refetchAuth: fetchMe,
  };
}