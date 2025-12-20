import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/LoadingSpinner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import type { Order, OrderItem } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

type OrdersResponse = {
  success: boolean;
  orders: OrderWithItems[];
};

const statusConfig: Record<string, any> = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "bg-blue-100 text-blue-800" },
  ready: { label: "Ready", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  out_for_delivery: { label: "Out for Delivery", icon: Truck, color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-800" },
};

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: orders = [], isLoading } = useQuery<OrdersResponse>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
    select: (data) => data.orders,
  });

  if (authLoading || isLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-2">Login to View Orders</h2>
        <Button asChild>
          <a href="/api/auth/dev-login">Login</a>
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
        <Button asChild>
          <Link href="/inventory">Browse Inventory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 py-4 max-w-lg mx-auto space-y-3">
        {orders.map((order) => {
          const status = statusConfig[order.status || "pending"];
          const StatusIcon = status.icon;

          return (
            <Card key={order.id} className="p-4">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="font-medium">Order #{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt!).toLocaleString()}
                  </p>
                </div>
                <Badge className={status.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-2">
                {order.items.map(i => `${i.medicineName} x${i.quantity}`).join(", ")}
              </p>

              <div className="flex justify-between items-center">
                <p className="font-semibold">₹{Number(order.total).toFixed(0)}</p>
                <WhatsAppButton orderId={order.orderNumber} variant="inline" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
