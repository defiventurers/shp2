import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Bell,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://sacredheartpharma-backend.onrender.com";

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
  adjustedTotal?: string | null;
  discountAmount?: string | null;
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

function normalizeIndianPhone(input: string): string {
  if (!input) return "";
  let phone = input.replace(/[^\d+]/g, "");

  if (phone.startsWith("+91") && phone.length === 13) return phone;
  if (phone.startsWith("91") && phone.length === 12) return `+${phone}`;
  if (phone.length === 10) return `+91${phone}`;

  return phone;
}

export default function StaffDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [discountDraft, setDiscountDraft] = useState<Record<string, string>>({});

  const prevOrderCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (localStorage.getItem("staff_auth") !== "true") {
      navigate("/staff/login");
    }
  }, [navigate]);

  useEffect(() => {
    audioRef.current = new Audio("/ding.mp3");
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        credentials: "include",
        headers: { "x-staff-auth": "true" },
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      const rows: Order[] = Array.isArray(data) ? data : data.orders || [];

      if (rows.length > prevOrderCount.current) {
        audioRef.current?.play().catch(() => {});
      }

      prevOrderCount.current = rows.length;
      setOrders(rows);
    } catch {
      toast({
        title: "Failed to fetch orders",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 20000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(order: Order, status: string) {
    setUpdatingId(order.id);

    try {
      const res = await fetch(`${API_BASE}/api/orders/${order.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-staff-auth": "true",
        },
        body: JSON.stringify({ status }),
      });

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

  async function applyDiscount(order: Order) {
    setUpdatingId(order.id);

    try {
      const discountAmount = Number(discountDraft[order.id] || 0);

      const res = await fetch(`${API_BASE}/api/orders/${order.id}/billing`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-staff-auth": "true",
        },
        body: JSON.stringify({ discountAmount }),
      });

      if (!res.ok) throw new Error();

      await fetchOrders();
      toast({ title: "Discount applied" });
    } catch {
      toast({
        title: "Failed to apply discount",
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
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Bell className="w-3 h-3" /> Live order feed refreshes every 20 seconds
      </p>

      {orders.map((order) => {
        const isOpen = expandedId === order.id;
        const phone = normalizeIndianPhone(order.customerPhone);

        return (
          <Card key={order.id} className="p-3 space-y-3">
            <div
              className="flex justify-between cursor-pointer"
              onClick={() => setExpandedId(isOpen ? null : order.id)}
            >
              <div>
                <p className="font-medium">#{order.orderNumber}</p>
                <p className="text-xs capitalize">Current status: {order.status}</p>
              </div>
              {isOpen ? <ChevronUp /> : <ChevronDown />}
            </div>

            {isOpen && (
              <>
                <div className="text-sm">
                  <strong>{order.customerName}</strong>
                  <p>📞 {phone}</p>
                  {order.deliveryAddress && (
                    <p className="text-xs text-muted-foreground">📍 {order.deliveryAddress}</p>
                  )}
                </div>

                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>
                      {i.medicineName} × {i.quantity}
                    </span>
                    <span>₹{i.price}</span>
                  </div>
                ))}

                <select
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(e) => updateStatus(order, e.target.value)}
                  className="w-full border rounded p-2"
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <div className="space-y-2 border rounded p-2">
                  <p className="text-xs text-muted-foreground">Billing adjustment</p>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Discount amount"
                    value={discountDraft[order.id] ?? order.discountAmount ?? "0"}
                    onChange={(e) =>
                      setDiscountDraft((prev) => ({ ...prev, [order.id]: e.target.value }))
                    }
                    className="w-full border rounded p-2 text-sm"
                  />
                  <Button
                    size="sm"
                    disabled={updatingId === order.id}
                    onClick={() => applyDiscount(order)}
                  >
                    Apply Discount
                  </Button>
                  <p className="text-sm">
                    Final Total: ₹
                    {Number(order.adjustedTotal || order.total || 0).toFixed(2)}
                  </p>
                </div>
              </>
            )}
          </Card>
        );
      })}

      <Button variant="destructive" onClick={logout}>
        Logout Staff
      </Button>
    </div>
  );
}
