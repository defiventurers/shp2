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

type RequestedItem = {
  id: string;
  name: string;
  quantity: number;
  customerNotes?: string;
  status?: "pending" | "available" | "not_available";
  pharmacistPricePerUnit?: number | null;
  pharmacistNote?: string;
};

type OrderPrescription = {
  id: string;
  name?: string | null;
  imageUrls?: string[] | null;
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
  requestedItems?: RequestedItem[];
  prescription?: OrderPrescription | null;
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
  const [discountDraft, setDiscountDraft] = useState<Record<string, string>>(
    {}
  );
  const [adjustedDraft, setAdjustedDraft] = useState<Record<string, string>>(
    {}
  );
  const [lineDraft, setLineDraft] = useState<
    Record<string, { quantity: number; price: string }>
  >({});
  const [requestedDraft, setRequestedDraft] = useState<
    Record<
      string,
      {
        status: "pending" | "available" | "not_available";
        pharmacistPricePerUnit: string;
        pharmacistNote: string;
      }
    >
  >({});

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

  function seedRequestedDraft(rows: Order[]) {
    const next: Record<
      string,
      {
        status: "pending" | "available" | "not_available";
        pharmacistPricePerUnit: string;
        pharmacistNote: string;
      }
    > = {};

    for (const order of rows) {
      for (const item of order.requestedItems || []) {
        next[item.id] = {
          status: (item.status as any) || "pending",
          pharmacistPricePerUnit:
            item.pharmacistPricePerUnit == null
              ? ""
              : String(item.pharmacistPricePerUnit),
          pharmacistNote: String(item.pharmacistNote || ""),
        };
      }
    }

    setRequestedDraft(next);
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
      seedRequestedDraft(rows);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const discountAmount = Number(
        discountDraft[order.id] ?? order.discountAmount ?? 0
      );
      const adjustedTotal = Number(
        adjustedDraft[order.id] ?? order.adjustedTotal ?? order.total ?? 0
      );

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

  async function saveRequestedItems(order: Order) {
    setUpdatingId(order.id);

    try {
      const payload = (order.requestedItems || []).map((item) => ({
        id: item.id,
        status: requestedDraft[item.id]?.status || item.status || "pending",
        pharmacistPricePerUnit:
          requestedDraft[item.id]?.status === "available"
            ? Number(requestedDraft[item.id]?.pharmacistPricePerUnit || 0)
            : null,
        pharmacistNote: requestedDraft[item.id]?.pharmacistNote || "",
      }));

      const res = await fetch(
        `${API_BASE}/api/orders/${order.id}/requested-items`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-staff-auth": "true",
          },
          body: JSON.stringify({ requestedItems: payload }),
        }
      );

      if (!res.ok) throw new Error();

      await fetchOrders();
      toast({ title: "Requested items updated" });
    } catch {
      toast({
        title: "Failed to update requested items",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  async function uploadBillImage(order: Order, file: File | null) {
    if (!file) return;

    setUpdatingId(order.id);
    try {
      const formData = new FormData();
      formData.append("billImage", file);

      const res = await fetch(`${API_BASE}/api/orders/${order.id}/bill-image`, {
        method: "POST",
        credentials: "include",
        headers: { "x-staff-auth": "true" },
        body: formData,
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
    <div className="min-h-screen p-4 max-w-3xl mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0A7A3D]" /> Staff Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">
            Live orders • auto-refresh every 20s
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs">
          <Bell className="w-3 h-3" /> Live
        </div>
      </div>

      {orders.map((order) => {
        const isOpen = expandedId === order.id;
        const phone = normalizeIndianPhone(order.customerPhone);
        const whatsappLink = `https://wa.me/${phone.replace("+", "")}`;
        const callLink = `tel:${phone}`;

        return (
          <Card key={order.id} className="p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">#{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString("en-IN")}
                </p>
                <p className="text-sm mt-1">
                  {order.customerName} •{" "}
                  {order.deliveryType === "delivery" ? "Delivery" : "Pickup"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold">
                  ₹{Number(order.adjustedTotal || order.total || 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {order.status}
                </p>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setExpandedId(isOpen ? null : order.id)}
              >
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
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
                    <p className="text-xs text-muted-foreground">
                      📍 {order.deliveryAddress}
                    </p>
                  )}
                </div>

                <div className="space-y-2 border rounded p-2">
                  <p className="text-xs text-muted-foreground">Prescription</p>
                  {order.prescription ? (
                    <>
                      <p className="text-sm font-medium">
                        {order.prescription.name ||
                          `Prescription ${order.prescription.id.slice(0, 8)}`}
                      </p>
                      {order.prescription.imageUrls &&
                      order.prescription.imageUrls.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto">
                          {order.prescription.imageUrls.map((url, idx) => (
                            <a
                              key={`${url}-${idx}`}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={url}
                                alt={`Prescription page ${idx + 1}`}
                                className="h-16 w-16 rounded border object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No prescription images attached.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No prescription attached to this order.
                    </p>
                  )}
                </div>

                {!!order.requestedItems?.length && (
                  <div className="space-y-2 border rounded p-2">
                    <p className="text-xs text-muted-foreground">
                      Requested Items
                    </p>
                    {order.requestedItems.map((item) => {
                      const draft = requestedDraft[item.id] || {
                        status: item.status || "pending",
                        pharmacistPricePerUnit:
                          item.pharmacistPricePerUnit == null
                            ? ""
                            : String(item.pharmacistPricePerUnit),
                        pharmacistNote: item.pharmacistNote || "",
                      };

                      return (
                        <div key={item.id} className="border rounded p-2 space-y-2">
                          <p className="text-sm font-medium">
                            {item.name} × {item.quantity}
                          </p>
                          {item.customerNotes ? (
                            <p className="text-xs text-muted-foreground">
                              Customer note: {item.customerNotes}
                            </p>
                          ) : null}

                          <select
                            value={draft.status}
                            className="w-full border rounded p-2 text-sm"
                            onChange={(e) =>
                              setRequestedDraft((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...draft,
                                  status: e.target.value as
                                    | "pending"
                                    | "available"
                                    | "not_available",
                                },
                              }))
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="available">Available</option>
                            <option value="not_available">Not Available</option>
                          </select>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={draft.status !== "available"}
                            placeholder="Price per unit (₹)"
                            className="w-full border rounded p-2 text-sm"
                            value={draft.pharmacistPricePerUnit}
                            onChange={(e) =>
                              setRequestedDraft((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...draft,
                                  pharmacistPricePerUnit: e.target.value,
                                },
                              }))
                            }
                          />

                          <input
                            type="text"
                            placeholder="Pharmacist note"
                            className="w-full border rounded p-2 text-sm"
                            value={draft.pharmacistNote}
                            onChange={(e) =>
                              setRequestedDraft((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...draft,
                                  pharmacistNote: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      );
                    })}

                    <Button
                      size="sm"
                      disabled={updatingId === order.id}
                      onClick={() => saveRequestedItems(order)}
                    >
                      Save Requested Items
                    </Button>
                  </div>
                )}

                {!!order.items.length && (
                  <div className="space-y-2 border rounded p-2">
                    <p className="text-xs text-muted-foreground">
                      Edit medicines (price + qty)
                    </p>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-2 items-center text-sm"
                      >
                        <span className="col-span-6 truncate">
                          {item.medicineName}
                        </span>
                        <input
                          type="number"
                          min="1"
                          className="col-span-2 border rounded p-1"
                          value={lineDraft[item.id]?.quantity ?? item.quantity}
                          onChange={(e) =>
                            setLineDraft((prev) => ({
                              ...prev,
                              [item.id]: {
                                quantity: Math.max(
                                  1,
                                  Number(e.target.value || 1)
                                ),
                                price:
                                  prev[item.id]?.price ?? String(item.price),
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
                                quantity:
                                  prev[item.id]?.quantity ??
                                  Number(item.quantity),
                                price: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    ))}
                    <Button
                      size="sm"
                      disabled={updatingId === order.id}
                      onClick={() => saveLineItems(order)}
                    >
                      Save Line Items
                    </Button>
                  </div>
                )}

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
                  <p className="text-xs text-muted-foreground">
                    Billing adjustment
                  </p>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Discount amount"
                    value={discountDraft[order.id] ?? order.discountAmount ?? "0"}
                    onChange={(e) =>
                      setDiscountDraft((prev) => ({
                        ...prev,
                        [order.id]: e.target.value,
                      }))
                    }
                    className="w-full border rounded p-2 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Final bill price"
                    value={
                      adjustedDraft[order.id] ??
                      order.adjustedTotal ??
                      order.total ??
                      "0"
                    }
                    onChange={(e) =>
                      setAdjustedDraft((prev) => ({
                        ...prev,
                        [order.id]: e.target.value,
                      }))
                    }
                    className="w-full border rounded p-2 text-sm"
                  />
                  <Button
                    size="sm"
                    disabled={updatingId === order.id}
                    onClick={() => applyBilling(order)}
                  >
                    Save Billing
                  </Button>
                  <p className="text-sm">
                    Current Final Total: ₹
                    {Number(order.adjustedTotal || order.total || 0).toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2 border rounded p-2">
                  <p className="text-xs text-muted-foreground">
                    Upload bill before dispatch
                  </p>
                  <label className="inline-flex items-center gap-2 border rounded px-3 py-2 text-sm cursor-pointer">
                    <Upload className="w-3 h-3" /> Upload bill image
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        uploadBillImage(order, e.target.files?.[0] || null)
                      }
                    />
                  </label>
                  {order.billImageUrl && (
                    <a
                      className="text-xs text-blue-600 underline"
                      href={order.billImageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
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
