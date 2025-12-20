import { Heart, User as UserIcon, LogOut } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";

export function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    await queryClient.invalidateQueries({
      queryKey: ["/api/auth/me"],
    });
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">

        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="font-semibold text-sm">Sacred Heart</span>
          </div>
        </Link>

        {/* Auth State */}
        <div className="flex items-center gap-2">
          {isLoading ? null : isAuthenticated && user ? (
            <>
              <Avatar className="w-8 h-8">
                {user.picture ? (
                  <AvatarImage src={user.picture} />
                ) : (
                  <AvatarFallback>
                    {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>

              <span className="text-sm font-medium truncate max-w-[120px]">
                {user.name ?? user.email}
              </span>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <UserIcon className="w-4 h-4" />
              Not logged in
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
