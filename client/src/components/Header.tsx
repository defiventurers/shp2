import { Link } from "wouter";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b bg-white">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <img src="/logo.png" alt="logo" className="w-6 h-6" />
        Sacred Heart
      </Link>

      {!isAuthenticated ? (
        <GoogleLoginButton />
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {user?.name}
          </span>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}