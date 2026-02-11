cat > client/src/pages/Checkout.tsx <<'EOF'
import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartContext } from "@/context/CartContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const TAX_RATE = 0.12;
const SAVE10_CODE = "SAVE10";

export default function Checkout() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    items,
    clearCart,
    selectedPrescriptionId,
    selectedPrescription,
  } = useCartContext();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");

  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  const requiresPrescription = useMemo(
    () => items.some((i) => i.medicine.requiresPrescription),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.medicine.price) * i.quantity, 0),
    [items],
  );
  const deliveryFee = deliveryType === "delivery" ? 30 : 0;
  const totalInclusive = subtotal + deliveryFee;

  const save10Discount = useMemo(() => {
    if (!promoApplied) return 0;
    const preTax = totalInclusive / (1 + TAX_RATE);
    return Number((preTax * 0.1).toFixed(2));
  }, [promoApplied, totalInclusive]);

  const finalTotal = Math.max(0, Number((totalInclusive - save10Discount).toFixed(2)));

  function applyPromo() {
    const normalized = promoInput.trim().toUpperCase();
    if (normalized !== SAVE10_CODE) {
      toast({ title: "Invalid promo code", variant: "destructive" });
      setPromoApplied(false);
      return;
    }

    setPromoApplied(true);
    toast({ title: "SAVE10 applied", description: `You save ₹${save10Discount || "..."}` });
  }

  async function placeOrder() {
    if (!name.trim() || !/^[6-9]\d{9}$/.test(phone)) {
      toast({ title: "Enter valid name and phone", variant: "destructive" });
      return;
    }

    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      toast({ title: "Delivery address required", variant: "destructive" });
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
      await apiRequest("PATCH", "/api/users/me", {
        name: name.trim(),
        phone: phone.trim(),
      });

      const data = await apiRequest("POST", "/api/orders", {
        items: items.map((item) => ({
          medicineId: item.medicine.id,
          medicineName: item.medicine.name,
          quantity: item.quantity,
          price: Number(item.medicine.price),
        })),
        subtotal: Number(subtotal.toFixed(2)),
        deliveryFee,
        total: Number(totalInclusive.toFixed(2)),
        promoCode: promoApplied ? SAVE10_CODE : null,
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
        description: `Order #${data.orderNumber} is currently ${data.status || "pending"}.`,
      });

      clearCart();
    } catch (err: any) {
      toast({
        title: "Order failed",
        description: err?.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 py-4 max-w-lg mx-auto space-y-5">
        <h2 className="text-lg font-semibold">Checkout</h2>

        <Card className="p-3 bg-green-50 border-green-200">
          <div className="flex gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0A7A3D] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#0A7A3D]">
                Trusted & pharmacist-verified ordering
              </p>
              <p className="text-xs text-muted-foreground">
                We review prescriptions and confirm your order on call or WhatsApp before dispatch.
              </p>
            </div>
          </div>
        </Card>

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
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <Label>Delivery Option</Label>

          <RadioGroup
            value={deliveryType}
            onValueChange={(v) => setDeliveryType(v as "pickup" | "delivery")}
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
                <p className="text-sm text-muted-foreground">Same day delivery</p>
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

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Tag className="w-4 h-4 text-green-600" /> Save with promo
          </div>
          <div className="flex gap-2">
            <Input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Enter SAVE10"
            />
            <Button type="button" variant="outline" onClick={applyPromo}>
              Apply
            </Button>
          </div>
          {promoApplied && (
            <p className="text-xs text-green-700">
              SAVE10 applied: 10% off pre-tax subtotal (12% tax-inclusive pricing).
            </p>
          )}
        </Card>

        {requiresPrescription && (
          <Card className="p-4 space-y-2">
            {selectedPrescription ? (
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <Button asChild size="sm" variant="outline">
                  <Link href="/prescription">Change Prescription</Link>
                </Button>
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

      <div className="fixed bottom-16 left-0 right-0 border-t bg-background p-4 space-y-2">
        <div className="text-sm text-muted-foreground flex justify-between">
          <span>Subtotal + Delivery</span>
          <span>₹{totalInclusive.toFixed(2)}</span>
        </div>
        {promoApplied && (
          <div className="text-sm text-green-700 flex justify-between">
            <span>SAVE10 Discount</span>
            <span>-₹{save10Discount.toFixed(2)}</span>
          </div>
        )}
        <Button className="w-full" size="lg" onClick={placeOrder} disabled={loading}>
          {loading ? "Placing order..." : `Place Order • ₹${finalTotal.toFixed(2)}`}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
          <MessageCircle className="w-3 h-3" />
          After placing your order, we will quickly confirm availability and delivery details.
        </p>
      </div>
    </div>
  );
}
EOF
