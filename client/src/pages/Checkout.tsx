import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCartContext();
  const { toast } = useToast();

  const createOrder = useMutation({
    mutationFn: async () => {
      const payload = {
        customerName: "Test User",
        customerPhone: "9999999999",
        deliveryType: "pickup",
        items: items.map((item) => ({
          medicineId: item.medicine.id,
          medicineName: item.medicine.name,
          quantity: item.quantity,
          price: item.medicine.price,
        })),
        subtotal: subtotal.toString(),
        deliveryFee: "0",
        total: subtotal.toString(),
      };

      const res = await apiRequest("POST", "/api/orders", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order placed",
        description: "Backend + auth working ✅",
      });
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Order failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="p-4 max-w-md mx-auto space-y-4">
        <h1 className="text-lg font-semibold">Checkout (Minimal)</h1>

        <p className="text-sm text-muted-foreground">
          Items in cart: {items.length}
        </p>

        <p className="font-medium">
          Total: ₹{subtotal.toFixed(0)}
        </p>

        <Button
          className="w-full"
          onClick={() => createOrder.mutate()}
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? "Placing Order..." : "Place Order"}
        </Button>
      </Card>
    </div>
  );
}