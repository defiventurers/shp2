import { useState } from "react";
import { Plus, Minus, Pill, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartContext } from "@/context/CartContext";
import type { Medicine } from "@shared/schema";
import { cn } from "@/lib/utils";

interface MedicineCardProps {
  medicine: Medicine;
}

export function MedicineCard({ medicine }: MedicineCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCartContext();
  const [expanded, setExpanded] = useState(false);

  const cartItem = items.find((i) => i.medicine.id === medicine.id);
  const quantity = cartItem?.quantity || 0;

  const price = Number(medicine.price || 0);
  const stock = medicine.stock ?? 0;

  const isRx = medicine.isScheduleH === true;
  const isOutOfStock = stock <= 0;

  /* -----------------------------
     Handlers
  ------------------------------ */
  const handleAdd = () => {
    if (!isOutOfStock) addItem(medicine, 1);
  };

  const handleIncrement = () => {
    if (quantity < stock) {
      updateQuantity(medicine.id, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity <= 1) removeItem(medicine.id);
    else updateQuantity(medicine.id, quantity - 1);
  };

  return (
    <Card
      className={cn(
        "p-3 space-y-3 border rounded-xl",
        isOutOfStock && "opacity-60"
      )}
    >
      {/* -----------------------------
          TOP ROW
      ------------------------------ */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <Pill className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">
            {medicine.name}
          </p>

          {/* RX BADGE */}
          {isRx && (
            <Badge
              variant="destructive"
              className="mt-1 text-[10px] px-2 py-0.5 w-fit"
            >
              Prescription Required
            </Badge>
          )}
        </div>
      </div>

      {/* -----------------------------
          PRICE + QUANTITY
      ------------------------------ */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-bold">₹{price.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">
            {stock} tabs available
          </p>
        </div>

        {/* ADD / COUNTER */}
        {quantity === 0 ? (
          <Button
            size="sm"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className="h-8 px-4 rounded-full"
          >
            Add
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-primary/10 rounded-full px-2 py-1">
            <Button size="icon" variant="ghost" onClick={handleDecrement}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">{quantity}</span>
            <Button size="icon" variant="ghost" onClick={handleIncrement}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* -----------------------------
          EXPAND TO VIEW MORE
      ------------------------------ */}
      {(medicine.manufacturer || medicine.imageUrl) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Hide details" : "View details"}
        </button>
      )}

      {expanded && (
        <div className="space-y-2 pt-1">
          {medicine.manufacturer && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Manufacturer:</span>{" "}
              {medicine.manufacturer}
            </p>
          )}

          {medicine.imageUrl && (
            <img
              src={medicine.imageUrl}
              alt={medicine.name}
              className="w-full max-w-[120px] rounded-md border"
              loading="lazy"
            />
          )}
        </div>
      )}
    </Card>
  );
}