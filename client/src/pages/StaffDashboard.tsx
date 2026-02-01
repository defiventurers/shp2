import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Package,
  Shield,
  ChevronDown,
  ChevronUp,
  Phone,
  Truck,
  Mail,
  Bell,
  MessageCircle,
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

/* =========================
   PHONE NORMALIZATION (IN)
========================= */
function normalizeIndianPhone(input: string): string {
  if (!input) return "";
  let phone = input.replace(/[^\d+]/g, "");

  if (phone.startsWith("+91") && phone.length === 13) return phone;
  if (phone.startsWith("91") && phone.length === 12) return `+${phone}`;
  if (phone.length === 10) return `+91${phone}`;

  return phone;
}

/* =========================
   WHATSAPP MESSAGE
========================= */
function buildWhatsAppMessage(order: Order) {
  return encodeURIComponent(
    `Hello ${order.customerName},\n\nYour order ${order.orderNumber} from Sacred Heart Pharmacy has been delivered successfully.\n\nThank you for choosing us 💚`
  );
}

export default function StaffDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const prevOrderCount = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* -----------------------------
     STAFF AUTH GUARD
  ------------------------------ */
  useEffect(() => {
    if (localStorage.getItem("staff_auth") !== "true") {
      navigate("/staff/login");
    }
  }, [navigate]);

  /* -----------------------------
     SOUND INIT
  ------------------------------ */
  useEffect(() => {
    audioRef.current = new Audio("/ding.mp3");
  }, []);

  /* -----------------------------
     FETCH ORDERS
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

      const data: Order[] = await res.json();

      if (data.length > prevOrderCount.current) {
        audioRef.current?.play().catch(() => {});
      }

      prevOrderCount.current = data.length;
      setOrders(data);
    } catch {
      toast({
        title: "Failed to load orders",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  /* -----------------------------
     UPDATE STATUS
  ------------------------------ */
  async function updateStatus(order: Order, status: string) {
    setUpdatingId(order.id);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/${order.id}/status`,
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

      // ✅ AUTO WHATSAPP ON DELIVERY
      if (status === "delivered") {
        const phone = normalizeIndianPhone(order.customerPhone);
        const msg = buildWhatsAppMessage(order);
        window.open(`https://wa.me/${phone.replace("+", "")}?text=${msg}`);
      }

      toast({ title: "Order updated" });
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

  const pendingCount = orders.filter(
    (o) => o.status === "pending"
  ).length;

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          Staff Dashboard
        </h1>

        {pendingCount > 0 && (
          <div className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
            <Bell size={14} />
            {pendingCount} Pending
          </div>
        )}
      </div>

      {/* ORDERS */}
      {orders.map((order) => {
        const isOpen = expandedId === order.id;
        const phone = normalizeIndianPhone(order.customerPhone);

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

            {isOpen && (
              <div className="space-y-4">
                {/* CUSTOMER */}
                <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
                  <p>
                    <strong>{order.customerName}</strong>
                  </p>
                  <p className="text-xs">📞 {phone}</p>

                  <div className="flex gap-4">
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center gap-1 text-green-700"
                    >
                      <Phone size={14} />
                      Call
                    </a>

                    <a
                      href={`https://wa.me/${phone.replace("+", "")}`}
                      target="_blank"
                      className="flex items-center gap-1 text-green-700"
                    >
                      <MessageCircle size={14} />
                      WhatsApp
                    </a>
                  </div>

                  {order.deliveryType === "delivery" &&
                    order.deliveryAddress && (
                      <p className="text-xs flex items-center gap-1">
                        <Truck size={12} />
                        {order.deliveryAddress}
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

                {/* STATUS */}
                <select
                  className="w-full border rounded-md p-2 text-sm"
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(e) =>
                    updateStatus(order, e.target.value)
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
      })}

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