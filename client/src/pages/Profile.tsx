import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Package,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  Trash2,
  Plus,
  X,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";

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
  createdAt: string;
  items?: OrderItem[];
};

const STATUS_STEPS = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "delivered",
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  ready: "Ready",
  delivered: "Delivered",
};

export default function Profile() {
  const { user } = useAuth();
  const { prescriptions, refreshPrescriptions } = useCartContext();
  const { toast } = useToast();

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedPrescriptionId, setExpandedPrescriptionId] =
    useState<string | null>(null);

  const [editingPrescriptionId, setEditingPrescriptionId] =
    useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* -----------------------------
     Fetch Orders (with items)
  ------------------------------ */
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json();
    },
  });

  /* -----------------------------
     Rename Prescription
  ------------------------------ */
  async function renamePrescription(id: string) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions/${id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        }
      );

      if (!res.ok) throw new Error();

      await refreshPrescriptions();
      setEditingPrescriptionId(null);
      toast({ title: "Prescription renamed" });
    } catch {
      toast({
        title: "Rename failed",
        variant: "destructive",
      });
    }
  }

  /* -----------------------------
     Delete Prescription
  ------------------------------ */
  async function deletePrescription(id: string) {
    if (!confirm("Delete this prescription?")) return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      await refreshPrescriptions();
      toast({ title: "Prescription deleted" });
    } catch {
      toast({
        title: "Delete failed",
        variant: "destructive",
      });
    }
  }

  /* -----------------------------
     Add Images
  ------------------------------ */
  async function addImages(id: string, files: File[]) {
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions/${id}/images`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      await refreshPrescriptions();
      toast({ title: "Images added" });
    } catch {
      toast({
        title: "Add images failed",
        variant: "destructive",
      });
    }
  }

  /* -----------------------------
     Remove Image
  ------------------------------ */
  async function removeImage(id: string, index: number) {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions/${id}/images/${index}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      await refreshPrescriptions();
    } catch {
      toast({
        title: "Remove image failed",
        variant: "destructive",
      });
    }
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-lg font-semibold">Profile</h1>

      {/* =============================
         PRESCRIPTIONS
      ============================== */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Prescriptions</span>
        </div>

        {prescriptions.map((p) => {
          const isOpen = expandedPrescriptionId === p.id;

          return (
            <div key={p.id} className="border rounded-md p-2 space-y-2">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() =>
                  setExpandedPrescriptionId(isOpen ? null : p.id)
                }
              >
                <div className="flex-1">
                  {editingPrescriptionId === p.id ? (
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {p.extractedMedicines?.meta?.name ||
                        `Prescription – ${new Date(
                          p.createdAt
                        ).toLocaleDateString("en-GB")}`}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {p.imageUrls.length} page(s)
                  </p>
                </div>

                <div className="flex gap-2">
                  {editingPrescriptionId === p.id ? (
                    <Button size="sm" onClick={() => renamePrescription(p.id)}>
                      <Check size={14} />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPrescriptionId(p.id);
                        setNewName(
                          p.extractedMedicines?.meta?.name || ""
                        );
                      }}
                    >
                      <Pencil size={14} />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePrescription(p.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>

                  {isOpen ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {isOpen && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {p.imageUrls.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={url}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          onClick={() => removeImage(p.id, idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {p.imageUrls.length < 5 && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          addImages(
                            p.id,
                            files.slice(0, 5 - p.imageUrls.length)
                          );
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Plus size={14} /> Add images
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </Card>

      {/* =============================
         ORDERS + STATUS TIMELINE
      ============================== */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Orders</span>
        </div>

        {orders.map((order) => {
          const isOpen = expandedOrderId === order.id;
          const currentIndex = STATUS_STEPS.indexOf(order.status);

          return (
            <div key={order.id} className="border rounded-md p-2 space-y-2">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() =>
                  setExpandedOrderId(isOpen ? null : order.id)
                }
              >
                <div>
                  <p className="text-sm font-medium">
                    #{order.orderNumber}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {order.status}
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
                <>
                  {/* STATUS TIMELINE */}
                  <div className="flex justify-between items-center mt-3">
                    {STATUS_STEPS.map((step, idx) => {
                      const isDone = idx < currentIndex;
                      const isCurrent = idx === currentIndex;

                      return (
                        <div
                          key={step}
                          className="flex flex-col items-center flex-1"
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                              ${
                                isDone
                                  ? "bg-green-600 text-white"
                                  : isCurrent
                                  ? "bg-amber-500 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {isDone ? "✓" : idx + 1}
                          </div>
                          <span className="text-[10px] mt-1 text-center">
                            {STATUS_LABELS[step]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ORDER ITEMS */}
                  {order.items && (
                    <div className="pt-3 space-y-1">
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
                  )}
                </>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}