import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleLoginButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, refresh, logout, loading } = useAuth();
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  /* ---------------- SAFETY GUARDS ---------------- */
  if (!API_URL || !GOOGLE_CLIENT_ID) {
    console.error("❌ Missing env vars:", {
      VITE_API_URL: API_URL,
      VITE_GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
    });
  }

  /* ---------------- GOOGLE INIT ---------------- */
  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) return;
    if (!window.google || !buttonRef.current) return;
    if (!API_URL || !GOOGLE_CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        try {
          const res = await fetch(`${API_URL}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              credential: response.credential,
            }),
          });

          if (!res.ok) {
            throw new Error("Auth request failed");
          }

          await refresh();

          toast({
            title: "Signed in successfully",
          });
        } catch (err) {
          console.error("❌ Google login failed", err);
          toast({
            title: "Login failed",
            description: "Please try again",
            variant: "destructive",
          });
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 240,
    });
  }, [isAuthenticated, loading, API_URL, GOOGLE_CLIENT_ID, refresh, toast]);

  /* ---------------- LOGOUT ---------------- */
  async function handleLogout() {
    try {
      await logout();
      toast({ title: "Logged out successfully" });
    } catch (err) {
      toast({
        title: "Logout failed",
        variant: "destructive",
      });
    }
  }

  /* ---------------- RENDER ---------------- */
  if (loading) return null;

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium truncate max-w-[160px]">
          Signed in as {user?.name}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-red-600"
        >
          Logout
        </Button>
      </div>
    );
  }

  return <div ref={buttonRef} />;
}