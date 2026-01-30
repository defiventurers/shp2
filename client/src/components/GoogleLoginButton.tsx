import { useAuth } from "@/hooks/useAuth";

export function GoogleLoginButton() {
  const { isAuthenticated, user, logout } = useAuth();

  // 🔐 Redirect-based login (matches backend)
  function handleLogin() {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">
          Signed in{user?.name ? ` as ${user.name}` : ""}
        </span>
        <button
          onClick={logout}
          className="text-green-700 font-medium hover:underline"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition"
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google"
        className="w-4 h-4"
      />
      <span className="text-sm font-medium">Sign in with Google</span>
    </button>
  );
}