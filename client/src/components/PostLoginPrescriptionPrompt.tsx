import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";

function storageKey(userId: string) {
  return `shp_post_login_rx_prompt_v1_${userId}`;
}

export function PostLoginPrescriptionPrompt() {
  const { isAuthenticated, user, loading } = useAuth();
  const { prescriptions } = useCartContext();
  const [open, setOpen] = useState(false);
  const previousAuthRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    const justLoggedIn = !previousAuthRef.current && isAuthenticated;
    previousAuthRef.current = isAuthenticated;

    if (!justLoggedIn || !user?.id) return;
    if (prescriptions.length > 0) return;

    const seen = localStorage.getItem(storageKey(user.id));
    if (!seen) {
      setOpen(true);
    }
  }, [isAuthenticated, loading, user?.id, prescriptions.length]);

  useEffect(() => {
    if (!user?.id) return;
    if (prescriptions.length > 0) {
      localStorage.setItem(storageKey(user.id), "uploaded");
      setOpen(false);
    }
  }, [prescriptions.length, user?.id]);

  function dismissPrompt() {
    if (user?.id) {
      localStorage.setItem(storageKey(user.id), "dismissed");
    }
    setOpen(false);
  }

  function handleUploadClick() {
    if (user?.id) {
      localStorage.setItem(storageKey(user.id), "opened_upload");
    }
    setOpen(false);
  }

  if (!isAuthenticated || !user?.id) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm text-center space-y-4">
        <h2 className="text-lg font-semibold">You’re signed in ✅</h2>

        <p className="text-sm text-muted-foreground">
          Uploading your prescription now helps us verify medicines faster and
          avoid delivery delays for restricted items.
        </p>

        <div className="rounded-lg border bg-muted/40 p-3 text-left">
          <div className="flex items-start gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 mt-0.5 text-[#0A7A3D]" />
            <span>
              Trusted review by our pharmacy team before packing your order.
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Button asChild className="w-full" onClick={handleUploadClick}>
            <Link href="/prescription">
              <Upload className="w-4 h-4 mr-2" />
              Upload Prescription
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={dismissPrompt}
          >
            I’ll do this later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
