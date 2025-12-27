import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";

declare global {
  interface Window {
    google: any;
  }
}

export function GoogleLoginButton() {
  const ref = useRef<HTMLDivElement>(null);
  const { isAuthenticated, refetchAuth } = useAuth();

  useEffect(() => {
    // ✅ DO NOT RENDER IF ALREADY LOGGED IN
    if (isAuthenticated) return;

    if (!window.google || !ref.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
      callback: async (response: any) => {
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
          console.error("Google auth failed");
          return;
        }

        // 🔥 FORCE AUTH REFRESH
        await queryClient.invalidateQueries({
          queryKey: ["/api/auth/me"],
        });

        await refetchAuth();
      },
    });

    window.google.accounts.id.renderButton(ref.current, {
      theme: "outline",
      size: "large",
      width: 260,
    });
  }, [isAuthenticated, refetchAuth]);

  // ✅ HARD STOP — button disappears
  if (isAuthenticated) return null;

  return <div ref={ref} />;
}