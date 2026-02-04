import { Plus, Minus, Pill, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCartContext } from "@/context/CartContext";
import type { Medicine } from "@shared/schema";
import { useState } from "react";

interface MedicineCardProps {
  medicine: Medicine;
}

export function MedicineCard({ medicine }: MedicineCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCartContext();
  const [showDetails, setShowDetails] = useState(false);

  const cartItem = items.find(
    (item) => item.medicine.id === medicine.id
  );
  const quantityInCart = cartItem?.quantity || 0;

  // 🔒 Quantity here = strip size (NOT availability)
  const stripQuantity =
    medicine.quantity && medicine.quantity > 0
      ? medicine.quantity
      : null;

  const handleAdd = () => {
    addItem(medicine, 1);
  };

  const handleIncrement = () => {
    updateQuantity(medicine.id, quantityInCart + 1);
  };

  const handleDecrement = () => {
    if (quantityInCart <= 1) {
      removeItem(medicine.id);
    } else {
      updateQuantity(medicine.id, quantityInCart - 1);
    }
  };

  return (
    <Card className="p-3 space-y-2">
      {/* TOP ROW */}
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Pill className="w-7 h-7 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight">
                {medicine.name?.toUpperCase()}
              </h3>

              {/* RX BADGE */}
              {medicine.isScheduleH && (
                <Badge
                  variant="destructive"
                  className="mt-1 text-[10px]"
                >
                  PRESCRIPTION REQUIRED
                </Badge>
              )}
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowDetails((v) => !v)}
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* DETAILS (TOGGLE) */}
      {showDetails && (
        <div className="text-xs text-muted-foreground space-y-1 pl-1">
          {stripQuantity ? (
            <div>
              <span className="font-medium text-foreground">
                Quantity:
              </span>{" "}
              {stripQuantity} tabs per strip
            </div>
          ) : (
            <div>
              <span className="font-medium text-foreground">
                Quantity:
              </span>{" "}
              Not specified
            </div>
          )}

          {medicine.manufacturer && (
            <div>
              <span className="font-medium text-foreground">
                Manufacturer:
              </span>{" "}
              {medicine.manufacturer}
            </div>
          )}
        </div>
      )}

      {/* ACTION ROW */}
      <div className="flex justify-between items-center pt-2">
        {/* PRICE */}
        <div className="text-base font-semibold">
          ₹
          {typeof medicine.price === "number"
            ? medicine.price.toFixed(0)
            : typeof medicine.price === "string"
            ? medicine.price.replace(/[^\d.]/g, "")
            : "—"}
        </div>

        {/* CART CONTROLS */}
        {quantityInCart === 0 ? (
          <Button
            size="sm"
            onClick={handleAdd}
            className="h-8 px-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-primary/10 rounded-full px-2 py-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDecrement}
              className="h-6 w-6"
            >
              <Minus className="w-3 h-3" />
            </Button>

            <span className="min-w-[20px] text-center text-sm font-medium">
              {quantityInCart}
            </span>

            <Button
              size="icon"
              variant="ghost"
              onClick={handleIncrement}
              className="h-6 w-6"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* RX NOTICE */}
      {medicine.isScheduleH && (
        <div className="flex items-center gap-1 text-[11px] text-amber-600 pt-1">
          <AlertTriangle className="w-3 h-3" />
          Prescription will be required at checkout
        </div>
      )}
    </Card>
  );
}