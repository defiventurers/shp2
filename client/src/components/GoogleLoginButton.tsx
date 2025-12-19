import { useEffect } from "react";
import { saveToken } from "@/lib/auth";

declare global {
  interface Window {
    google: any;
  }
}

export function GoogleLoginButton() {
  useEffect(() => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: response.credential,
          }),
        });

        const data = await res.json();

        if (data.token) {
          saveToken(data.token);
          window.location.reload();
        } else {
          alert("Login failed");
        }
      },
    });

    window.google.accounts.id.renderButton(
      document.getElementById("google-login")!,
      {
        theme: "outline",
        size: "large",
      }
    );
  }, []);

  return <div id="google-login" />;
}

