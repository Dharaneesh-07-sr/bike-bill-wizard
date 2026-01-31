import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Wrench, Bike, Calendar, User, FileText, LogOut } from "lucide-react";
import { toast } from "sonner";


interface PartItem {
  id: string;
  label: string;
  price: number;
  quantity: number;
}

const initialParts: PartItem[] = [
  { id: "oil_4t", label: "OIL 4T", price: 0, quantity: 0 },
  { id: "oil_20w", label: "OIL 20W", price: 0, quantity: 0 },
  { id: "brake_shoe_rr", label: "BRAKE SHOE RR", price: 0, quantity: 0 },
  { id: "brake_shoe_fr", label: "BRAKE SHOE FR", price: 0, quantity: 0 },
  { id: "oil_bolt", label: "OIL BOLT", price: 0, quantity: 0 },
  { id: "oil_horring", label: "OIL HORRING", price: 0, quantity: 0 },
  { id: "fork_bush", label: "FORK BUSH", price: 0, quantity: 0 },
  { id: "fork_rubber", label: "FORK RUBBER", price: 0, quantity: 0 },
  { id: "air_filter", label: "AIR FILTER", price: 0, quantity: 0 },
  { id: "sli_gas_cut", label: "SLI GAS CUT", price: 0, quantity: 0 },
  { id: "sli_cleaning", label: "SLI CLEANING", price: 0, quantity: 0 },
  { id: "spark_plug", label: "SPARK PLUG", price: 0, quantity: 0 },
  { id: "capater_bush", label: "CAPATER BUSH", price: 0, quantity: 0 },
  { id: "wiring_kit", label: "WIRING KIT", price: 0, quantity: 0 },
  { id: "head_gas_cut", label: "HEAD GAS CUT", price: 0, quantity: 0 },
  { id: "drump_bolt", label: "DRUMP BOLT", price: 0, quantity: 0 },
  { id: "hub_rubber", label: "HUB RUBBER", price: 0, quantity: 0 },
  { id: "read_valve", label: "READ VALVE", price: 0, quantity: 0 },
  { id: "lock_set", label: "LOCK SET", price: 0, quantity: 0 },
  { id: "tank_cover", label: "TANK COVER", price: 0, quantity: 0 },
  { id: "tool_cover", label: "TOOL COVER", price: 0, quantity: 0 },
  { id: "seat_cover", label: "SEAT COVER", price: 0, quantity: 0 },
  { id: "hl_blub", label: "HL BLUB", price: 0, quantity: 0 },
  { id: "dl_blub", label: "DL BLUB", price: 0, quantity: 0 },
  { id: "ind_blub", label: "IND BLUB", price: 0, quantity: 0 },
  { id: "fr_mat", label: "FR MAT", price: 0, quantity: 0 },
  { id: "rr_mat", label: "RR MAT", price: 0, quantity: 0 },
  { id: "water_wash", label: "WATER WASH", price: 0, quantity: 0 },
  { id: "weilding", label: "WEILDING", price: 0, quantity: 0 },
  { id: "labour", label: "LABOUR", price: 0, quantity: 0 },
  { id: "battery", label: "BATTERY", price: 0, quantity: 0 },
];

const BillingForm = () => {
  const [customerName, setCustomerName] = useState("");
  const [bikeName, setBikeName] = useState("");
  const [bikeNumber, setBikeNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [parts, setParts] = useState<PartItem[]>(initialParts);

  const handlePriceChange = (id: string, value: string) => {
    const price = parseFloat(value) || 0;
    setParts((prev) =>
      prev.map((part) =>
        part.id === id ? { ...part, price, quantity: price > 0 ? 1 : 0 } : part
      )
    );
  };

  const handleQuantityChange = (id: string, value: string) => {
    const quantity = parseInt(value) || 0;
    setParts((prev) =>
      prev.map((part) => (part.id === id ? { ...part, quantity } : part))
    );
  };

  const calculateTotal = () => {
    return parts.reduce((sum, part) => sum + part.price * part.quantity, 0);
  };

  const handleReset = () => {
    setCustomerName("");
    setBikeName("");
    setBikeNumber("");
    setDate(new Date().toISOString().split("T")[0]);
    setParts(initialParts);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    toast.success("Logged out successfully");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Logout Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Header */}
        {/* Divine Blessing */}
        <div className="text-center mb-4">
          <p className="text-xl md:text-2xl font-semibold text-primary">
            ஸ்ரீ பெரியகாண்டி அம்மன் துணை
          </p>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Wrench className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Sri Kandhan Autos
            </h1>
            <Wrench className="w-10 h-10 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg">
            Professional Bike Service & Repair
          </p>
          <p className="text-primary font-semibold mt-1">
            📞 9842849933, 8903683595
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            📍 Telephone Nagar, Moolapalayam, Erode
          </p>
        </div>

        {/* Customer Details Card */}
        <Card className="mb-6 border-primary/20">
          <CardHeader className="bg-card-header pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-primary" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Customer Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-input-bg border-input-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bikeName" className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-muted-foreground" />
                  Bike Name
                </Label>
                <Input
                  id="bikeName"
                  placeholder="Enter bike name"
                  value={bikeName}
                  onChange={(e) => setBikeName(e.target.value)}
                  className="bg-input-bg border-input-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bikeNumber" className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Bike Number
                </Label>
                <Input
                  id="bikeNumber"
                  placeholder="Enter bike number"
                  value={bikeNumber}
                  onChange={(e) => setBikeNumber(e.target.value)}
                  className="bg-input-bg border-input-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-input-bg border-input-border"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parts & Services Card */}
        <Card className="mb-6 border-primary/20">
          <CardHeader className="bg-card-header pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Wrench className="w-5 h-5 text-primary" />
              Parts & Services
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {parts.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center gap-2 p-3 rounded-lg bg-part-item border border-part-border hover:border-primary/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={`price-${part.id}`}
                      className="text-sm font-medium text-foreground block truncate"
                    >
                      {part.label}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`price-${part.id}`}
                      type="number"
                      placeholder="₹"
                      value={part.price || ""}
                      onChange={(e) => handlePriceChange(part.id, e.target.value)}
                      className="w-20 h-8 text-sm bg-input-bg border-input-border"
                    />
                    <span className="text-muted-foreground text-sm">×</span>
                    <Input
                      type="number"
                      min="0"
                      value={part.quantity || ""}
                      onChange={(e) => handleQuantityChange(part.id, e.target.value)}
                      className="w-14 h-8 text-sm bg-input-bg border-input-border"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Total Card */}
        <Card className="border-primary/30 bg-total-card">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Reset All
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Print Bill
                </Button>
              </div>
              <Separator className="sm:hidden w-full" />
              <div className="flex items-center gap-4">
                <span className="text-lg font-medium text-muted-foreground">
                  TOTAL:
                </span>
                <span className="text-3xl md:text-4xl font-bold text-total">
                  ₹{calculateTotal().toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-muted-foreground text-sm">
          <p>© 2026 Sri Kandhan Autos. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default BillingForm;
