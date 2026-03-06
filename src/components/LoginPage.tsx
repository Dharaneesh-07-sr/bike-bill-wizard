import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { toast } from "sonner";
import bikeShopBg from "@/assets/bike-shop-bg.jpg";

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple authentication - username: suresh, password: suresh123
    if (username === "suresh" && password === "suresh@123") {
      localStorage.setItem("isLoggedIn", "true");
      toast.success("Login successful!");
      onLogin();
    } else {
      toast.error("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${bikeShopBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-[2px]" />
      <Card className="w-full max-w-md card-hover animate-scale-fade relative z-10 border-primary/30 shadow-2xl bg-background/90 backdrop-blur-md">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-3 mb-4 animate-slide-up">
            <Wrench className="w-8 h-8 text-primary wrench-animate" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Sri Kandhan Autos
            </h1>
            <Wrench className="w-8 h-8 text-primary wrench-animate" />
          </div>
          <p className="text-muted-foreground animate-slide-up-delay-1">Please login to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2 animate-slide-up-delay-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="transition-all duration-300 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                required
              />
            </div>
            <div className="space-y-2 animate-slide-up-delay-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="transition-all duration-300 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                required
              />
            </div>
            <Button type="submit" className="w-full btn-hover-glow animate-slide-up-delay-3">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
