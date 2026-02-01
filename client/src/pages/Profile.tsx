import { useState } from "react";
import {
  User as UserIcon,
  FileText,
  Package,
  Trash2,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";

export default function Profile() {
  const { user } = useAuth();
  const { prescriptions } = useCartContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

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
         USER DETAILS
      ============================== */}
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Account</span>
        </div>

        <p className="text-sm">
          <strong>Name:</strong> {user.name}
        </p>
        <p className="text-sm">
          <strong>Email:</strong> {user.email}
        </p>
      </Card>

      {/* =============================
         PRESCRIPTIONS (EDITABLE)
      ============================== */}
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
          prescriptions.map((p) => {
            const isEditing = editingId === p.id;

            return (
              <div
                key={p.id}
                className="border rounded-md p-3 space-y-3"
              >
                {/* HEADER */}
                <div className="flex items-center justify-between">
                  {isEditing ? (
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="Prescription name"
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {user.name?.split(" ")[0]} –{" "}
                      {new Date(p.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {isEditing ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null);
                          setTempName("");
                        }}
                      >
                        <X size={16} />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(p.id);
                          setTempName(
                            `${user.name?.split(" ")[0]} – ${new Date(
                              p.createdAt
                            ).toLocaleDateString("en-GB")}`
                          );
                        }}
                      >
                        <Pencil size={16} />
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      disabled
                      title="Delete (coming next)"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {/* IMAGES */}
                <div className="grid grid-cols-3 gap-2">
                  {p.imageUrls?.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={url}
                        className="w-full h-20 object-cover rounded"
                      />
                      <button
                        disabled
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                        title="Remove image (coming next)"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* ADD IMAGE */}
                  {p.imageUrls.length < 5 && (
                    <button
                      disabled
                      className="flex items-center justify-center border rounded-md text-muted-foreground"
                      title="Add images (coming next)"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {p.imageUrls.length} page(s)
                </p>
              </div>
            );
          })
        )}
      </Card>

      {/* =============================
         ORDERS (UNCHANGED)
      ============================== */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Orders</span>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          Orders section unchanged (already working).
        </p>
      </Card>
    </div>
  );
}