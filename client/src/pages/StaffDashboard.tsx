import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Package,
  Shield,
  ChevronDown,
  ChevronUp,
  Phone,
  Truck,
  Mail,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type OrderItem = {
  medicineName: string;
  quantity: number;
  price: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  deliveryType: "pickup" | "delivery";
  deliveryAddress?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  createdAt: string;
  items: OrderItem[];
};

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "delivered",
];

export default function StaffDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /* -----------------------------
     STAFF AUTH GUARD
  ------------------------------ */
  useEffect(() => {
    const isStaff = localStorage.getItem("staff_auth") === "true";
    if (!isStaff) {
      navigate("/staff/login");
    }
  }, [navigate]);

  /* -----------------------------
     FETCH ALL ORDERS (STAFF)
  ------------------------------ */
  async function fetchOrders() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders`,
        {
          credentials: "include",
          headers: { "x-staff-auth": "true" },
        }
      );

      if (!res.ok) throw new Error();
      setOrders(await res.json());
    } catch {
      toast({
        title: "Failed to load orders",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60000); // 🔁 auto refresh
    return () => clearInterval(interval);
  }, []);

  /* -----------------------------
     UPDATE ORDER STATUS
  ------------------------------ */
  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-staff-auth": "true",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!res.ok) throw new Error();
      await fetchOrders();
      toast({ title: "Order status updated" });
    } catch {
      toast({
        title: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  function logout() {
    localStorage.removeItem("staff_auth");
    navigate("/staff/login");
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-lg font-semibold flex items-center gap-2">
        <Shield className="w-5 h-5 text-green-600" />
        Staff Dashboard
      </h1>

      {/* =============================
         ORDERS
      ============================== */}
      {orders.length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">
          No orders yet.
        </Card>
      ) : (
        orders.map((order) => {
          const isOpen = expandedId === order.id;
          const currentIndex = STATUS_FLOW.indexOf(order.status);

          return (
            <Card
              key={order.id}
              className={`p-3 space-y-3 ${
                order.deliveryType === "delivery"
                  ? "border-l-4 border-green-600"
                  : ""
              }`}
            >
              {/* HEADER */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() =>
                  setExpandedId(isOpen ? null : order.id)
                }
              >
                <div>
                  <p className="text-sm font-medium">
                    #{order.orderNumber}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {order.deliveryType}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    ₹{Number(order.total).toFixed(0)}
                  </span>
                  {isOpen ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {/* EXPANDED */}
              {isOpen && (
                <div className="space-y-4">
                  {/* CUSTOMER INFO */}
                  <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
                    <p>
                      <strong>{order.customerName}</strong>
                    </p>
                    <p className="flex items-center gap-1">
                      <Phone size={14} /> {order.customerPhone}
                    </p>

                    {order.customerEmail && (
                      <p className="flex items-center gap-1">
                        <Mail size={14} /> {order.customerEmail}
                      </p>
                    )}

                    {order.deliveryType === "delivery" &&
                      order.deliveryAddress && (
                        <p className="flex items-center gap-1">
                          <Truck size={14} /> {order.deliveryAddress}
                        </p>
                      )}
                  </div>

                  {/* ITEMS */}
                  <div className="border-t pt-2 space-y-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.medicineName} × {item.quantity}
                        </span>
                        <span>
                          ₹{Number(item.price).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* STATUS CONTROL */}
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) =>
                      updateStatus(order.id, e.target.value)
                    }
                  >
                    {STATUS_FLOW.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </Card>
          );
        })
      )}

      <Button
        variant="destructive"
        className="w-full"
        onClick={logout}
      >
        Logout Staff
      </Button>
    </div>
  );
}