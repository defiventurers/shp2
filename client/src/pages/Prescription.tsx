import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { useCartContext } from "@/context/CartContext";

import type { Prescription } from "@shared/schema";

export default function PrescriptionPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addPrescription } = useCartContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  /* -----------------------------
     Load existing prescriptions
  ------------------------------ */
  useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
    enabled: isAuthenticated,
  });

  /* -----------------------------
     Upload mutation
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
        throw new Error("Prescription upload failed");
      }

      return res.json();
    },

    onSuccess: (data) => {
      // 🔑 SOURCE OF TRUTH — backend response
      addPrescription(data.prescription);

      queryClient.invalidateQueries({
        queryKey: ["/api/prescriptions"],
      });

      toast({
        title: "Prescription uploaded",
        description: "Prescription saved and selected for checkout",
      });

      navigate("/checkout");
    },

    onError: (err: any) => {
      toast({
        title: "Upload failed",
        description: err?.message || "Unable to upload prescription",
        variant: "destructive",
      });
    },

    onSettled: () => {
      setIsUploading(false);
    },
  });

  /* -----------------------------
     Handlers
  ------------------------------ */
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    uploadMutation.mutate(file);
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Please login to upload a prescription
        </p>
      </div>
    );
  }

  /* -----------------------------
     UI
  ------------------------------ */
  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-lg mx-auto">
      <h1 className="font-semibold text-lg mb-4">Upload Prescription</h1>

      <Card className="p-6 border-dashed border-2">
        <div className="flex flex-col items-center text-center">
          <Upload className="w-10 h-10 text-primary mb-3" />

          <p className="text-sm text-muted-foreground mb-4">
            Upload or take a photo of your prescription
          </p>

          <Button
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? "Uploading..." : "Upload Image"}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </Card>
    </div>
  );
}