import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/LoadingSpinner";

/* -----------------------------
   Schema
------------------------------ */
const checkoutSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, subtotal, clearCart } = useCartContext();
  const { toast } = useToast();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      notes: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      return apiRequest("POST", "/api/orders", {
        ...data,
        items,
        total: subtotal.toString(),
      });
    },
    onSuccess: async (res) => {
      const json = await res.json();
      setOrderId(json.orderNumber);
      setOrderPlaced(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to place order",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Check className="w-16 h-16 text-green-600 mb-4" />
        <h2 className="text-xl font-semibold">Order Placed</h2>
        <p className="mb-4">Order ID: {orderId}</p>
        <Button onClick={() => navigate("/orders")}>View Orders</Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => navigate("/inventory")}>Browse Inventory</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      <h1 className="text-lg font-semibold mb-4">Checkout</h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) =>
            createOrderMutation.mutate(data)
          )}
          className="space-y-4"
        >
          <Card className="p-4 space-y-3">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </Card>

          <Button
            className="w-full"
            type="submit"
            disabled={createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Placing Order…
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}