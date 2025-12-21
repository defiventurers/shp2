import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, Truck, Store, AlertTriangle, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Prescription } from "@shared/schema";

const PICKUP_ADDRESS =
  "16, Campbell Rd, opposite to ST. PHILOMENA'S HOSPITAL, Austin Town, Victoria Layout, Bengaluru, Karnataka 560047";
const DELIVERY_FEE = 30;

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name required"),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  deliveryType: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().optional(),
  prescriptionId: z.string().optional(),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, subtotal, clearCart, requiresPrescription } =
    useCartContext();
  const { toast } = useToast();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { data: prescriptions = [] } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
    enabled: requiresPrescription,
  });

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      deliveryType: "pickup",
      deliveryAddress: "",
      prescriptionId: "",
      notes: "",
    },
  });

  const deliveryType = form.watch("deliveryType");
  const deliveryFee = deliveryType === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const payload = {
        ...data,
        items: items.map((item) => ({
          medicineId: item.medicine.id,
          medicineName: item.medicine.name,
          quantity: item.quantity,
          price: item.medicine.price,
        })),
        subtotal: subtotal.toString(),
        deliveryFee: deliveryFee.toString(),
        total: total.toString(),
      };

      const res = await apiRequest("POST", "/api/orders", payload);
      return res.json();
    },

    onSuccess: (data) => {
      setOrderPlaced(true);
      setOrderId(data.orderNumber);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });

      toast({
        title: "Order placed successfully",
        description: `Order #${data.orderNumber}`,
      });
    },

    onError: (error: Error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CheckoutFormData) => {
    if (deliveryType === "delivery" && !data.deliveryAddress) {
      form.setError("deliveryAddress", {
        message: "Delivery address required",
      });
      return;
    }

    if (requiresPrescription && !data.prescriptionId) {
      toast({
        title: "Prescription Required",
        description: "Select a prescription",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate(data);
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <Check size={48} className="mx-auto text-green-600 mb-4" />
          <h2 className="text-xl font-semibold">Order Placed</h2>
          <p className="mt-2">Order ID: {orderId}</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button onClick={() => navigate("/orders")}>View Orders</Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="max-w-lg mx-auto px-4 py-4">
        <h1 className="text-lg font-semibold mb-4">Checkout</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* CONTACT */}
            <Card className="p-4 space-y-4">
              <FormField control={form.control} name="customerName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="customerPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </Card>

            {/* DELIVERY */}
            <Card className="p-4">
              <RadioGroup
                value={deliveryType}
                onValueChange={(v) => form.setValue("deliveryType", v as any)}
              >
                <Label className="flex gap-3 items-start mb-3">
                  <RadioGroupItem value="pickup" />
                  <Store /> Store Pickup
                </Label>
                <Label className="flex gap-3 items-start">
                  <RadioGroupItem value="delivery" />
                  <Truck /> Home Delivery
                </Label>
              </RadioGroup>

              {deliveryType === "delivery" && (
                <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Delivery Address</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </Card>

            <Button
              type="submit"
              className="w-full"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? "Placing..." : `Place Order ₹${total}`}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}