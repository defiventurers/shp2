import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Upload, Trash2, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";

export default function PrescriptionPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, loading } = useAuth();

  const {
    prescriptions,
    selectedPrescriptionId,
    setSelectedPrescriptionId,
    refreshPrescriptions,
  } = useCartContext();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  /* ---------------- AUTH GUARD ---------------- */

  if (loading) {
    return <p className="p-4">Checking login…</p>;
  }

  if (!isAuthenticated) {
    return <p className="p-4">Please login to upload prescription</p>;
  }

  /* ---------------- DEFAULT VALUES ---------------- */

  const today = new Date().toLocaleDateString("en-GB");
  const defaultName = user?.name
    ? `${user.name.split(" ")[0]}-${today}`
    : `Prescription-${today}`;

  const [prescriptionName, setPrescriptionName] =
    useState(defaultName);
  const [prescriptionDate, setPrescriptionDate] =
    useState(today);

  /* ---------------- UPLOAD ---------------- */

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      selectedFiles.forEach((f) => formData.append("images", f));

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions/upload`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      return res.json();
    },

    onSuccess: async (data) => {
      const prescription = data.prescription;

      setSelectedFiles([]);
      await refreshPrescriptions();
      setSelectedPrescriptionId(prescription.id);

      toast({
        title: "Prescription created",
        description: "Selected for checkout",
      });
    },

    onError: (err: any) => {
      toast({
        title: "Upload failed",
        description: err?.message || "Unable to upload prescription",
        variant: "destructive",
      });
    },

    onSettled: () => setUploading(false),
  });

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-semibold text-lg">Create Prescription</h1>

      {/* FILE SELECT */}
      <Card className="p-4 text-center border-dashed border-2">
        <Upload className="mx-auto mb-2" />
        <Button onClick={() => fileInputRef.current?.click()}>
          Select 1–5 Images
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) =>
            setSelectedFiles(
              Array.from(e.target.files || []).slice(0, 5)
            )
          }
        />
        {selectedFiles.length > 0 && (
          <p className="text-xs mt-2 text-muted-foreground">
            {selectedFiles.length} image(s) selected
          </p>
        )}
      </Card>

      {/* PREVIEW */}
      {selectedFiles.length > 0 && (
        <Card className="p-4 space-y-3">
          <Input
            value={prescriptionName}
            onChange={(e) => setPrescriptionName(e.target.value)}
            placeholder="Prescription name"
          />
          <Input
            value={prescriptionDate}
            onChange={(e) => setPrescriptionDate(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  className="w-full h-24 object-cover rounded"
                />
                <button
                  onClick={() =>
                    setSelectedFiles((prev) =>
                      prev.filter((_, i) => i !== idx)
                    )
                  }
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <Button
            disabled={uploading}
            onClick={() => {
              setUploading(true);
              uploadMutation.mutate();
            }}
            className="w-full"
          >
            {uploading ? "Creating..." : "Create Prescription"}
          </Button>
        </Card>
      )}

      {/* EXISTING */}
      <h2 className="font-medium text-sm">Your Prescriptions</h2>

      {prescriptions.map((p) => (
        <Card
          key={p.id}
          className={`p-3 flex items-center gap-3 cursor-pointer ${
            selectedPrescriptionId === p.id ? "border-green-500" : ""
          }`}
          onClick={() => setSelectedPrescriptionId(p.id)}
        >
          <img
            src={p.imageUrls?.[0]}
            className="w-16 h-16 object-cover rounded"
          />
          <div className="flex-1">
            {selectedPrescriptionId === p.id && (
              <p className="text-green-600 text-sm flex items-center gap-1">
                <CheckCircle size={14} /> Selected
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {p.imageUrls.length} page(s)
            </p>
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