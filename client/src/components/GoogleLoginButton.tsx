import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function GoogleLoginButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
      callback: async (response) => {
        try {
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ credential: response.credential }),
          });

          if (!res.ok) {
            throw new Error("Login failed");
          }

          // 🔥 THIS IS THE FIX (NO RELOAD)
          await queryClient.invalidateQueries({
            queryKey: ["/api/auth/me"],
          });

          toast({
            title: "Logged in",
            description: "You are now signed in successfully",
          });
        } catch (err) {
          console.error(err);
          toast({
            title: "Login failed",
            description: "Google authentication failed",
            variant: "destructive",
          });
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 250,
    });
  }, [toast]);

  return <div ref={buttonRef} />;
}
