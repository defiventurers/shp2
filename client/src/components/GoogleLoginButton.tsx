import React, { useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function GoogleLoginButton() {
  const { isAuthenticated, logout, refresh, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (window.google && !isAuthenticated) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          // After successful sign-in, refresh auth state
          await refresh();
          toast({ title: "Signed in successfully" });
        },
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        { theme: "outline", size: "large" }
      );
    }
  }, [isAuthenticated, refresh, toast]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {!isAuthenticated ? (
        <div id="googleSignInDiv" />
      ) : (
        <button
          onClick={async () => {
            await logout();
            toast({ title: "Logged out successfully" });
          }}
          className="text-white font-medium underline"
        >
          Logout
        </button>
      )}
    </div>
  );
}
