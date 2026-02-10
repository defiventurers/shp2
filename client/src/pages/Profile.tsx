import { useEffect, useRef, useState } from "react";
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

export default function Profile() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      refreshPrescriptions();
      alert("Prescription deleted");
    } else {
      alert("Failed to delete prescription");
    }
  }

  async function renamePrescription(id: string) {
    if (!newName.trim()) return;

    const res = await fetch(`/api/prescriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: newName }),
    });

    if (res.ok) {
      setRenamingId(null);
      setNewName("");
      refreshPrescriptions();
    } else {
      alert("Rename failed");
    }
  }

  async function uploadNewPrescription(files: FileList | null) {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("images", f));

    const res = await fetch("/api/prescriptions/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (res.ok) {
      refreshPrescriptions();
      alert("Prescription uploaded & saved to profile");
    } else {
      alert("Upload failed");
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
            onClick={() => fileInputRef.current?.click()}
          >
            Upload New
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => uploadNewPrescription(e.target.files)}
          />
        </div>

        {prescriptions.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No prescriptions uploaded yet
          </p>
        )}

        <div className="space-y-3">
          {prescriptions.map((p) => (
            <Card key={p.id} className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                {renamingId === p.id ? (
                  <div className="flex gap-2 w-full">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Prescription name"
                    />
                    <Button size="sm" onClick={() => renamePrescription(p.id)}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRenamingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-medium">
                      {p.name || "Prescription"} ({p.imageUrls.length} page
                      {p.imageUrls.length > 1 ? "s" : ""})
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRenamingId(p.id);
                          setNewName(p.name || "");
                        }}
                      >
                        Rename
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
                {p.imageUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    className="h-20 rounded border"
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ORDERS */}
      <div>
        <h2 className="text-lg font-semibold mb-2">My Orders</h2>

        {orders.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No orders placed yet
          </p>
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

            <div className="font-semibold">
              ₹{Number(order.total).toFixed(0)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}