import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppButtonProps {
  orderId?: string;
  variant?: "floating" | "inline";
  className?: string;
}

const PHONE_NUMBER = "919686036540";

export function WhatsAppButton({ orderId, variant = "floating", className = "" }: WhatsAppButtonProps) {
  const message = orderId
    ? `Hello, I have a query about Order ID: ${orderId}`
    : "Hello, I would like to inquire about medicines at Sacred Heart Pharmacy";
  
  const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;

  if (variant === "floating") {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="button-whatsapp-floating"
        className={`fixed bottom-20 right-4 z-40 w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${className}`}
      >
        <MessageCircle className="w-7 h-7" fill="currentColor" />
      </a>
    );
  }

  return (
    <Button
      asChild
      variant="outline"
      className={`bg-[#25D366] hover:bg-[#20BD5A] text-white border-[#25D366] hover:border-[#20BD5A] ${className}`}
      data-testid="button-whatsapp-inline"
    >
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="w-4 h-4 mr-2" fill="currentColor" />
        Contact Pharmacist
      </a>
    </Button>
  );
}
