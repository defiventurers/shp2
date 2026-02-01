import { useState } from "react";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function StaffLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setLoading(true);

    // 🔐 TEMPORARY CREDENTIALS
    if (username === "shp" && password === "shp2") {
      localStorage.setItem("staff_auth", "true");

      toast({
        title: "Staff login successful",
      });

      navigate("/staff");
    } else {
      toast({
        title: "Invalid credentials",
        description: "Incorrect staff username or password",
        variant: "destructive",
      });
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-2 justify-center">
          <Shield className="w-5 h-5 text-green-600" />
          <h1 className="text-lg font-semibold">Staff Login</h1>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter staff username"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </Card>
    </div>
  );
}