import { Link } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCartContext } from "@/context/CartContext";

export default function Cart() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    subtotal,
    requiresPrescription,
    selectedPrescriptionId,
  } = useCartContext();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <ShoppingCart className="w-10 h-10 mb-3 text-muted-foreground" />
        <h2>Your cart is empty</h2>
        <Button asChild className="mt-4">
          <Link href="/inventory">Browse Inventory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 px-4 max-w-lg mx-auto">
      <h1 className="text-lg font-semibold mb-4">
        Cart ({itemCount})
      </h1>

      {requiresPrescription && !selectedPrescriptionId && (
        <Card className="p-3 mb-4 bg-amber-50 border-amber-200">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium">Prescription Required</p>
              <Button asChild size="sm" variant="outline" className="mt-2">
                <Link href="/prescription">
                  <FileText className="w-3 h-3 mr-1" />
                  Upload Prescription
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="fixed bottom-16 left-0 right-0 border-t bg-background p-4">
        <Button
          className="w-full"
          size="lg"
          asChild={!requiresPrescription || selectedPrescriptionId}
          disabled={requiresPrescription && !selectedPrescriptionId}
        >
          {requiresPrescription && !selectedPrescriptionId ? (
            <span>Upload Prescription to Continue</span>
          ) : (
            <Link href="/checkout">Proceed to Checkout</Link>
          )}
        </Button>
      </div>
    </div>
  );
}