import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Upload, Trash2, CheckCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";

type PreviewFile = {
  file: File;
  url: string;
};

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
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [uploading, setUploading] = useState(false);

  /* -----------------------------
     UPLOAD MUTATION (MULTI)
  ------------------------------ */
  const uploadMutation = useMutation({
    mutationFn: async (images: File[]) => {
      const formData = new FormData();
      images.forEach((f) => formData.append("images", f));

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions/upload`,
        {
          method: "POST",
          body: formData,
          credentials: "include", // 🔥 cookie auth
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      addPrescription(data.prescription);
      toast({ title: "Prescription uploaded" });
      setFiles([]);
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

  /* -----------------------------
     FILE SELECTION
  ------------------------------ */
  function handleSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);

    if (!selected.length) return;

    if (files.length + selected.length > 5) {
      toast({
        title: "Limit reached",
        description: "You can upload up to 5 images",
        variant: "destructive",
      });
      return;
    }

    const previews = selected.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...previews]);
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function startUpload() {
    if (!files.length) return;
    setUploading(true);
    uploadMutation.mutate(files.map((f) => f.file));
  }

  if (!isAuthenticated) {
    return <p className="p-4">Please login to upload prescription</p>;
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-semibold text-lg">Prescriptions</h1>

      {/* UPLOAD CARD */}
      <Card className="p-4 text-center border-dashed border-2">
        <Upload className="mx-auto mb-2" />
        <Button onClick={() => fileInputRef.current?.click()}>
          Select Prescription Images
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Upload 1–5 images (JPG / PNG)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleSelectFiles}
        />
      </Card>

      {/* PREVIEWS */}
      {files.length > 0 && (
        <Card className="p-3">
          <p className="text-sm font-medium mb-2">Selected Pages</p>
          <div className="grid grid-cols-3 gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative">
                <img
                  src={f.url}
                  className="w-full h-24 object-cover rounded"
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <Button
            className="w-full mt-3"
            disabled={uploading}
            onClick={startUpload}
          >
            {uploading ? "Uploading..." : "Upload Prescription"}
          </Button>
        </Card>
      )}

      {/* SAVED PRESCRIPTIONS */}
      {prescriptions.map((p) => (
        <Card
          key={p.id}
          className={`p-3 flex items-center gap-3 ${
            selectedPrescriptionId === p.id ? "border-green-500" : ""
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