import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageLoader } from "@/components/LoadingSpinner";
import type { Order, OrderItem } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

export default function Orders() {
  const { isAuthenticated } = useAuth();

  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  if (isLoading) return <PageLoader />;

  if (!orders.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Package className="w-10 h-10 mb-2" />
        <p>No orders yet</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-3">
      {orders.map((o) => (
        <Card key={o.id} className="p-4">
          <p className="font-medium">Order #{o.orderNumber}</p>
          <p className="text-sm text-muted-foreground">
            ₹{Number(o.total).toFixed(0)}
          </p>
        </Card>
      ))}
    </div>
  );
}