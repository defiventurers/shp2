import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Upload, Trash2, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";

export default function PrescriptionPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const {
    prescriptions,
    selectedPrescriptionId,
    addPrescription,
    selectPrescription,
    deletePrescription,
  } = useCartContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/prescriptions/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data) => {
      addPrescription(data.prescription);
      toast({ title: "Prescription uploaded" });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        variant: "destructive",
      });
    },
    onSettled: () => setUploading(false),
  });

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    uploadMutation.mutate(file);
  }

  if (!isAuthenticated) {
    return <p className="p-4">Please login to upload prescription</p>;
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-semibold text-lg">Prescriptions</h1>

      {/* UPLOAD */}
      <Card className="p-4 text-center border-dashed border-2">
        <Upload className="mx-auto mb-2" />
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Prescription"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleUpload}
        />
      </Card>

      {/* LIST */}
      {prescriptions.map((p) => (
        <Card
          key={p.id}
          className={`p-3 flex items-center gap-3 ${
            selectedPrescriptionId === p.id
              ? "border-green-500"
              : ""
          }`}
        >
          <img
            src={p.imageUrl}
            alt="Prescription"
            className="w-16 h-16 object-cover rounded"
          />

          <div className="flex-1">
            {selectedPrescriptionId === p.id && (
              <p className="text-green-600 text-sm flex items-center gap-1">
                <CheckCircle size={14} /> Selected
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => selectPrescription(p.id)}
            >
              Select
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deletePrescription(p.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </Card>
      ))}

      <Button
        className="w-full"
        disabled={!selectedPrescriptionId}
        onClick={() => navigate("/checkout")}
      >
        Continue to Checkout
      </Button>
    </div>
  );
}