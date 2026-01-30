import { Link } from "wouter";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { Button } from "@/components/ui/button";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        {/* Logo / Home */}
        <Link href="/" className="font-semibold text-sm">
          Sacred Heart
        </Link>

        {/* Auth section */}
        {!isAuthenticated ? (
          <GoogleLoginButton />
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium truncate max-w-[140px]">
              {user?.name}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}