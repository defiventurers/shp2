import { useEffect, useState } from "react";
import { useCartContext } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function CheckoutPage() {
  const {
    items,
    clearCart,
    requiresPrescription,
    selectedPrescriptionId,
    prescriptions,
  } = useCartContext();

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /* ---------------- CUSTOMER ---------------- */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  /* ---------------- DELIVERY ---------------- */
  const [deliveryType, setDeliveryType] =
    useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const selectedPrescription = prescriptions.find(
    (p) => p.id === selectedPrescriptionId
  );

  /* ---------------- AUTO-FILL FROM GOOGLE PROFILE ---------------- */
  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || "");
      setEmail((prev) => prev || user.email || "");
      setPhone((prev) => prev || user.phone || "");
    }
  }, [user]);

  /* ---------------- CALCULATIONS ---------------- */
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.medicine.price) * item.quantity,
    0
  );
  const deliveryFee = deliveryType === "delivery" ? 30 : 0;
  const total = subtotal + deliveryFee;

  /* ---------------- HELPERS ---------------- */
  function isValidPhone(value: string) {
    return /^[6-9]\d{9}$/.test(value);
  }

  /* ---------------- PLACE ORDER ---------------- */
  async function placeOrder() {
    if (!isAuthenticated) {
      toast({
        title: "Please sign in to continue",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    if (!isValidPhone(phone)) {
      toast({
        title: "Invalid phone number",
        description: "Enter a valid 10-digit Indian mobile number",
        variant: "destructive",
      });
      return;
    }

    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      toast({
        title: "Delivery address required",
        variant: "destructive",
      });
      return;
    }

    if (requiresPrescription && !selectedPrescriptionId) {
      toast({
        title: "Prescription required",
        description: "Upload and select a prescription",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("POST", "/api/orders", {
        items: items.map((item) => ({
          medicineId: item.medicine.id,
          medicineName: item.medicine.name,
          quantity: item.quantity,
          price: Number(item.medicine.price),
        })),
        subtotal,
        deliveryFee,
        total,
        deliveryType,
        deliveryAddress:
          deliveryType === "delivery" ? deliveryAddress.trim() : null,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email?.trim() || null,
        prescriptionId: selectedPrescriptionId || null,
      });

      toast({
        title: "Order placed successfully 🎉",
        description: `Order #${data.orderNumber}`,
      });

      clearCart();
    } catch (err: any) {
      toast({
        title: "Order failed",
        description:
          err?.message?.includes("Cannot POST")
            ? "Server not reachable. Please try again."
            : err?.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 py-4 max-w-lg mx-auto space-y-5">
        <h2 className="text-lg font-semibold">Checkout</h2>

        {/* CUSTOMER */}
        <Card className="p-4 space-y-3">
          <div>
            <Label>Full Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Phone *</Label>
            <Input
              value={phone}
              inputMode="numeric"
              maxLength={10}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, ""))
              }
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </Card>

        {/* DELIVERY */}
        <Card className="p-4 space-y-3">
          <Label>Delivery Option</Label>

          <RadioGroup
            value={deliveryType}
            onValueChange={(v) =>
              setDeliveryType(v as "pickup" | "delivery")
            }
          >
            <label className="flex gap-3 border p-3 rounded-lg">
              <RadioGroupItem value="pickup" />
              <div>
                <div className="font-medium">
                  Store Pickup <span className="text-green-600">FREE</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  16, Campbell Rd, Bengaluru 560047
                </p>
              </div>
            </label>

            <label className="flex gap-3 border p-3 rounded-lg">
              <RadioGroupItem value="delivery" />
              <div>
                <div className="font-medium">Home Delivery ₹30</div>
                <p className="text-sm text-muted-foreground">
                  Same day delivery
                </p>
              </div>
            </label>
          </RadioGroup>

          {deliveryType === "delivery" && (
            <Input
              placeholder="Delivery address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          )}
        </Card>

        {/* PRESCRIPTION */}
        {requiresPrescription && (
          <Card className="p-4 space-y-2">
            {selectedPrescription ? (
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Prescription selected
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-2">
                    <Link href="/prescription">Change Prescription</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <Button asChild size="sm" variant="outline">
                  <Link href="/prescription">Upload Prescription</Link>
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-16 left-0 right-0 border-t bg-background p-4">
        <Button
          className="w-full"
          size="lg"
          onClick={placeOrder}
          disabled={loading}
        >
          {loading ? "Placing order..." : `Place Order • ₹${total}`}
        </Button>
      </div>
    </div>
  );
}