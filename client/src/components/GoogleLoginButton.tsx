import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { setToken, clearToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleLoginButton() {
  const ref = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
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
            body: JSON.stringify({ credential: response.credential }),
          }
        );

        const data = await res.json();
        setToken(data.token);

        await queryClient.invalidateQueries({
          queryKey: ["/api/auth/me"],
        });
      },
    });

    window.google.accounts.id.renderButton(ref.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
    });
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">
          Signed in{user?.name ? ` as ${user.name}` : ""}
        </span>
        <button
          className="text-green-700 font-medium hover:underline"
          onClick={async () => {
            clearToken();
            await queryClient.invalidateQueries({
              queryKey: ["/api/auth/me"],
            });
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return <div ref={ref} />;
}