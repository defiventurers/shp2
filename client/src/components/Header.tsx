import { Link } from "wouter";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { Button } from "@/components/ui/button";

export function Header() {
  const { isAuthenticated, user, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        <Link href="/" className="font-semibold text-sm">
          Sacred Heart
        </Link>

        {loading ? null : !isAuthenticated ? (
          <GoogleLoginButton />
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium truncate max-w-[160px]">
              {user?.name}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
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