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

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();

  async function handleLogout() {
    // 1️⃣ Remove JWT
    localStorage.removeItem("auth_token");

    // 2️⃣ Call backend (optional but clean)
    await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/logout`,
      { method: "POST" }
    );

    // 3️⃣ Clear cached user & orders
    queryClient.clear();

    // 4️⃣ Force UI reset
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
          {isAuthenticated && user ? (
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
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
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