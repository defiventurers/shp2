import { useEffect, useRef } from "react";

export function GoogleLoginButton() {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
      callback: async (response) => {
        await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ credential: response.credential }),
        });

        // force refetch of /api/auth/me
        window.location.reload();
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
    });
  }, []);

  return <div ref={buttonRef} />;
}
