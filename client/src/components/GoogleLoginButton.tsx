import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleLoginButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, refresh, logout } = useAuth();

  useEffect(() => {
    // Do nothing if already logged in
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
              credentials: "include", // 🔥 REQUIRED
              body: JSON.stringify({ credential: response.credential }),
            }
          );

          if (!res.ok) {
            console.error("Google login failed");
            return;
          }

          // 🔥 Force auth state refresh
          await refresh();
        } catch (err) {
          console.error("Google auth error", err);
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
    });
  }, [isAuthenticated, refresh]);

  // Logged-in UI
  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-white/90">
          Signed in{user?.name ? ` as ${user.name}` : ""}
        </span>
        <button
          onClick={logout}
          className="text-white font-medium underline"
        >
          Logout
        </button>
      </div>
    );
  }

  // Logged-out UI
  return <div ref={buttonRef} />;
}