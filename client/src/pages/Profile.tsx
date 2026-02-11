import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartContext } from "@/context/CartContext";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
  items: {
    medicineName: string;
    quantity: number;
  }[];
};

type PrescriptionItem = {
  id: string;
  imageUrls: string[];
  name?: string;
  prescriptionDate?: string;
};

export default function Profile() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");

  const newPrescriptionInputRef = useRef<HTMLInputElement>(null);

  const { prescriptions, refreshPrescriptions } = useCartContext();

  useEffect(() => {
    fetch("/api/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  async function deletePrescription(id: string) {
    if (!confirm("Delete this prescription permanently?")) return;

    const res = await fetch(`/api/prescriptions/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      await refreshPrescriptions();
    } else {
      alert("Failed to delete prescription");
    }
  }

  async function savePrescriptionMeta(id: string) {
    if (!editName.trim()) {
      alert("Please enter a prescription name");
      return;
    }

    const payload: { name: string; prescriptionDate?: string } = {
      name: editName.trim(),
    };

    if (editDate.trim()) {
      payload.prescriptionDate = editDate.trim();
    }

    const res = await fetch(`/api/prescriptions/${id}`, {
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
      const text = await res.text();
      alert(text || "Update failed");
    }
  }

  async function uploadNewPrescription(
    files: FileList | null,
    event?: ChangeEvent<HTMLInputElement>
  ) {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("images", f));

    const res = await fetch("/api/prescriptions/upload", {
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
      alert("Upload failed");
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

    const res = await fetch(`/api/prescriptions/${prescriptionId}/images`, {
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
      const text = await res.text();
      alert(text || "Failed to add pages");
    }
  }

  async function deletePage(prescriptionId: string, index: number) {
    if (!confirm("Delete this page?")) return;

    const res = await fetch(`/api/prescriptions/${prescriptionId}/images/${index}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      await refreshPrescriptions();
    } else {
      const text = await res.text();
      alert(text || "Cannot delete page");
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading profile…</div>;
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      {/* PRESCRIPTIONS */}
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
          <p className="text-muted-foreground text-sm">
            No prescriptions uploaded yet
          </p>
        )}

        <div className="space-y-3">
          {(prescriptions as PrescriptionItem[]).map((p) => (
            <Card key={p.id} className="p-3 space-y-2">
              {/* HEADER */}
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
                        <p className="text-xs text-muted-foreground">
                          Date: {p.prescriptionDate}
                        </p>
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

              {/* IMAGES */}
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

                {/* ADD PAGES */}
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

      {/* ORDERS */}
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

            <ul className="text-sm list-disc ml-5">
              {order.items.map((i, idx) => (
                <li key={idx}>
                  {i.medicineName} × {i.quantity}
                </li>
              ))}
            </ul>

            <div className="font-semibold">₹{Number(order.total).toFixed(0)}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
