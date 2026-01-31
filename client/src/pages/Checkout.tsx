import { useState } from "react";
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

export default function CheckoutPage() {
  const {
    items,
    clearCart,
    requiresPrescription,
    selectedPrescriptionId,
    prescriptions,
  } = useCartContext();

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [deliveryType, setDeliveryType] =
    useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const selectedPrescription = prescriptions.find(
    (p) => p.id === selectedPrescriptionId
  );

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
        description: "Please upload and select a prescription",
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
        deliveryAddress:
          deliveryType === "delivery" ? deliveryAddress : null,
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

        {/* CUSTOMER */}
        <Card className="p-4 space-y-3">
          <div>
            <Label>Full Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Phone *</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
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
          <Card className="p-4 border space-y-2">
            {selectedPrescription ? (
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <FileText size={14} />
                    Prescription selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPrescription.imageUrls.length} page(s) •{" "}
                    {new Date(
                      selectedPrescription.createdAt
                    ).toLocaleDateString("en-IN")}
                  </p>

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="mt-2"
                  >
                    <Link href="/prescription">Change Prescription</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-sm">
                    Prescription Required
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="mt-2"
                  >
                    <Link href="/prescription">Upload Prescription</Link>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

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