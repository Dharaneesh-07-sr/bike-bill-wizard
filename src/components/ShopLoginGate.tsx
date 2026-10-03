import { FormEvent, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Bike, Eye, EyeOff, LoaderCircle, LockKeyhole, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BillingForm from "@/components/BillingForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ShopLoginGate = () => {
  const [user, setUser] = useState<User | null>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    void supabase.auth.getUser().then(({ data, error }) => {
      setUser(error ? null : data.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("shop-login", {
        body: { username, password },
      });

      if (error || typeof data?.token_hash !== "string") {
        toast.error("Username or password is incorrect.");
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (verifyError) {
        toast.error("Sign-in could not be completed. Please try again.");
      }
    } catch {
      toast.error("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) return <BillingForm />;

  if (user === undefined) {
    return (
      <main className="dark flex min-h-dvh items-center justify-center bg-background text-foreground" aria-busy="true">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </main>
    );
  }

  return (
    <main className="shop-login-root dark grid min-h-dvh bg-background text-foreground lg:grid-cols-[1.12fr_0.88fr]">
      <section className="shop-login-art relative flex min-h-[17rem] items-end overflow-hidden p-7 sm:min-h-[21rem] sm:p-10 lg:min-h-dvh lg:p-14" aria-label="Sri Kandhan Autos workshop">
        <div className="relative z-10 max-w-xl pb-2 sm:pb-5">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center border border-primary/50 bg-background/30 text-primary backdrop-blur-sm">
            <Wrench className="h-6 w-6" />
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Two-wheelers · Service · Care</p>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">Sri Kandhan Autos</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/80 sm:text-base">
            Professional bike service and repair, trusted by riders in Erode.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-white/80">
            <Bike className="h-4 w-4 text-primary" />
            <span>Telephone Nagar, Moolapalayam</span>
          </div>
        </div>
        <span className="pointer-events-none absolute right-7 top-7 hidden text-xs font-medium uppercase tracking-[0.18em] text-white/70 sm:block lg:right-10 lg:top-10">
          Erode · Tamil Nadu
        </span>
      </section>

      <section className="flex items-center justify-center px-5 py-9 sm:px-10 lg:px-12">
        <div className="w-full max-w-[25rem]">
          <div className="mb-8">
            <p className="text-sm font-semibold text-primary">SRI KANDHAN AUTOS</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to open your workshop.</p>
          </div>

          <Card className="border-border bg-card shadow-2xl shadow-background/50">
            <CardContent className="p-6 sm:p-8">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="shop-username">Username</Label>
                  <Input
                    id="shop-username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shop-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="shop-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="pr-11"
                      required
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="h-11 w-full gap-2" disabled={isSubmitting || !username || !password}>
                  {isSubmitting ? <LoaderCircle className="animate-spin" /> : <LockKeyhole />}
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Sri Kandhan Autos <span aria-hidden="true">·</span> Shop access only
          </p>
        </div>
      </section>
    </main>
  );
};

export default ShopLoginGate;