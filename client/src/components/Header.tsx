import { Link } from "wouter";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const { toast } = useToast();

  if (loading) return null; // 🔑 prevents flicker + false logout

  const handleLogout = async () => {
    await logout();
    toast({ title: "Logged out successfully" });
  };

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        <Link href="/" className="font-semibold text-sm">
          Sacred Heart
        </Link>

        {!isAuthenticated ? (
          <GoogleLoginButton />
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium truncate max-w-[160px]">
              Signed in as {user?.name}
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