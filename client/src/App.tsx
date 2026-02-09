import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/context/AuthContext"; // ✅ ADD
import { CartProvider } from "@/context/CartContext";

import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { WhatsAppButton } from "@/components/WhatsAppButton";

import Home from "@/pages/Home";
import Inventory from "@/pages/Inventory";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import Prescription from "@/pages/Prescription";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import StaffLogin from "@/pages/StaffLogin";
import StaffDashboard from "@/pages/StaffDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/orders" component={Orders} />
      <Route path="/profile" component={Profile} />
      <Route path="/prescription" component={Prescription} />
      <Route path="/staff/login" component={StaffLogin} />
      <Route path="/staff" component={StaffDashboard} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [location] = useLocation();
  const isStaffRoute = location.startsWith("/staff");

  return (
    <TooltipProvider>
      <AuthProvider>        {/* ✅ REQUIRED */}
        <CartProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="pb-safe">
              <Router />
            </main>

            {!isStaffRoute && <BottomNav />}
            {!isStaffRoute && <WhatsAppButton />}
          </div>

          <Toaster />
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}