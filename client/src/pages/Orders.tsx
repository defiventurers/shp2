import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PageLoader } from "@/components/LoadingSpinner";
import type { Order, OrderItem } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

/* ---------------- STATUS CONFIG (BACKEND SAFE) ---------------- */
const STATUS_MAP: Record<
  string,
  { label: string; icon: any; color: string }
> = {
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
    icon: Package,
    color: "bg-blue-100 text-blue-800",
  },
  ready: {
    label: "Ready",
    icon: Package,
    color: "bg-green-100 text-green-800",
  },
  delivered: {
    label: "Delivered",
    icon: Truck,
    color: "bg-green-100 text-green-800",
  },
};

export default function Orders() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders`,
        {
          credentials: "include", // 🔥 REQUIRED
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }

      return res.json();
    },
  });

  /* ---------------- LOADING ---------------- */
  if (authLoading || isLoading) {
    return <PageLoader />;
  }

  /* ---------------- NOT LOGGED IN ---------------- */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-semibold mb-2">
          Login to View Orders
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Sign in to see your past and current orders
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  /* ---------------- NO ORDERS ---------------- */
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

  /* ---------------- ORDERS LIST ---------------- */
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        <h1 className="text-lg font-semibold">My Orders</h1>

        {orders.map((order) => {
          const status =
            STATUS_MAP[order.status || "pending"] ??
            STATUS_MAP.pending;

          const StatusIcon = status.icon;

          return (
            <Card key={order.id} className="p-4 space-y-3">
              {/* HEADER */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    Order #{order.orderNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt!).toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>

                <Badge className={status.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              {/* ITEMS */}
              <div className="text-sm text-muted-foreground">
                {order.items
                  .map(
                    (item) =>
                      `${item.medicineName} × ${item.quantity}`
                  )
                  .join(", ")}
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="font-semibold">
                    ₹{Number(order.total).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.deliveryType === "delivery"
                      ? "Home Delivery"
                      : "Store Pickup"}
                  </p>
                </div>

                <WhatsAppButton
                  orderId={order.orderNumber}
                  variant="inline"
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}