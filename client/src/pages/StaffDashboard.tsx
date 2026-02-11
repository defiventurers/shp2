cat > client/src/pages/StaffDashboard.tsx <<'EOF'
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Bell,
  MessageCircle,
  Phone,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://sacredheartpharma-backend.onrender.com";

type OrderItem = {
  id: string;
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
  billImageUrl?: string | null;
  deliveryType: "pickup" | "delivery";
  deliveryAddress?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  createdAt: string;
  items: OrderItem[];
};

const STATUS_FLOW = ["pending", "confirmed", "processing", "ready", "delivered"];

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
  const [adjustedDraft, setAdjustedDraft] = useState<Record<string, string>>({});
  const [lineDraft, setLineDraft] = useState<Record<string, { quantity: number; price: string }>>({});

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

  function seedLineDraft(rows: Order[]) {
    const next: Record<string, { quantity: number; price: string }> = {};
    for (const order of rows) {
      for (const item of order.items || []) {
        next[item.id] = {
          quantity: Number(item.quantity || 1),
          price: String(item.price || "0"),
        };
      }
    }
    setLineDraft(next);
  }

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
      seedLineDraft(rows);
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
      toast({ title: "Order status updated + customer notified" });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  }

  async function applyBilling(order: Order) {
    setUpdatingId(order.id);
    try {
      const discountAmount = Number(discountDraft[order.id] ?? order.discountAmount ?? 0);
      const adjustedTotal = Number(adjustedDraft[order.id] ?? order.adjustedTotal ?? order.total ?? 0);

      const res = await fetch(`${API_BASE}/api/orders/${order.id}/billing`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-staff-auth": "true",
        },
        body: JSON.stringify({ discountAmount, adjustedTotal }),
      });

      if (!res.ok) throw new Error();
      await fetchOrders();
      toast({ title: "Billing updated" });
    } catch {
      toast({ title: "Failed to update billing", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveLineItems(order: Order) {
    setUpdatingId(order.id);
    try {
      const items = order.items.map((item) => ({
        id: item.id,
        quantity: Number(lineDraft[item.id]?.quantity ?? item.quantity),
        price: Number(lineDraft[item.id]?.price ?? item.price),
      }));

      const res = await fetch(`${API_BASE}/api/orders/${order.id}/line-items`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-staff-auth": "true",
        },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error();
      await fetchOrders();
      toast({ title: "Order line items saved" });
    } catch {
      toast({ title: "Failed to save line items", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  }

  async function uploadBillImage(order: Order, file: File | null) {
    if (!file) return;
    setUpdatingId(order.id);

    try {
      const form = new FormData();
      form.append("billImage", file);

      const res = await fetch(`${API_BASE}/api/orders/${order.id}/bill-image`, {
        method: "POST",
        credentials: "include",
        headers: { "x-staff-auth": "true" },
        body: form,
      });

      if (!res.ok) throw new Error();
      await fetchOrders();
      toast({ title: "Bill image uploaded" });
    } catch {
      toast({ title: "Failed to upload bill image", variant: "destructive" });
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
        const whatsappLink = `https://wa.me/${phone.replace(/\D/g, "")}`;
        const callLink = `tel:${phone}`;

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
                <div className="text-sm space-y-1">
                  <strong>{order.customerName}</strong>
                  <p>📞 {phone}</p>
                  <div className="flex gap-2">
                    <a href={whatsappLink} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="gap-1">
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </Button>
                    </a>
                    <a href={callLink}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Phone className="w-3 h-3" /> Call
                      </Button>
                    </a>
                  </div>
                  {order.deliveryAddress && (
                    <p className="text-xs text-muted-foreground">📍 {order.deliveryAddress}</p>
                  )}
                </div>

                <div className="space-y-2 border rounded p-2">
                  <p className="text-xs text-muted-foreground">Edit medicines (price + qty)</p>
                  {order.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-sm">
                      <span className="col-span-6 truncate">{item.medicineName}</span>
                      <input
                        type="number"
                        min="1"
                        className="col-span-2 border rounded p-1"
                        value={lineDraft[item.id]?.quantity ?? item.quantity}
                        onChange={(e) =>
                          setLineDraft((prev) => ({
                            ...prev,
                            [item.id]: {
                              quantity: Math.max(1, Number(e.target.value || 1)),
                              price: prev[item.id]?.price ?? String(item.price),
                            },
                          }))
                        }
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="col-span-4 border rounded p-1"
                        value={lineDraft[item.id]?.price ?? String(item.price)}
                        onChange={(e) =>
                          setLineDraft((prev) => ({
                            ...prev,
                            [item.id]: {
                              quantity: prev[item.id]?.quantity ?? Number(item.quantity),
                              price: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  ))}
                  <Button size="sm" disabled={updatingId === order.id} onClick={() => saveLineItems(order)}>
                    Save Line Items
                  </Button>
                </div>

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
                    step="0.01"
                    placeholder="Discount amount"
                    value={discountDraft[order.id] ?? order.discountAmount ?? "0"}
                    onChange={(e) => setDiscountDraft((prev) => ({ ...prev, [order.id]: e.target.value }))}
                    className="w-full border rounded p-2 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Final bill price"
                    value={adjustedDraft[order.id] ?? order.adjustedTotal ?? order.total ?? "0"}
                    onChange={(e) => setAdjustedDraft((prev) => ({ ...prev, [order.id]: e.target.value }))}
                    className="w-full border rounded p-2 text-sm"
                  />
                  <Button size="sm" disabled={updatingId === order.id} onClick={() => applyBilling(order)}>
                    Save Billing
                  </Button>
                  <p className="text-sm">Current Final Total: ₹{Number(order.adjustedTotal || order.total || 0).toFixed(2)}</p>
                </div>

                <div className="space-y-2 border rounded p-2">
                  <p className="text-xs text-muted-foreground">Upload bill before dispatch</p>
                  <label className="inline-flex items-center gap-2 border rounded px-3 py-2 text-sm cursor-pointer">
                    <Upload className="w-3 h-3" /> Upload bill image
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => uploadBillImage(order, e.target.files?.[0] || null)}
                    />
                  </label>
                  {order.billImageUrl && (
                    <a className="text-xs text-blue-600 underline" href={order.billImageUrl} target="_blank" rel="noreferrer">
                      View uploaded bill image
                    </a>
                  )}
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
EOF
