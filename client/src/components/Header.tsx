import { Heart, User, Settings, LogOut } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryClient } from "@/lib/queryClient";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export function Header({ title }: HeaderProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    // 🔑 Force auth state refresh
    await queryClient.invalidateQueries({
      queryKey: ["/api/auth/me"],
    });
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/">
          <div
            className="flex items-center gap-2 cursor-pointer"
            data-testid="link-home-logo"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart
                className="w-5 h-5 text-primary-foreground"
                fill="currentColor"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-sm leading-tight">
                Sacred Heart
              </h1>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Pharmacy
              </p>
            </div>
          </div>
        </Link>

        {/* Page title */}
        {title && (
          <h2 className="font-semibold text-base absolute left-1/2 -translate-x-1/2">
            {title}
          </h2>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isLoading ? null : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  data-testid="button-user-menu"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={user.picture || undefined}
                      alt={user.name || user.email}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {(user.name || user.email)?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>

                <DropdownMenuSeparator />

                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild data-testid="button-login">
              <Link href="/login">
                <User className="w-4 h-4 mr-1" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
