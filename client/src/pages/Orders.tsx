import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Package, Clock, CheckCircle, Truck, XCircle, MapPin, Phone, ChevronRight } from "lucide-react";
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

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: Package },
  ready: { label: "Ready for Pickup", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  out_for_delivery: { label: "Out for Delivery", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-xl mb-2">Login to View Orders</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            Sign in to see your order history and track deliveries
          </p>
          <Button asChild>
            <a href="/api/login" data-testid="button-login-orders">
              Login to Continue
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-xl mb-2">No Orders Yet</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            Your order history will appear here once you place your first order
          </p>
          <Button asChild>
            <Link href="/inventory" data-testid="link-browse-orders">
              Browse Inventory
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 py-4 max-w-lg mx-auto">
        <h1 className="font-semibold text-lg mb-4">My Orders</h1>

        <div className="space-y-3">
          {orders.map((order) => {
            const status = statusConfig[order.status || "pending"];
            const StatusIcon = status.icon;
            const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

            return (
              <Card key={order.id} className="p-4" data-testid={`order-${order.id}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium text-sm" data-testid={`text-order-number-${order.id}`}>
                      Order #{order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt!).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge className={status.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  {order.deliveryType === "pickup" ? (
                    <>
                      <MapPin className="w-3 h-3" />
                      <span>Store Pickup</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-3 h-3" />
                      <span>Home Delivery</span>
                    </>
                  )}
                  <span className="mx-1">•</span>
                  <span>{itemCount} items</span>
                </div>

                <div className="bg-muted/50 rounded-lg p-2 mb-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {order.items?.map((item) => `${item.medicineName} x${item.quantity}`).join(", ")}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-semibold" data-testid={`text-order-total-${order.id}`}>
                    ₹{parseFloat(order.total).toFixed(0)}
                  </p>
                  <div className="flex items-center gap-2">
                    <WhatsAppButton orderId={order.orderNumber} variant="inline" className="h-8 text-xs px-3" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
