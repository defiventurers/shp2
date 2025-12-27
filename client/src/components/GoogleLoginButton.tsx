import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function GoogleLoginButton() {
  const { isAuthenticated } = useAuth();

  // ✅ If already logged in, never show button
  if (isAuthenticated) return null;

  function handleLogin() {
    // 🔑 Redirect to backend Google OAuth
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
  }

  return (
    <Button
      onClick={handleLogin}
      className="w-[260px]"
      variant="outline"
    >
      Sign in with Google
    </Button>
  );
}