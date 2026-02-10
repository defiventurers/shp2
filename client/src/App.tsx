import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/Header";
import { OnboardingModal } from "@/components/OnboardingModal";

/* pages */
import Home from "@/pages/Home";
import Inventory from "@/pages/Inventory";
import Prescription from "@/pages/Prescription";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import StaffLogin from "@/pages/StaffLogin";
import StaffDashboard from "@/pages/StaffDashboard";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Header />
          <OnboardingModal /> {/* ✅ SAFE GLOBAL MODAL */}
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/prescription" component={Prescription} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/orders" component={Orders} />
            <Route path="/staff/login" component={StaffLogin} />
            <Route path="/staff/dashboard" component={StaffDashboard} />
          </Switch>
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}