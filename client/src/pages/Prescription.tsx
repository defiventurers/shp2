import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Upload, FileText, Check, Plus, AlertTriangle, Trash2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useCartContext } from "@/context/CartContext";
import type { Prescription, Medicine } from "@shared/schema";

export default function PrescriptionPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addPrescription, addItem } = useCartContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: prescriptions = [] } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
    enabled: isAuthenticated,
  });

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
      if (data.prescription) {
        addPrescription(data.prescription);
      }
      toast({ title: "Prescription uploaded & selected" });
      navigate("/checkout");
    },
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    uploadMutation.mutate(file);
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      <h1 className="font-semibold text-lg mb-4">Upload Prescription</h1>

      <Card className="p-6 border-dashed border-2">
        <div className="flex flex-col items-center text-center">
          <Upload className="w-10 h-10 mb-3 text-primary" />
          <p className="mb-4 text-sm text-muted-foreground">
            Upload or take a photo of your prescription
          </p>

          <Button onClick={() => fileInputRef.current?.click()}>
            Upload Image
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