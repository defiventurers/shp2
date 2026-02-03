import { Plus, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartContext } from "@/context/CartContext";
import type { Medicine } from "@shared/schema";

interface MedicineCardProps {
  medicine: Medicine;
}

export function MedicineCard({ medicine }: MedicineCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCartContext();

  const cartItem = items.find((i) => i.medicine.id === medicine.id);
  const quantityInCart = cartItem?.quantity ?? 0;

  const stock = medicine.stock;
  const isOutOfStock = stock <= 0;

  const add = () => !isOutOfStock && addItem(medicine, 1);
  const inc = () => quantityInCart < stock && updateQuantity(medicine.id, quantityInCart + 1);
  const dec = () =>
    quantityInCart > 1
      ? updateQuantity(medicine.id, quantityInCart - 1)
      : removeItem(medicine.id);

  return (
    <Card className="p-3 space-y-2">
      {/* NAME + RX */}
      <div className="flex items-start gap-2">
        {medicine.isScheduleH && (
          <Badge variant="destructive" className="text-[10px] shrink-0">
            Rx
          </Badge>
        )}

        <h3 className="text-sm font-medium leading-tight">
          {medicine.name}
        </h3>
      </div>

      {/* QUANTITY */}
      {medicine.packSize && (
        <p className="text-xs text-muted-foreground">
          Qty: {medicine.packSize} units
        </p>
      )}

      {/* ACTION */}
      <div className="pt-1">
        {quantityInCart === 0 ? (
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
          <div className="flex items-center justify-between border rounded-md px-3 py-1.5">
            <Button size="icon" variant="ghost" onClick={dec}>
              <Minus className="w-4 h-4" />
            </Button>

            <span className="text-sm font-medium">
              {quantityInCart}
            </span>

            <Button size="icon" variant="ghost" onClick={inc}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}