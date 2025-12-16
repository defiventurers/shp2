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

const PICKUP_ADDRESS = "16, Campbell Rd, opposite to ST. PHILOMENA'S HOSPITAL, Austin Town, Victoria Layout, Bengaluru, Karnataka 560047";
const DELIVERY_FEE = 30;

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit phone number"),
  customerEmail: z.string().email("Enter valid email").optional().or(z.literal("")),
  deliveryType: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().optional(),
  prescriptionId: z.string().optional(),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, subtotal, clearCart, requiresPrescription } = useCartContext();
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
      const orderData = {
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
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response;
    },
    onSuccess: (data) => {
      setOrderId(data.orderNumber);
      setOrderPlaced(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
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
      form.setError("deliveryAddress", { message: "Delivery address is required" });
      return;
    }
    if (requiresPrescription && !data.prescriptionId) {
      toast({
        title: "Prescription Required",
        description: "Please select a prescription for Schedule H medicines",
        variant: "destructive",
      });
      return;
    }
    createOrderMutation.mutate(data);
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="font-semibold text-xl mb-2">Order Placed Successfully!</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-2">
            Your order has been placed and will be processed shortly.
          </p>
          <p className="font-medium text-lg mb-6" data-testid="text-order-number">
            Order ID: {orderId}
          </p>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/orders")} data-testid="button-view-orders">
              View Orders
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} data-testid="button-go-home">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="font-semibold text-xl mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Add some medicines to your cart to checkout
          </p>
          <Button onClick={() => navigate("/inventory")}>Browse Inventory</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 py-4 max-w-lg mx-auto">
        <h1 className="font-semibold text-lg mb-4">Checkout</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-4">
              <h2 className="font-medium text-sm mb-4">Contact Details</h2>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} data-testid="input-name" />
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
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="10-digit mobile number"
                          {...field}
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-medium text-sm mb-4">Delivery Option</h2>
              <FormField
                control={form.control}
                name="deliveryType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        <Label
                          htmlFor="pickup"
                          className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover-elevate [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                        >
                          <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Store className="w-4 h-4 text-primary" />
                              <span className="font-medium text-sm">Store Pickup</span>
                              <span className="text-xs text-green-600 font-medium">FREE</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {PICKUP_ADDRESS}
                            </p>
                          </div>
                        </Label>

                        <Label
                          htmlFor="delivery"
                          className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover-elevate [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                        >
                          <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-primary" />
                              <span className="font-medium text-sm">Home Delivery</span>
                              <span className="text-xs text-muted-foreground">₹{DELIVERY_FEE}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Same day delivery in Bangalore
                            </p>
                          </div>
                        </Label>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {deliveryType === "delivery" && (
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Delivery Address *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your complete address with landmark"
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </Card>

            {requiresPrescription && (
              <Card className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <h2 className="font-medium text-sm">Prescription Required</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Some items require a valid prescription
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="prescriptionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Prescription</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-prescription">
                            <SelectValue placeholder="Choose a prescription" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {prescriptions.map((prescription) => (
                            <SelectItem key={prescription.id} value={prescription.id}>
                              Prescription uploaded on{" "}
                              {new Date(prescription.createdAt!).toLocaleDateString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
            )}

            <Card className="p-4">
              <h2 className="font-medium text-sm mb-3">Order Summary</h2>
              <div className="space-y-2 text-sm">
                {items.map(({ medicine, quantity }) => (
                  <div key={medicine.id} className="flex justify-between">
                    <span className="text-muted-foreground truncate max-w-[200px]">
                      {medicine.name} x{quantity}
                    </span>
                    <span>₹{(parseFloat(medicine.price) * quantity).toFixed(0)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span data-testid="text-total">₹{total.toFixed(0)}</span>
                </div>
              </div>
            </Card>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions..."
                      className="resize-none"
                      rows={2}
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 bg-background border-t border-border p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full"
            size="lg"
            onClick={form.handleSubmit(onSubmit)}
            disabled={createOrderMutation.isPending}
            data-testid="button-place-order"
          >
            {createOrderMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Placing Order...
              </>
            ) : (
              `Place Order • ₹${total.toFixed(0)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
