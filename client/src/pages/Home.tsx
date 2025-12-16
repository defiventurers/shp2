import { Link } from "wouter";
import { Upload, Package, Heart, Clock, Truck, Shield, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative bg-gradient-to-br from-primary via-primary to-blue-700 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        
        <div className="relative px-4 py-10 sm:py-14">
          <div className="max-w-lg mx-auto text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                <Heart className="w-12 h-12 text-white" fill="currentColor" />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Sacred Heart Pharmacy
            </h1>
            <p className="text-primary-foreground/80 text-sm mb-1">
              Austin Town, Victoria Layout, Bengaluru , Karnataka 560047
            </p>
            <div className="flex items-center justify-center gap-1 text-xs text-primary-foreground/70 mb-6">
              <MapPin className="w-3 h-3" />
              <span>16, Campbell Rd, opposite to ST. PHILOMENA'S HOSPITAL,</span>
            </div>
            
            <p className="text-primary-foreground/90 text-sm max-w-xs mx-auto">
              Your trusted neighborhood pharmacy. Order medicines online with prescription upload.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/prescription">
            <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer group" data-testid="card-upload-prescription">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Upload Prescription</h3>
              <p className="text-xs text-muted-foreground">
                Upload & auto-detect medicines
              </p>
            </Card>
          </Link>

          <Link href="/inventory">
            <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer group" data-testid="card-browse-inventory">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Browse Inventory</h3>
              <p className="text-xs text-muted-foreground">
                1000+ medicines available
              </p>
            </Card>
          </Link>
        </div>

        <Card className="mt-4 p-4" data-testid="card-whatsapp-pharmacist">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-[#25D366]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-0.5">Need Help?</h3>
              <p className="text-xs text-muted-foreground">
                Chat with our pharmacist on WhatsApp
              </p>
            </div>
            <WhatsAppButton variant="inline" />
          </div>
        </Card>

        <div className="mt-8">
          <h2 className="font-semibold text-lg mb-4">Why Choose Us</h2>
          <div className="grid gap-3">
            {[
              { icon: Truck, title: "Fast Delivery", desc: "Same day delivery in Bangalore" },
              { icon: Shield, title: "100% Genuine", desc: "All medicines sourced from authorized distributors" },
              { icon: Clock, title: "Open 7 Days", desc: "9 AM - 10 PM, including weekends" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{title}</h4>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="mt-8 p-4 bg-accent/50">
          <h3 className="font-semibold text-sm mb-2">Store Location</h3>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p>16, Campbell Rd, opposite to ST. PHILOMENA'S HOSPITAL, Austin Town, </p>
              <p>Victoria Layout, Bengaluru,</p>
              <p> Karnataka 560047</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            <a href="tel:+919686036540" className="hover:text-primary">
              +91 96860 36540
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
