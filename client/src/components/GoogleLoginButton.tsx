import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleLoginButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, refresh, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) return;
    if (!window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
      callback: async (response: any) => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/auth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ credential: response.credential }),
            }
          );

          if (!res.ok) {
            throw new Error("Google login failed");
          }

          await refresh();

          toast({
            title: "Signed in successfully",
          });
        } catch (err) {
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
    });
  }, [isAuthenticated, refresh, toast]);

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span>Signed in as {user?.name}</span>
        <button
          onClick={async () => {
            await logout();
            toast({ title: "Logged out successfully" });
          }}
          className="underline font-medium"
        >
          Logout
        </button>
      </div>
    );
  }

  return <div ref={buttonRef} />;
}