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
  
  const cartItem = items.find((item) => item.medicine.id === medicine.id);
  const quantity = cartItem?.quantity || 0;
  const stock = medicine.stock;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;
  const price = parseFloat(medicine.price);
  const mrp = parseFloat(medicine.mrp);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const handleAdd = () => {
    if (!isOutOfStock && quantity < stock) {
      addItem(medicine, 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < stock) {
      updateQuantity(medicine.id, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(medicine.id, quantity - 1);
    } else {
      removeItem(medicine.id);
    }
  };

  return (
    <Card
      className={cn(
        "p-3 transition-all duration-200",
        isOutOfStock && "opacity-60"
      )}
      data-testid={`card-medicine-${medicine.id}`}
    >
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <Pill className="w-8 h-8 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm leading-tight truncate" data-testid={`text-medicine-name-${medicine.id}`}>
                {medicine.name}
              </h3>
              {medicine.genericName && (
                <p className="text-xs text-muted-foreground truncate">
                  {medicine.genericName}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {medicine.dosage} {medicine.form && `• ${medicine.form}`}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              {medicine.isScheduleH && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Rx
                </Badge>
              )}
              {isLowStock && !isOutOfStock && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  {stock} left
                </Badge>
              )}
              {isOutOfStock && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Out of Stock
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-base" data-testid={`text-price-${medicine.id}`}>
                ₹{price.toFixed(0)}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-xs text-muted-foreground line-through">
                    ₹{mrp.toFixed(0)}
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    {discount}% off
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center">
              {quantity === 0 ? (
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  data-testid={`button-add-${medicine.id}`}
                  className="h-8 px-3"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              ) : (
                <div className="flex items-center gap-1 bg-primary/10 rounded-full p-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleDecrement}
                    data-testid={`button-decrement-${medicine.id}`}
                    className="h-6 w-6 rounded-full"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium" data-testid={`text-quantity-${medicine.id}`}>
                    {quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleIncrement}
                    disabled={quantity >= stock}
                    data-testid={`button-increment-${medicine.id}`}
                    className="h-6 w-6 rounded-full"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {medicine.isScheduleH && (
            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              <span>Prescription required</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
