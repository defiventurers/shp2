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
  preview: string;
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

  const [selectedFiles, setSelectedFiles] = useState<PreviewFile[]>([]);
  const [uploading, setUploading] = useState(false);

  /* -----------------------------
     Upload mutation (single file)
  ------------------------------ */
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/prescriptions/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      addPrescription(data.prescription);
    },
  });

  /* -----------------------------
     Handle file selection
  ------------------------------ */
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    if (files.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload up to 5 images",
        variant: "destructive",
      });
      return;
    }

    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedFiles(previews);
  }

  function removePreview(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadAll() {
    if (!selectedFiles.length) return;

    setUploading(true);

    try {
      for (const item of selectedFiles) {
        await uploadMutation.mutateAsync(item.file);
      }

      toast({
        title: "Prescription uploaded",
        description: `${selectedFiles.length} image(s) uploaded`,
      });

      setSelectedFiles([]);
    } catch {
      toast({
        title: "Upload failed",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  if (!isAuthenticated) {
    return <p className="p-4">Please login to upload prescription</p>;
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-semibold text-lg">Prescriptions</h1>

      {/* ---------------- UPLOAD AREA ---------------- */}
      <Card className="p-4 border-dashed border-2 text-center space-y-3">
        <Upload className="mx-auto" />

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Select Images (1–5)
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFileSelect}
        />

        {/* PREVIEWS */}
        {selectedFiles.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {selectedFiles.map((item, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={item.preview}
                    className="w-full h-24 object-cover rounded"
                  />
                  <button
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1"
                    onClick={() => removePreview(idx)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-3"
              onClick={uploadAll}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Selected Images"}
            </Button>
          </>
        )}
      </Card>

      {/* ---------------- SAVED PRESCRIPTIONS ---------------- */}
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