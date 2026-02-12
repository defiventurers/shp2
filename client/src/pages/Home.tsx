import { Link, useLocation } from "wouter";

import {

  Upload,

  Package,

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

import {

  Dialog,

  DialogContent,

  DialogHeader,

  DialogTitle,

} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { useCartContext } from "@/context/CartContext";

import { WhyChooseUs } from "@/components/home/WhyChooseUs";

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

    {

      id: crypto.randomUUID(),

      name: "",

      quantity: "1",

      customerNotes: "",

    },

  ]);

  const profileComplete = !!user?.phone && /^[6-9]\d{9}$/.test(user.phone);

  useEffect(() => {

    if (isAuthenticated && !profileComplete && !profilePrompted) {

      setShowProfileModal(true);

      setProfilePrompted(true);

    }

  }, [isAuthenticated, profileComplete, profilePrompted]);

  const requestValidationError = useMemo(() => {

    for (const row of requestRows) {

      if (!row.name.trim())

        return "Product name is required for all requested items.";

      const qty = Number(row.quantity);

      if (!Number.isFinite(qty) || qty < 1)

        return "Quantity must be at least 1 for all requested items.";

      if (row.customerNotes.length > MAX_NOTE_CHARS)

        return `Notes cannot exceed ${MAX_NOTE_CHARS} characters.`;

      if (!noteHasAtMostTwoSentences(row.customerNotes))

        return "Additional notes can contain at most 2 sentences.";

    }

    return null;

  }, [requestRows]);

  function addAnotherRow() {

    setRequestRows((prev) => [

      ...prev,

      {

        id: crypto.randomUUID(),

        name: "",

        quantity: "1",

        customerNotes: "",

      },

    ]);

  }

  function updateRow(id: string, patch: Partial<DraftRequestedItem>) {

    setRequestRows((prev) =>

      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))

    );

  }

  function removeRow(id: string) {

    setRequestRows((prev) =>

      prev.length === 1 ? prev : prev.filter((row) => row.id !== id)

    );

  }

  async function submitRequest() {

    if (requestValidationError) return;

    // Normalize + push into cart context

    const normalized = requestRows.map((r) => ({

      id: r.id,

      name: r.name.trim(),

      quantity: String(Math.max(1, Number(r.quantity) || 1)),

      customerNotes: r.customerNotes.trim(),

    }));

    setRequestedItems(normalized);

    setRequestOpen(false);

    // If your flow navigates to cart/checkout, keep it here.

    // (This is intentionally conservative to avoid breaking your existing routes.)

    navigate("/cart");

  }

  return (

    <div className="mx-auto w-full max-w-6xl px-4 py-6">

      {/* Profile completion modal */}

      <CompleteProfileModal

        open={showProfileModal}

        onOpenChange={setShowProfileModal}

        onSaved={async () => {

          await refresh();

          setShowProfileModal(false);

        }}

      />

      {/* Top section */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex flex-col gap-1">

          <h1 className="text-2xl font-semibold">Sacred Heart Pharmacy</h1>

          <p className="text-sm text-muted-foreground">

            Order medicines, upload prescriptions, and get quick support.

          </p>

        </div>

        <div className="flex flex-wrap items-center gap-2">

          {!isAuthenticated ? (

            <GoogleLoginButton />

          ) : (

            <>

              <Button onClick={() => setRequestOpen(true)}>

                <Plus className="mr-2 h-4 w-4" />

                Request Medicines

              </Button>

              <Link href="/orders">

                <Button variant="outline">

                  <Package className="mr-2 h-4 w-4" />

                  My Orders

                </Button>

              </Link>

            </>

          )}

          <WhatsAppButton />

        </div>

      </div>

      {/* Quick actions */}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

        <Card className="p-4">

          <div className="flex items-start gap-3">

            <Upload className="h-5 w-5" />

            <div className="flex flex-col gap-1">

              <div className="font-medium">Upload Prescription</div>

              <div className="text-sm text-muted-foreground">

                Send a photo and we’ll prepare your order.

              </div>

              <div className="mt-2">

                <Link href="/prescriptions">

                  <Button variant="outline" size="sm">

                    Upload

                  </Button>

                </Link>

              </div>

            </div>

          </div>

        </Card>

        <Card className="p-4">

          <div className="flex items-start gap-3">

            <Search className="h-5 w-5" />

            <div className="flex flex-col gap-1">

              <div className="font-medium">Browse Products</div>

              <div className="text-sm text-muted-foreground">

                Search OTC items and essentials.

              </div>

              <div className="mt-2">

                <Link href="/shop">

                  <Button variant="outline" size="sm">

                    Shop

                  </Button>

                </Link>

              </div>

            </div>

          </div>

        </Card>

        <Card className="p-4">

          <div className="flex items-start gap-3">

            <MapPin className="h-5 w-5" />

            <div className="flex flex-col gap-1">

              <div className="font-medium">Store & Support</div>

              <div className="text-sm text-muted-foreground">

                Directions, timing, and help.

              </div>

              <div className="mt-2 flex gap-2">

                <Link href="/contact">

                  <Button variant="outline" size="sm">

                    <Phone className="mr-2 h-4 w-4" />

                    Contact

                  </Button>

                </Link>

              </div>

            </div>

          </div>

        </Card>

      </div>

      {/* Why choose us */}

      <div className="mt-8">

        <WhyChooseUs />

      </div>

      {/* Request Medicines Dialog */}

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>

        <DialogContent className="sm:max-w-2xl">

          <DialogHeader>

            <DialogTitle>Request medicines</DialogTitle>

          </DialogHeader>

          <div className="flex flex-col gap-4">

            {requestRows.map((row, idx) => (

              <div

                key={row.id}

                className="rounded-lg border p-3 flex flex-col gap-3"

              >

                <div className="flex items-center justify-between">

                  <div className="text-sm font-medium">

                    Item {idx + 1}

                  </div>

                  <Button

                    type="button"

                    variant="ghost"

                    size="sm"

                    onClick={() => removeRow(row.id)}

                    disabled={requestRows.length === 1}

                    title={

                      requestRows.length === 1

                        ? "At least one item is required"

                        : "Remove item"

                    }

                  >

                    <X className="h-4 w-4" />

                  </Button>

                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                  <div className="md:col-span-2">

                    <label className="text-xs text-muted-foreground">

                      Product name

                    </label>

                    <Input

                      value={row.name}

                      onChange={(e) =>

                        updateRow(row.id, { name: e.target.value })

                      }

                      placeholder="e.g., Paracetamol 500mg"

                    />

                  </div>

                  <div>

                    <label className="text-xs text-muted-foreground">

                      Quantity

                    </label>

                    <Input

                      inputMode="numeric"

                      value={row.quantity}

                      onChange={(e) =>

                        updateRow(row.id, { quantity: e.target.value })

                      }

                      placeholder="1"

                    />

                  </div>

                  <div className="md:col-span-3">

                    <label className="text-xs text-muted-foreground">

                      Notes (optional) — max {MAX_NOTE_CHARS} chars, 2 sentences

                    </label>

                    <Textarea

                      value={row.customerNotes}

                      onChange={(e) =>

                        updateRow(row.id, { customerNotes: e.target.value })

                      }

                      placeholder="e.g., Need sugar-free version. Or any brand is fine."

                    />

                    <div className="mt-1 text-xs text-muted-foreground">

                      {row.customerNotes.length}/{MAX_NOTE_CHARS}

                    </div>

                  </div>

                </div>

              </div>

            ))}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <Button type="button" variant="outline" onClick={addAnotherRow}>

                <Plus className="mr-2 h-4 w-4" />

                Add another item

              </Button>

              <div className="flex flex-col items-end gap-2">

                {requestValidationError ? (

                  <div className="text-sm text-red-600">

                    {requestValidationError}

                  </div>

                ) : null}

                <div className="flex gap-2">

                  <Button

                    type="button"

                    variant="outline"

                    onClick={() => setRequestOpen(false)}

                  >

                    Cancel

                  </Button>

                  <Button

                    type="button"

                    onClick={submitRequest}

                    disabled={!!requestValidationError}

                  >

                    Add to cart

                  </Button>

                </div>

              </div>

            </div>

          </div>

        </DialogContent>

      </Dialog>

    </div>

  );

}