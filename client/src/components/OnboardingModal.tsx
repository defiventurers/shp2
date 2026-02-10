import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "shp_onboarding_seen";

export function OnboardingModal() {
  const { isAuthenticated, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) return;

    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setOpen(true);
    }
  }, [loading, isAuthenticated]);

  function skip() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  function handleLogin() {
    localStorage.setItem(STORAGE_KEY, "true");
    window.google?.accounts.id.prompt();
  }

  if (isAuthenticated) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm text-center space-y-4">
        <h2 className="text-lg font-semibold">
          Welcome 👋
        </h2>

        <p className="text-sm text-muted-foreground">
          <strong>
            For a smoother ordering experience, sign in with Google and upload
            your prescription.
          </strong>
          <br />
          This helps us verify medicines faster and deliver your order without
          delays.
        </p>

        <div className="space-y-2">
          <Button className="w-full" onClick={handleLogin}>
            Sign in & Continue
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={skip}
          >
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}