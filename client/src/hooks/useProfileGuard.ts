import { useAuth } from "@/hooks/useAuth";

export function useProfileGuard() {
  const { isAuthenticated, user, loading } = useAuth();

  const profileComplete =
    !!user?.firstName &&
    !!user?.phone &&
    /^[6-9]\d{9}$/.test(user.phone);

  return {
    loading,
    isAuthenticated,
    profileComplete,
  };
}