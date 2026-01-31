import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Upload, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";

export default function PrescriptionPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { addPrescription } = useCartContext();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [uploading, setUploading] = useState(false);

  /* ---------------------------
     Upload mutation
  ---------------------------- */
  const uploadMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();

      files.forEach((file) => formData.append("images", file));

      formData.append(
        "label",
        `${user?.name || "Prescription"} – ${date}`
      );

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
    onSuccess: (data) => {
      addPrescription(data.prescription);
      setFiles([]);
      toast({ title: "Prescription created" });
      navigate("/checkout");
    },
    onError: (err: any) => {
      toast({
        title: "Upload failed",
        description: err?.message,
        variant: "destructive",
      });
    },
    onSettled: () => setUploading(false),
  });

  if (!isAuthenticated) {
    return <p className="p-4">Please login to upload prescription</p>;
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-semibold text-lg">Create Prescription</h1>

      {/* UPLOAD */}
      <Card className="p-4 text-center border-dashed border-2">
        <Upload className="mx-auto mb-2" />
        <Button onClick={() => fileInputRef.current?.click()}>
          Select Images (1–5)
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) =>
            setFiles(Array.from(e.target.files || []).slice(0, 5))
          }
        />
      </Card>

      {/* PREVIEW */}
      {files.length > 0 && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {files.map((file, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(file)}
                className="w-full h-24 object-cover rounded"
              />
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prescription Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <Button
            className="w-full"
            disabled={uploading}
            onClick={() => {
              setUploading(true);
              uploadMutation.mutate();
            }}
          >
            {uploading ? "Uploading..." : "Create Prescription"}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setFiles([])}
          >
            <Trash2 size={14} /> Clear
          </Button>
        </Card>
      )}
    </div>
  );
}