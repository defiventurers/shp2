import { Plus, Minus, Pill, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCartContext } from "@/context/CartContext";
import type { Medicine } from "@shared/schema";
import { cn } from "@/lib/utils";

interface MedicineCardProps {
  medicine: Medicine;
}

export function MedicineCard({ medicine }: MedicineCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCartContext();

  const cartItem = items.find((i) => i.medicine.id === medicine.id);
  const quantity = cartItem?.quantity ?? 0;

  const stock = medicine.stock;
  const isOutOfStock = stock <= 0;

  const price = Number(medicine.price);
  const mrp = Number(medicine.mrp);
  const discount =
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  /* -------------------------
     Handlers
  -------------------------- */
  const add = () => !isOutOfStock && addItem(medicine, 1);
  const inc = () => quantity < stock && updateQuantity(medicine.id, quantity + 1);
  const dec = () =>
    quantity > 1
      ? updateQuantity(medicine.id, quantity - 1)
      : removeItem(medicine.id);

  return (
    <Card
      className={cn(
        "p-3",
        isOutOfStock && "opacity-60"
      )}
    >
      {/* TOP */}
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Pill className="w-7 h-7 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          {/* NAME + RX */}
          <div className="flex items-start gap-2">
            <h3 className="font-medium text-sm leading-tight">
              {medicine.name}
            </h3>

            {medicine.isScheduleH && (
              <Badge
                variant="destructive"
                className="text-[10px] h-fit px-1.5 py-0"
              >
                Rx
              </Badge>
            )}
          </div>

          {/* COMPOSITION (ONE LINE) */}
          {medicine.genericName && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {medicine.genericName}
            </p>
          )}

          {/* MANUFACTURER */}
          {medicine.manufacturer && (
            <p className="text-xs text-muted-foreground">
              {medicine.manufacturer}
            </p>
          )}

          {/* PACK SIZE */}
          {medicine.packSize && (
            <p className="text-xs text-muted-foreground">
              Pack: {medicine.packSize} units
            </p>
          )}
        </div>
      </div>

      {/* PRICE */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-base font-semibold">
          ₹{price.toFixed(0)}
        </span>

        {discount > 0 && (
          <>
            <span className="text-xs line-through text-muted-foreground">
              ₹{mrp.toFixed(0)}
            </span>
            <span className="text-xs text-green-600 font-medium">
              {discount}% off
            </span>
          </>
        )}
      </div>

      {/* RX WARNING */}
      {medicine.isScheduleH && (
        <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
          <AlertTriangle className="w-3 h-3" />
          Prescription required
        </div>
      )}

      {/* ACTIONS (MOBILE FIRST) */}
      <div className="mt-3">
        {quantity === 0 ? (
          <Button
            className="w-full"
            size="sm"
            onClick={add}
            disabled={isOutOfStock}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        ) : (
          <div className="flex items-center justify-between border rounded-lg px-3 py-2">
            <Button size="icon" variant="ghost" onClick={dec}>
              <Minus className="w-4 h-4" />
            </Button>

            <span className="font-medium">{quantity}</span>

            <Button
              size="icon"
              variant="ghost"
              onClick={inc}
              disabled={quantity >= stock}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}