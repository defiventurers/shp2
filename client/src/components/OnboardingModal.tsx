import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock3, Stethoscope } from "lucide-react";
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
        <h2 className="text-lg font-semibold">Welcome 👋</h2>

        <p className="text-sm text-muted-foreground">
          <strong>
            For a smoother ordering experience, sign in with Google and upload
            your prescription.
          </strong>
          <br />
          This helps us verify medicines faster and deliver without delays.
        </p>

        <div className="rounded-lg border bg-muted/40 p-3 text-left space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 mt-0.5 text-[#0A7A3D]" />
            <span>Trusted medicine verification by our pharmacy team.</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Clock3 className="w-4 h-4 mt-0.5 text-[#0A7A3D]" />
            <span>Faster checkout with your saved profile details.</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Stethoscope className="w-4 h-4 mt-0.5 text-[#0A7A3D]" />
            <span>Safer prescription handling for restricted medicines.</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button className="w-full" onClick={handleLogin}>
            Sign in with Google
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={skip}
          >
            Skip for now
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          You can still browse inventory and add medicines to cart without
          signing in.
        </p>
      </DialogContent>
    </Dialog>
  );
}
