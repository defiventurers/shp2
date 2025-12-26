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
  const {
    items,
    clearCart,
    requiresPrescription,
    prescriptions,
    selectedPrescriptionId,
    selectPrescription,
  } = useCartContext();

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [deliveryType, setDeliveryType] =
    useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const subtotal = items.reduce(
    (s, i) => s + Number(i.medicine.price) * i.quantity,
    0
  );
  const deliveryFee = deliveryType === "delivery" ? 30 : 0;
  const total = subtotal + deliveryFee;

  async function placeOrder() {
    if (!name || !phone) {
      toast({ title: "Enter name & phone", variant: "destructive" });
      return;
    }

    if (requiresPrescription && !selectedPrescriptionId) {
      toast({ title: "Select prescription", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("POST", "/api/orders", {
        items: items.map((i) => ({
          medicineId: i.medicine.id,
          medicineName: i.medicine.name,
          quantity: i.quantity,
          price: i.medicine.price,
        })),
        subtotal,
        deliveryFee,
        total,
        deliveryType,
        deliveryAddress,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        prescriptionId: selectedPrescriptionId,
      });

      toast({ title: "Order placed", description: data.orderNumber });
      clearCart();
    } catch (e: any) {
      toast({ title: "Order failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-32 px-4 max-w-lg mx-auto space-y-4">
      <h2 className="font-semibold text-lg">Checkout</h2>

      <Card className="p-4 space-y-3">
        <Label>Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />

        <Label>Phone *</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />

        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </Card>

      {requiresPrescription && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="font-medium text-sm mb-2">Prescription Required</p>

          {prescriptions.length === 0 ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/prescription">Upload Prescription</Link>
            </Button>
          ) : (
            <select
              className="w-full border rounded p-2"
              value={selectedPrescriptionId ?? ""}
              onChange={(e) => selectPrescription(e.target.value)}
            >
              <option value="">Select prescription</option>
              {prescriptions.map((p) => (
                <option key={p.id} value={p.id}>
                  Uploaded on {new Date(p.createdAt!).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
        </Card>
      )}

      <div className="fixed bottom-16 left-0 right-0 border-t bg-background p-4">
        <Button className="w-full" size="lg" onClick={placeOrder} disabled={loading}>
          Place Order • ₹{total}
        </Button>
      </div>
    </div>
  );
}