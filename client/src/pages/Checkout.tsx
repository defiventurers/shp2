import { useState } from "react";
import { useCartContext } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function Checkout() {
  const { items, clearCart, requiresPrescription } = useCartContext();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  // Customer
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Delivery
  const [deliveryType, setDeliveryType] =
    useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Prescription (selection only)
  const [selectedPrescriptionId, setSelectedPrescriptionId] =
    useState<string | null>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.medicine.price) * item.quantity,
    0
  );

  const deliveryFee = deliveryType === "delivery" ? 30 : 0;
  const total = subtotal + deliveryFee;

  async function placeOrder() {
    if (!name || !phone) {
      toast({
        title: "Missing details",
        description: "Please enter your name and phone number",
        variant: "destructive",
      });
      return;
    }

    if (deliveryType === "delivery" && !deliveryAddress) {
      toast({
        title: "Address required",
        description: "Please enter delivery address",
        variant: "destructive",
      });
      return;
    }

    if (requiresPrescription && !selectedPrescriptionId) {
      toast({
        title: "Prescription required",
        description: "Please select a valid prescription before placing order",
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
          price: item.medicine.price,
        })),
        subtotal,
        deliveryFee,
        total,
        deliveryType,
        deliveryAddress: deliveryType === "delivery" ? deliveryAddress : null,
        customerName: name,
        customerPhone: phone,
        customerEmail: email || null,
        prescriptionId: selectedPrescriptionId,
      });

      toast({
        title: "Order placed",
        description: `Order #${data.orderNumber}`,
      });

      clearCart();
    } catch (err: any) {
      toast({
        title: "Order failed",
        description: err?.message || "Failed to place order",
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

        {/* CUSTOMER DETAILS */}
        <Card className="p-4 space-y-3">
          <div>
            <Label>Full Name *</Label>
            <Input
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label>Phone Number *</Label>
            <Input
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <Label>Email (Optional)</Label>
            <Input
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </Card>

        {/* DELIVERY OPTIONS */}
        <Card className="p-4 space-y-3">
          <Label className="font-medium">Delivery Option</Label>

          <RadioGroup
            value={deliveryType}
            onValueChange={(v) =>
              setDeliveryType(v as "pickup" | "delivery")
            }
            className="space-y-3"
          >
            <label className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer">
              <RadioGroupItem value="pickup" />
              <div>
                <div className="font-medium">
                  Store Pickup <span className="text-green-600">FREE</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  16, Campbell Rd, opposite St. Philomena&apos;s Hospital,
                  Bengaluru 560047
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer">
              <RadioGroupItem value="delivery" />
              <div>
                <div className="font-medium">Home Delivery ₹30</div>
                <p className="text-sm text-muted-foreground">
                  Same day delivery in Bangalore
                </p>
              </div>
            </label>
          </RadioGroup>

          {deliveryType === "delivery" && (
            <div>
              <Label>Delivery Address *</Label>
              <Input
                placeholder="Enter full address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </div>
          )}
        </Card>

        {/* PRESCRIPTION */}
        {requiresPrescription && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-amber-800">
                  Prescription Required
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Select a prescription uploaded earlier
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  asChild
                >
                  <Link href="/prescription">
                    {selectedPrescriptionId
                      ? "Change Prescription"
                      : "Select Prescription"}
                  </Link>
                </Button>

                {selectedPrescriptionId && (
                  <p className="text-xs text-green-700 mt-2">
                    Prescription selected
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* BOTTOM CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-lg mx-auto">
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
    </div>
  );
}