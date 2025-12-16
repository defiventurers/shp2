import { Link } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCartContext } from "@/context/CartContext";

export default function Cart() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    subtotal,
    hasScheduleHDrugs,
    requiresPrescription,
  } = useCartContext();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShoppingCart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-xl mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            Browse our inventory and add medicines to your cart
          </p>
          <Button asChild>
            <Link href="/inventory" data-testid="link-browse-inventory">
              Browse Inventory
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 py-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-semibold text-lg">
            Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-destructive hover:text-destructive"
            data-testid="button-clear-cart"
          >
            Clear all
          </Button>
        </div>

        {requiresPrescription && (
          <Card className="p-3 mb-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-amber-800 dark:text-amber-200">
                  Prescription Required
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Some items in your cart require a valid prescription. Please upload before checkout.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="mt-2 text-amber-700 border-amber-300"
                >
                  <Link href="/prescription">
                    <FileText className="w-3 h-3 mr-1" />
                    Upload Prescription
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {items.map(({ medicine, quantity }) => {
            const price = parseFloat(medicine.price);
            const itemTotal = price * quantity;

            return (
              <Card key={medicine.id} className="p-3" data-testid={`cart-item-${medicine.id}`}>
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate">
                          {medicine.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {medicine.dosage} {medicine.form && `• ${medicine.form}`}
                        </p>
                        {medicine.isScheduleH && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 mt-1">
                            Rx Required
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(medicine.id)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                        data-testid={`button-remove-${medicine.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 bg-muted rounded-full p-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateQuantity(medicine.id, quantity - 1)}
                          className="h-7 w-7 rounded-full"
                          data-testid={`button-cart-decrement-${medicine.id}`}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateQuantity(medicine.id, quantity + 1)}
                          disabled={quantity >= medicine.stock}
                          className="h-7 w-7 rounded-full"
                          data-testid={`button-cart-increment-${medicine.id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">₹{itemTotal.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">
                          ₹{price.toFixed(0)} each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 bg-background border-t border-border p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold text-lg" data-testid="text-subtotal">
              ₹{subtotal.toFixed(0)}
            </span>
          </div>
          <Button className="w-full" size="lg" asChild data-testid="button-checkout">
            <Link href="/checkout">
              Proceed to Checkout
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
