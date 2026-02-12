import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartContext } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal?: string;
  deliveryFee?: string;
  total: string;
  adjustedTotal?: string;
  discountAmount?: string;
  promoCode?: string | null;
  createdAt: string;
  deliveryAddress?: string | null;
  items: {
    medicineName: string;
    quantity: number;
  }[];
  requestedItems?: {
    id: string;
    name: string;
    quantity: number;
    customerNotes?: string;
    status?: "pending" | "available" | "not_available";
    pharmacistPricePerUnit?: number | null;
    pharmacistNote?: string;
  }[];
};

type PrescriptionItem = {
  id: string;
  imageUrls: string[];
  name?: string;
  prescriptionDate?: string;
};

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://sacredheartpharma-backend.onrender.com";

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, refresh } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");

  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");

  const newPrescriptionInputRef = useRef<HTMLInputElement>(null);

  const { prescriptions, refreshPrescriptions } = useCartContext();

  useEffect(() => {
    setProfileName(user?.name || "");
    setProfilePhone(user?.phone || "");
  }, [user?.name, user?.phone]);

  useEffect(() => {
    let active = true;

    async function fetchOrders() {
      if (!user) {
        if (!active) return;
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        const r = await fetch(`${API_BASE}/api/orders`, { credentials: "include" });
        if (!r.ok) {
          if (active) setOrders([]);
          return;
        }
        const data = await r.json();
        if (active) setOrders(data?.orders || data || []);
      } catch {
        if (active) setOrders([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    setLoading(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 20000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user?.id]);

  async function parseError(res: Response, fallback: string) {
    try {
      const data = await res.json();
      if (data?.error) return data.error;
      if (data?.message) return data.message;
    } catch {
      // ignore
    }

    try {
      const text = await res.text();
      if (text) return text;
    } catch {
      // ignore
    }

    return fallback;
  }

  async function saveProfile() {
    if (!/^[6-9]\d{9}$/.test(profilePhone)) {
      alert("Enter valid 10-digit Indian mobile number");
      return;
    }

    const res = await fetch(`${API_BASE}/api/users/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: profileName.trim(),
        phone: profilePhone.trim(),
      }),
    });

    if (res.ok) {
      await refresh();
      alert("Profile updated");
    } else {
      alert(await parseError(res, "Failed to update profile"));
    }
  }

  async function deletePrescription(id: string) {
    if (!confirm("Delete this prescription permanently?")) return;

    const res = await fetch(`${API_BASE}/api/prescriptions/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      await refreshPrescriptions();
    } else {
      alert(await parseError(res, "Failed to delete prescription"));
    }
  }

  async function savePrescriptionMeta(id: string) {
    if (!editName.trim() && !editDate.trim()) {
      alert("Please enter prescription name or date");
      return;
    }

    const payload: { name?: string; prescriptionDate?: string } = {};

    if (editName.trim()) {
      payload.name = editName.trim();
    }

    if (editDate.trim()) {
      payload.prescriptionDate = editDate.trim();
    }

    const res = await fetch(`${API_BASE}/api/prescriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setEditingId(null);
      setEditName("");
      setEditDate("");
      await refreshPrescriptions();
    } else {
      alert(await parseError(res, "Update failed"));
    }
  }

  async function uploadNewPrescription(
    files: FileList | null,
    event?: ChangeEvent<HTMLInputElement>
  ) {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("images", f));

    const res = await fetch(`${API_BASE}/api/prescriptions/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (event?.target) {
      event.target.value = "";
    }

    if (res.ok) {
      await refreshPrescriptions();
    } else {
      alert(await parseError(res, "Upload failed"));
    }
  }

  async function addPages(
    prescriptionId: string,
    files: FileList | null,
    event?: ChangeEvent<HTMLInputElement>
  ) {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("images", f));

    const res = await fetch(`${API_BASE}/api/prescriptions/${prescriptionId}/images`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (event?.target) {
      event.target.value = "";
    }

    if (res.ok) {
      await refreshPrescriptions();
    } else {
      alert(await parseError(res, "Failed to add pages"));
    }
  }

  async function deletePage(prescriptionId: string, index: number) {
    if (!confirm("Delete this page?")) return;

    const res = await fetch(
      `${API_BASE}/api/prescriptions/${prescriptionId}/images/${index}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (res.ok) {
      await refreshPrescriptions();
    } else {
      alert(await parseError(res, "Cannot delete page"));
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading profile…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Card className="p-4 text-center space-y-2">
          <h2 className="text-lg font-semibold">Sign in required</h2>
          <p className="text-sm text-muted-foreground">Please sign in to view and update your profile.</p>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">My Profile</h2>
        <Input
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          placeholder="Full name"
        />
        <Input
          value={profilePhone}
          inputMode="numeric"
          maxLength={10}
          onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, ""))}
          placeholder="10-digit phone"
        />
        <Button onClick={saveProfile}>Save Profile</Button>
      </Card>

      <Card className="p-4 space-y-2 border-green-200 bg-green-50">
        <h3 className="font-semibold text-sm">Order Again</h3>
        {orders.slice(0, 3).map((order) => (
          <div key={order.id} className="flex items-center justify-between text-sm">
            <span>
              #{order.orderNumber} • {order.items?.[0]?.medicineName || "Medicines"}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate(`/inventory?search=${encodeURIComponent(order.items?.[0]?.medicineName || "")}`)
              }
            >
              Reorder
            </Button>
          </div>
        ))}
      </Card>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">My Prescriptions</h2>
          <Button
            size="sm"
            onClick={() => newPrescriptionInputRef.current?.click()}
          >
            Upload New
          </Button>
          <input
            ref={newPrescriptionInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => uploadNewPrescription(e.target.files, e)}
          />
        </div>

        {prescriptions.length === 0 && (
          <p className="text-muted-foreground text-sm">No prescriptions uploaded yet</p>
        )}

        <div className="space-y-3">
          {(prescriptions as PrescriptionItem[]).map((p) => (
            <Card key={p.id} className="p-3 space-y-2">
              <div className="flex justify-between items-center gap-2">
                {editingId === p.id ? (
                  <div className="space-y-2 w-full">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Prescription name"
                    />
                    <Input
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      placeholder="Prescription date (optional)"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => savePrescriptionMeta(p.id)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null);
                          setEditName("");
                          setEditDate("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-sm font-medium block">
                        {p.name || "Prescription"} ({p.imageUrls.length} page
                        {p.imageUrls.length > 1 ? "s" : ""})
                      </span>
                      {p.prescriptionDate && (
                        <p className="text-xs text-muted-foreground">Date: {p.prescriptionDate}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(p.id);
                          setEditName(p.name || "");
                          setEditDate(p.prescriptionDate || "");
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePrescription(p.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto">
                {p.imageUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative group">
                    <img src={url} className="h-20 rounded border" />
                    <button
                      onClick={() => deletePage(p.id, index)}
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <label className="h-20 w-20 flex items-center justify-center border rounded cursor-pointer text-sm">
                  + Add
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => addPages(p.id, e.target.files, e)}
                  />
                </label>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">My Orders</h2>

        {orders.length === 0 && (
          <p className="text-muted-foreground text-sm">No orders placed yet</p>
        )}

        {orders.map((order) => (
          <Card key={order.id} className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">#{order.orderNumber}</span>
              <Badge>{order.status}</Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("en-IN")}
            </div>

            {order.deliveryAddress && (
              <p className="text-xs text-muted-foreground">Delivery: {order.deliveryAddress}</p>
            )}

            {!!(order.items || []).length && (
              <ul className="text-sm list-disc ml-5">
                {(order.items || []).map((i, idx) => (
                  <li key={idx}>
                    {i.medicineName} × {i.quantity}
                  </li>
                ))}
              </ul>
            )}

            {!!order.requestedItems?.length && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Requested Items</p>
                {order.requestedItems.map((item) => (
                  <div key={item.id} className="border rounded p-2 text-sm">
                    <p className="font-medium">{item.name} × {item.quantity}</p>
                    {item.customerNotes ? (
                      <p className="text-xs text-muted-foreground">Customer note: {item.customerNotes}</p>
                    ) : null}
                    <p className="text-xs mt-1">
                      Status: <span className="capitalize">{(item.status || "pending").replace("_", " ")}</span>
                    </p>
                    {item.status === "available" && item.pharmacistPricePerUnit != null ? (
                      <p className="text-xs text-green-700">
                        Price: ₹{Number(item.pharmacistPricePerUnit).toFixed(2)} / unit
                      </p>
                    ) : (
                      <p className="text-xs text-amber-700">Price to be confirmed</p>
                    )}
                    {item.pharmacistNote ? (
                      <p className="text-xs text-muted-foreground">Pharmacist note: {item.pharmacistNote}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated total</span>
                <span>₹{Number(order.total || 0).toFixed(2)}</span>
              </div>
              {(Number(order.discountAmount || 0) > 0 || !!order.promoCode) && (
                <div className="flex justify-between text-green-700">
                  <span>{order.promoCode ? `${order.promoCode} savings` : "Discount"}</span>
                  <span>-₹{Number(order.discountAmount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Final total</span>
                <span>₹{Number(order.adjustedTotal || order.total || 0).toFixed(2)}</span>
              </div>
              {order.adjustedTotal && Number(order.adjustedTotal) !== Number(order.total) && (
                <p className="text-xs text-muted-foreground">
                  Updated by pharmacist based on availability/pricing.
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
