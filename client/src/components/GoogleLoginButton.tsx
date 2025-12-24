import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { setToken } from "@/lib/auth";

export function GoogleLoginButton() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.google || !ref.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
      callback: async (response) => {
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
    });
  }, []);

  return <div ref={ref} />;
}