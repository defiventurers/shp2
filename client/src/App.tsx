import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { WhatsAppButton } from "@/components/WhatsAppButton";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Inventory from "@/pages/Inventory";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import Prescription from "@/pages/Prescription";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";

/* 🆕 STAFF PAGES */
import StaffLogin from "@/pages/StaffLogin";
import StaffDashboard from "@/pages/StaffDashboard"; // placeholder for now

function Router() {
  return (
    <Switch>
      {/* CUSTOMER ROUTES */}
      <Route path="/" component={Home} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/orders" component={Orders} />
      <Route path="/profile" component={Profile} />
      <Route path="/prescription" component={Prescription} />

      {/* STAFF ROUTES */}
      <Route path="/staff/login" component={StaffLogin} />
      <Route path="/staff" component={StaffDashboard} />

      {/* ADMIN (UNCHANGED) */}
      <Route path="/admin" component={Admin} />

      {/* FALLBACK */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <TooltipProvider>
      <CartProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pb-safe">
            <Router />
          </main>

          {/* BottomNav remains customer-only for now */}
          <BottomNav />
          <WhatsAppButton />
        </div>
        <Toaster />
      </CartProvider>
    </TooltipProvider>
  );
}