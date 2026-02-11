import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Package,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PageLoader } from "@/components/LoadingSpinner";
import type { Order, OrderItem } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; icon: any; color: string }> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    color: "bg-blue-100 text-blue-800",
  },
  processing: {
    label: "Processing",
    icon: Clock,
    color: "bg-indigo-100 text-indigo-800",
  },
  ready: {
    label: "Ready",
    icon: Package,
    color: "bg-green-100 text-green-800",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: Truck,
    color: "bg-blue-100 text-blue-800",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-100 text-red-800",
  },
};

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: response, isLoading } = useQuery<{ orders: OrderWithItems[] } | OrderWithItems[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
    refetchInterval: 20000,
  });

  const orders: OrderWithItems[] = Array.isArray(response)
    ? response
    : response?.orders || [];

  if (authLoading || isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-semibold mb-2">Login to View Orders</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Sign in to see your past and current orders
        </p>
        <Button asChild>
          <a href="/api/auth/dev-login">Login</a>
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Once you place an order, it will appear here
        </p>
        <Button asChild>
          <Link href="/inventory">Browse Inventory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        <h1 className="text-lg font-semibold">My Orders</h1>

        <Card className="p-3 bg-green-50 border-green-200">
          <div className="flex gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0A7A3D] mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Need faster support? Tap "Contact Pharmacist" on any order and we will assist you with status, substitutions, and delivery updates.
            </p>
          </div>
        </Card>

        {orders.map((order) => {
          const status = STATUS_MAP[order.status || "pending"] || STATUS_MAP.pending;
          const StatusIcon = status.icon;

          return (
            <Card key={order.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Order #{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt!).toLocaleString("en-IN")}
                  </p>
                </div>

                <Badge className={status.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Current status: <strong className="capitalize">{status.label}</strong>
              </p>

              <div className="text-sm text-muted-foreground">
                {order.items.map((item) => `${item.medicineName} × ${item.quantity}`).join(", ")}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="font-semibold">₹{Number(order.adjustedTotal || order.total).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.deliveryType === "delivery" ? "Home Delivery" : "Store Pickup"}
                  </p>
                </div>

                <WhatsAppButton orderId={order.orderNumber} variant="inline" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
