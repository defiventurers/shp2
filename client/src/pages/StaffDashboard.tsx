import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Phone,
  Truck,
  Bell,
  MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/* =========================
   CONFIG (FIXED)
========================= */
const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://sacredheartpharma-backend.onrender.com";

/* =========================
   TYPES
========================= */
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
   PHONE NORMALIZATION
========================= */
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

  const prevOrderCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (localStorage.getItem("staff_auth") !== "true") {
      navigate("/staff/login");
    }
  }, [navigate]);

  /* ---------------- SOUND ---------------- */
  useEffect(() => {
    audioRef.current = new Audio("/ding.mp3");
  }, []);

  /* ---------------- FETCH ORDERS ---------------- */
  async function fetchOrders() {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        credentials: "include",
        headers: { "x-staff-auth": "true" },
      });

      if (!res.ok) throw new Error();

      const data: Order[] = await res.json();

      if (data.length > prevOrderCount.current) {
        audioRef.current?.play().catch(() => {});
      }

      prevOrderCount.current = data.length;
      setOrders(data);
    } catch {
      toast({
        title: "Failed to fetch orders",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------- UPDATE STATUS ---------------- */
  async function updateStatus(order: Order, status: string) {
    setUpdatingId(order.id);

    try {
      const res = await fetch(
        `${API_BASE}/api/orders/${order.id}/status`,
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

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-lg font-semibold flex items-center gap-2">
        <Shield className="w-5 h-5 text-green-600" />
        Staff Dashboard
      </h1>

      {orders.map((order) => {
        const isOpen = expandedId === order.id;
        const phone = normalizeIndianPhone(order.customerPhone);

        return (
          <Card key={order.id} className="p-3 space-y-3">
            <div
              className="flex justify-between cursor-pointer"
              onClick={() =>
                setExpandedId(isOpen ? null : order.id)
              }
            >
              <div>
                <p className="font-medium">#{order.orderNumber}</p>
                <p className="text-xs capitalize">{order.status}</p>
              </div>
              {isOpen ? <ChevronUp /> : <ChevronDown />}
            </div>

            {isOpen && (
              <>
                <div className="text-sm">
                  <strong>{order.customerName}</strong>
                  <p>📞 {phone}</p>
                </div>

                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{i.medicineName} × {i.quantity}</span>
                    <span>₹{i.price}</span>
                  </div>
                ))}

                <select
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(e) =>
                    updateStatus(order, e.target.value)
                  }
                  className="w-full border rounded p-2"
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
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
