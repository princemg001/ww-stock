import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useQueries";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

// Women Wastra logo displayed on the login page

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginMutation = useLogin();

  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId.trim()) {
      setError("User ID is required");
      return;
    }
    if (pin.length !== 4) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({
        userId: userId.trim(),
        pin,
      });
      if (result.success && result.session) {
        login(result.session);
        await navigate({ to: "/home" });
      } else {
        setError(result.error ?? "Invalid User ID or PIN");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      if (msg.includes("Actor not ready") || msg.includes("not ready")) {
        setError("Connecting to server... Please wait a moment and try again.");
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Gown background — fixed position, centered, full-cover */}
      <img
        src="/assets/generated/bg-gown.dim_1600x1200.jpg"
        alt="fashion background"
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover object-center pointer-events-none"
        style={{ opacity: 0.25 }}
      />

      <div className="relative w-full max-w-sm z-10" data-ocid="login.card">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/assets/logo.webp"
            alt="WW Stock logo"
            className="w-20 h-20 rounded-xl object-contain bg-white shadow-lg mb-4"
          />
          <h1 className="font-display font-bold text-2xl text-foreground tracking-tight">
            WW Stock
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inventory Management System
          </p>
        </div>

        {/* Login form */}
        <div className="bg-card border border-border rounded-sm p-6 shadow-lg">
          <h2 className="font-display font-semibold text-lg text-foreground mb-5">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="userId"
                className="text-sm font-medium text-foreground"
              >
                User ID
              </Label>
              <Input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setError("");
                }}
                placeholder="Enter your User ID"
                autoComplete="username"
                className="bg-background border-input font-mono"
                data-ocid="login.userid_input"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="pin"
                className="text-sm font-medium text-foreground"
              >
                4-Digit PIN
              </Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setPin(val);
                    setError("");
                  }}
                  placeholder="• • • •"
                  autoComplete="current-password"
                  className="bg-background border-input font-mono text-center tracking-[0.5em] text-lg pr-10"
                  data-ocid="login.pin_input"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-sm"
                  data-ocid="login.pin_toggle"
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your 4-digit numeric PIN
              </p>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-sm px-3 py-2"
                data-ocid="login.error_state"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={loginMutation.isPending}
              data-ocid="login.submit_button"
            >
              {loginMutation.isPending ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Contact your administrator for credentials
          </p>
        </div>

        {/* Application credits */}
        <p className="text-xs text-muted-foreground text-center mt-5 opacity-80">
          Developed by{" "}
          <span className="font-medium text-foreground">Mitul Gopani</span>
          {" & "}
          <span className="font-medium text-foreground">Krenil Vaghasiya</span>
        </p>
      </div>
    </div>
  );
}
