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

  const cartItem = items.find(i => i.medicine.id === medicine.id);
  const quantity = cartItem?.quantity ?? 0;

  const stock = medicine.stock;
  const isOutOfStock = stock <= 0;

  const price = Number(medicine.price);

  return (
    <Card className={cn("p-3", isOutOfStock && "opacity-60")}>
      <div className="flex gap-3">
        {/* Icon */}
        <div className="h-11 w-11 rounded-lg bg-green-50 flex items-center justify-center">
          <Pill className="h-5 w-5 text-green-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {medicine.name}
              </p>

              {medicine.genericName && (
                <p className="text-xs text-slate-500 truncate">
                  {medicine.genericName}
                </p>
              )}

              {medicine.manufacturer && medicine.manufacturer !== "nan" && (
                <p className="text-xs text-slate-400 truncate">
                  {medicine.manufacturer}
                </p>
              )}

              {medicine.packSize && (
                <p className="text-xs text-slate-400">
                  Pack: {medicine.packSize} units
                </p>
              )}
            </div>

            {/* RX badge */}
            {medicine.isScheduleH && (
              <Badge variant="destructive" className="text-[10px]">
                Rx
              </Badge>
            )}
          </div>

          {/* Bottom row */}
          <div className="mt-2 flex items-center justify-between">
            <span className="font-semibold text-base">
              ₹{price.toFixed(0)}
            </span>

            {quantity === 0 ? (
              <Button
                size="sm"
                disabled={isOutOfStock}
                onClick={() => addItem(medicine, 1)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            ) : (
              <div className="flex items-center gap-1 bg-green-50 rounded-full px-1">
                <Button size="icon" variant="ghost" onClick={() => updateQuantity(medicine.id, quantity - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm">{quantity}</span>
                <Button size="icon" variant="ghost" onClick={() => updateQuantity(medicine.id, quantity + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Prescription warning */}
          {medicine.isScheduleH && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-red-600">
              <AlertTriangle className="h-3 w-3" />
              Prescription required
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}