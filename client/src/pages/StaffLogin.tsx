import { useState } from "react";
import { useLocation } from "wouter";
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

    // ⛔ TEMPORARY CREDENTIAL CHECK
    if (username === "shp" && password === "shp2") {
      // mark staff session (temporary)
      localStorage.setItem("staff_auth", "true");

      toast({
        title: "Login successful",
        description: "Welcome, pharmacist",
      });

      navigate("/staff");
    } else {
      toast({
        title: "Invalid credentials",
        description: "Incorrect username or password",
        variant: "destructive",
      });
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <h1 className="text-lg font-semibold text-center">
          Staff Login
        </h1>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
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
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <p className="text-[11px] text-muted-foreground text-center">
          Authorized pharmacy staff only
        </p>
      </Card>
    </div>
  );
}