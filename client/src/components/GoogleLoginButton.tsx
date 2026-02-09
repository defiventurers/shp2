import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleLoginButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, refresh, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated) return;
    if (!window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
      callback: async (response: any) => {
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/google`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ credential: response.credential }),
          }
        );

        await refresh(); // 🔥 THIS WAS NEVER RUNNING
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
    });
  }, [isAuthenticated, refresh]);

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span>Signed in as {user?.name}</span>
        <button onClick={logout} className="underline">
          Logout
        </button>
      </div>
    );
  }

  return <div ref={buttonRef} />;
}