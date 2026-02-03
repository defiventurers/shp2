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
  const isLowStock = stock > 0 && stock <= 10;

  const price = Number(medicine.price);
  const mrp = Number(medicine.mrp);
  const discount =
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const handleAdd = () => {
    if (!isOutOfStock) addItem(medicine, 1);
  };

  const handleIncrement = () => {
    if (quantity < stock) updateQuantity(medicine.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) updateQuantity(medicine.id, quantity - 1);
    else removeItem(medicine.id);
  };

  return (
    <Card
      className={cn(
        "p-3 transition-all",
        isOutOfStock && "opacity-60"
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-green-50 flex items-center justify-center">
          <Pill className="h-6 w-6 text-green-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title + badges */}
          <div className="flex justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-sm truncate">
                {medicine.name}
              </h3>

              {medicine.genericName && (
                <p className="text-xs text-muted-foreground truncate">
                  {medicine.genericName}
                </p>
              )}

              {medicine.manufacturer && medicine.manufacturer !== "nan" && (
                <p className="text-xs text-slate-500 truncate">
                  {medicine.manufacturer}
                </p>
              )}

              {medicine.packSize && (
                <p className="text-xs text-slate-500">
                  Pack: {medicine.packSize} units
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1">
              {medicine.isScheduleH && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Rx
                </Badge>
              )}

              {isLowStock && !isOutOfStock && (
                <Badge className="text-[10px] bg-amber-100 text-amber-800">
                  {stock} left
                </Badge>
              )}

              {isOutOfStock && (
                <Badge className="text-[10px] bg-red-100 text-red-800">
                  Out of stock
                </Badge>
              )}
            </div>
          </div>

          {/* Price + actions */}
          <div className="mt-2 flex items-center justify-between">
            <div>
              <span className="font-semibold text-base">
                ₹{price.toFixed(0)}
              </span>

              {discount > 0 && (
                <span className="ml-1 text-xs text-green-600">
                  ({discount}% off)
                </span>
              )}
            </div>

            {/* Add / Quantity */}
            {quantity === 0 ? (
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={isOutOfStock}
                className="h-8 px-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            ) : (
              <div className="flex items-center gap-1 bg-green-50 rounded-full px-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDecrement}
                  className="h-7 w-7 rounded-full"
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <span className="w-6 text-center text-sm font-medium">
                  {quantity}
                </span>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleIncrement}
                  disabled={quantity >= stock}
                  className="h-7 w-7 rounded-full"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Rx warning */}
          {medicine.isScheduleH && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Prescription required
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}