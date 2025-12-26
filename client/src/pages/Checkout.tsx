import { useState } from "react";
import { useCartContext } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Checkout() {
  const { items, clearCart } = useCartContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.medicine.price) * item.quantity,
    0
  );

  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  async function placeOrder() {
    setLoading(true);

    try {
      const data = await apiRequest({
        url: "/api/orders",
        method: "POST",
        body: {
          items: items.map((item) => ({
            medicineId: item.medicine.id,
            medicineName: item.medicine.name,
            quantity: item.quantity,
            price: item.medicine.price,
          })),
          subtotal,
          deliveryFee,
          total,
          deliveryType: "pickup",
          customerName: "Dev User",
          customerPhone: "9999999999",
          customerEmail: "dev@example.com",
        },
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
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Checkout</h2>

      <div>Items in cart: {items.length}</div>
      <div>Total: ₹{total}</div>

      <Button onClick={placeOrder} disabled={loading}>
        {loading ? "Placing order..." : "Place Order"}
      </Button>
    </div>
  );
}