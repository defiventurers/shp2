import { Link, useLocation } from "wouter";
import {
  Upload,
  Package,
  Clock,
  Truck,
  Shield,
  MapPin,
  Phone,
  Search,
  Plus,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { useAuth } from "@/hooks/useAuth";
import { CompleteProfileModal } from "@/components/CompleteProfileModal";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCartContext } from "@/context/CartContext";

const MAX_NOTE_CHARS = 200;

type DraftRequestedItem = {
  id: string;
  name: string;
  quantity: string;
  customerNotes: string;
};

function noteHasAtMostTwoSentences(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  const sentenceCount = trimmed
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
  return sentenceCount <= 2;
}

export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user, refresh } = useAuth();
  const { setRequestedItems } = useCartContext();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profilePrompted, setProfilePrompted] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestRows, setRequestRows] = useState<DraftRequestedItem[]>([
    { id: crypto.randomUUID(), name: "", quantity: "1", customerNotes: "" },
  ]);

  const profileComplete =
    !!user?.phone && /^[6-9]\d{9}$/.test(user.phone);

  useEffect(() => {
    if (
      isAuthenticated &&
      !profileComplete &&
      !profilePrompted
    ) {
      setShowProfileModal(true);
      setProfilePrompted(true);
    }
  }, [isAuthenticated, profileComplete, profilePrompted]);

  const requestValidationError = useMemo(() => {
    for (const row of requestRows) {
      if (!row.name.trim()) return "Product name is required for all requested items.";
      const qty = Number(row.quantity);
      if (!Number.isFinite(qty) || qty < 1) return "Quantity must be at least 1 for all requested items.";
      if (row.customerNotes.length > MAX_NOTE_CHARS) return `Notes cannot exceed ${MAX_NOTE_CHARS} characters.`;
      if (!noteHasAtMostTwoSentences(row.customerNotes)) return "Additional notes can contain at most 2 sentences.";
    }
    return null;
  }, [requestRows]);

  function addAnotherRow() {
    setRequestRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", quantity: "1", customerNotes: "" },
    ]);
  }

  function updateRow(id: string, patch: Partial<DraftRequestedItem>) {
    setRequestRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeRow(id: string) {
    setRequestRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
  }

  function continueToCheckout() {
    if (requestValidationError) return;

    const normalized = requestRows.map((row) => ({
      id: row.id,
      name: row.name.trim(),
      quantity: Math.max(1, Number(row.quantity || 1)),
      customerNotes: row.customerNotes.trim(),
    }));

    setRequestedItems(normalized);
    setRequestOpen(false);
    navigate("/checkout");
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <CompleteProfileModal
        open={isAuthenticated && !profileComplete && showProfileModal}
        onDone={() => {
          setShowProfileModal(false);
          refresh();
        }}
      />

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request an item we don&apos;t have</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {requestRows.map((row, idx) => (
              <Card key={row.id} className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Requested item #{idx + 1}</p>
                  {requestRows.length > 1 && (
                    <button
                      className="text-muted-foreground"
                      onClick={() => removeRow(row.id)}
                      aria-label="Remove requested item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Input
                  placeholder="Product name *"
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                />

                <Input
                  type="number"
                  min="1"
                  placeholder="Quantity *"
                  value={row.quantity}
                  onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                />

                <Textarea
                  placeholder="Additional notes (optional, max 2 sentences)"
                  value={row.customerNotes}
                  maxLength={MAX_NOTE_CHARS}
                  onChange={(e) => updateRow(row.id, { customerNotes: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">
                  {row.customerNotes.length}/{MAX_NOTE_CHARS} chars
                </p>
              </Card>
            ))}

            <Button variant="outline" onClick={addAnotherRow} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Add another item
            </Button>

            {requestValidationError && (
              <p className="text-sm text-red-600">{requestValidationError}</p>
            )}

            <Button className="w-full" disabled={!!requestValidationError} onClick={continueToCheckout}>
              Continue to Checkout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div
        className="relative text-white"
        style={{ backgroundColor: "#0A7A3D" }}
      >
        <div className="px-4 pt-8 pb-3 sm:pt-10 sm:pb-3">
          <div className="max-w-lg mx-auto text-center">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.png"
                alt="Sacred Heart Pharmacy"
                className="w-24 h-24 object-contain"
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Sacred Heart Pharmacy
            </h1>

            <p className="text-white/80 text-sm mb-1">
              Austin Town, Victoria Layout, Bengaluru, Karnataka 560047
            </p>

            <div className="flex items-center justify-center gap-1 text-xs text-white/70 mb-2">
              <MapPin className="w-3 h-3" />
              <span>
                16, Campbell Rd, opposite to ST. PHILOMENA&apos;S HOSPITAL
              </span>
            </div>

            <p className="text-white/90 text-sm max-w-xs mx-auto mb-3">
              Order medicines online with prescription upload.
            </p>

            {!isAuthenticated ? (
              <div className="flex justify-center">
                <GoogleLoginButton />
              </div>
            ) : !profileComplete ? (
              <p className="text-xs text-white/80">
                Please complete your profile to continue
              </p>
            ) : (
              <p className="text-xs text-white/80 mt-1">
                Signed in as <strong>{user?.name}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/prescription"
            onClick={(e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                window.google?.accounts.id.prompt();
              } else if (!profileComplete) {
                e.preventDefault();
                setShowProfileModal(true);
              }
            }}
          >
            <Card className="p-4 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-[#0A7A3D]" />
              </div>
              <h3 className="font-semibold text-sm mb-1">
                Upload Prescription
              </h3>
              <p className="text-xs text-muted-foreground">
                Upload & auto-detect medicines
              </p>
            </Card>
          </Link>

          <Link href="/inventory">
            <Card className="p-4 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-[#0A7A3D]" />
              </div>
              <h3 className="font-semibold text-sm mb-1">
                Browse Inventory
              </h3>
              <p className="text-xs text-muted-foreground">
                18000+ medicines available
              </p>
            </Card>
          </Link>
        </div>

        <Card className="mt-4 p-4 cursor-pointer" onClick={() => setRequestOpen(true)}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Search className="w-6 h-6 text-amber-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-0.5">Looking for something specific?</h3>
              <p className="text-xs text-muted-foreground">Can&apos;t find it? We may be able to arrange it.</p>
            </div>
          </div>
        </Card>

        <Card className="mt-4 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Phone className="w-6 h-6 text-[#0A7A3D]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-0.5">
                Need Help?
              </h3>
              <p className="text-xs text-muted-foreground">
                Chat with our pharmacist on WhatsApp
              </p>
            </div>
            <WhatsAppButton variant="inline" />
          </div>
        </Card>

        <div className="mt-10 text-center">
          <Link href="/staff/login">
            <span className="text-xs text-muted-foreground hover:underline cursor-pointer">
              Staff Login
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
