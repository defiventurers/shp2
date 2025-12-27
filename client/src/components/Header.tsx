import { Heart, User, Settings, LogOut } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // 🔐 Prevent duplicate login toasts
  const loginToastShown = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !loginToastShown.current) {
      toast({
        title: "Login successful",
        description: `Welcome, ${user.name || "User"}`,
      });
      loginToastShown.current = true;
    }

    if (!isAuthenticated) {
      loginToastShown.current = false;
    }
  }, [isAuthenticated, user, toast]);

  async function handleLogout() {
    // 1️⃣ Remove JWT (defensive)
    localStorage.removeItem("auth_token");

    // 2️⃣ Call backend logout (best practice)
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/logout`,
        { method: "POST", credentials: "include" }
      );
    } catch {
      // ignore network failure on logout
    }

    // 3️⃣ Clear cache
    queryClient.clear();

    // 4️⃣ Reset UI
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-sm">Sacred Heart</h1>
              <p className="text-[10px] text-muted-foreground">Pharmacy</p>
            </div>
          </div>
        </Link>

        {title && (
          <h2 className="font-semibold text-base absolute left-1/2 -translate-x-1/2">
            {title}
          </h2>
        )}

        <div className="flex items-center gap-2">
          {!isLoading && isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {user.email?.[0]?.toUpperCase() || "U"}
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
                    <Link href="/admin">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !isLoading && (
              <Button variant="ghost" size="sm" asChild>
                <a href="/api/auth/dev-login">
                  <User className="w-4 h-4 mr-1" />
                  Login
                </a>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}