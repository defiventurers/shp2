import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://sacredheartpharma-backend.onrender.com";

type Props = {
  open: boolean;
  onDone: () => void;
};

export function CompleteProfileModal({ open, onDone }: Props) {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function save() {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast({
        title: "Invalid phone number",
        description: "Enter a valid 10-digit Indian mobile number",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${API_BASE}/api/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone }),
      });

      if (!res.ok) throw new Error();

      toast({ title: "Profile completed" });
      onDone();
    } catch {
      toast({
        title: "Failed to save phone",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-4 space-y-4 bg-white text-black shadow-2xl border border-gray-200">
        <h2 className="text-lg font-semibold">Complete your profile</h2>

        <p className="text-sm text-muted-foreground">
          Phone number is required to place orders and upload prescriptions.
        </p>

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10-digit mobile number"
          className="w-full border rounded px-3 py-2 bg-white"
        />

        <Button className="w-full" onClick={save} disabled={saving}>
          Save & Continue
        </Button>
      </Card>
    </div>
  );
}
