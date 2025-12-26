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

export default function CheckoutPage() {
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

  // Prescription
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
        description: "Please select a prescription before placing order",
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
            <Label>Phone Number *</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <Label>Email (Optional)</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </Card>

        {/* DELIVERY */}
        <Card className="p-4 space-y-3">
          <Label className="font-medium">Delivery Option</Label>

          <RadioGroup
            value={deliveryType}
            onValueChange={(v) =>
              setDeliveryType(v