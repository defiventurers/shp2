import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  FileText,
  Package,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
};

export default function Profile() {
  const { user, refetchAuth } = useAuth();
  const { prescriptions, refreshPrescriptions } = useCartContext();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /* -----------------------------
     Load user data into form
  ------------------------------ */
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone((user as any).phone || "");
      setAddress((user as any).address || "");
    }
  }, [user]);

  /* -----------------------------
     Fetch Orders
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
     Save profile
  ------------------------------ */
  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/me`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, address }),
        }
      );

      if (!res.ok) throw new Error();

      await refetchAuth();

      toast({
        title: "Profile updated",
        description: "Your details were saved successfully",
      });
    } catch {
      toast({
        title: "Update failed",
        description: "Could not save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  /* -----------------------------
     Add images to prescription
  ------------------------------ */
  async function addImages(prescriptionId: string, files: FileList | null) {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((f) =>
      formData.append("images", f)
    );

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions/${prescriptionId}/images`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error();

      await refreshPrescriptions();
      toast({ title: "Images added" });
    } catch {
      toast({
        title: "Failed to add images",
        variant: "destructive",
      });
    }
  }

  /* -----------------------------
     Remove image from prescription
  ------------------------------ */
  async function removeImage(prescriptionId: string, index: number) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions/${prescriptionId}/images/${index}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error();

      await refreshPrescriptions();
      toast({ title: "Image removed" });
    } catch {
      toast({
        title: "Failed to remove image",
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

      {/* -----------------------------
         EDIT PROFILE
      ------------------------------ */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Your Details</span>
        </div>

        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />

        <Button onClick={saveProfile} disabled={saving} className="w-full">
          <Save size={14} className="mr-2" />
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </Card>

      {/* -----------------------------
         PRESCRIPTIONS (EDITABLE)
      ------------------------------ */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Prescriptions</span>
        </div>

        {prescriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No prescriptions uploaded yet.
          </p>
        ) : (
          prescriptions.map((p) => (
            <div key={p.id} className="space-y-2">
              <p className="text-sm font-medium">
                {name || "Prescription"} –{" "}
                {new Date(p.createdAt).toLocaleDateString("en-GB")}
              </p>

              {/* IMAGE GRID */}
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
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* ADD MORE */}
              {p.imageUrls.length < 5 && (
                <>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    ref={(el) =>
                      (fileInputRefs.current[p.id] = el)
                    }
                    onChange={(e) =>
                      addImages(p.id, e.target.files)
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      fileInputRefs.current[p.id]?.click()
                    }
                  >
                    <Plus size={14} className="mr-1" />
                    Add images
                  </Button>
                </>
              )}
            </div>
          ))
        )}
      </Card>

      {/* -----------------------------
         ORDERS
      ------------------------------ */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Orders</span>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No orders placed yet.
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between border rounded-md p-2"
            >
              <div>
                <p className="text-sm font-medium">
                  #{order.orderNumber}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {order.status}
                </p>
              </div>
              <p className="text-sm font-semibold">
                ₹{Number(order.total).toFixed(0)}
              </p>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}