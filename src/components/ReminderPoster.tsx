import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileDown } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

const W = 1080;
const H = 1440;

const ORANGE = "#f97316";
const AMBER = "#fbbf24";
const BG = "#101418";
const PANEL = "#1a2028";
const TEXT = "#f8fafc";
const MUTED = "#94a3b8";

const REMINDER_MESSAGE =
  "Greetings from Sri Kandhan Autos! This is a gentle reminder that your bike is due for its next service. Regular servicing keeps your bike safe, smooth and fuel-efficient. We look forward to serving you again!";

interface PosterData {
  customerName: string;
  bikeName: string;
  bikeNumber: string;
  nextServiceDate: string;
}

const formatDate = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const drawGear = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, teeth: number, color: string, alpha: number) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
    const a3 = ((i + 1) / teeth) * Math.PI * 2;
    ctx.arc(cx, cy, r + 14, a, a2);
    ctx.arc(cx, cy, r, a2, a3);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const drawTread = (ctx: CanvasRenderingContext2D, y: number) => {
  ctx.save();
  ctx.fillStyle = ORANGE;
  ctx.globalAlpha = 0.85;
  for (let x = -20; x < W + 40; x += 52) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 5);
    ctx.fillRect(0, 0, 30, 10);
    ctx.restore();
  }
  ctx.restore();
};

const drawMotorcycle = (ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.strokeStyle = AMBER;
  ctx.fillStyle = AMBER;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const wheelR = 78;
  const rearX = -170;
  const frontX = 170;

  // Wheels
  for (const wx of [rearX, frontX]) {
    ctx.beginPath();
    ctx.arc(wx, 0, wheelR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(wx, 0, wheelR * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(wx, 0);
      ctx.lineTo(wx + Math.cos(a) * wheelR, Math.sin(a) * wheelR);
      ctx.globalAlpha = 0.35;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // Frame
  ctx.beginPath();
  ctx.moveTo(rearX, -10);
  ctx.lineTo(-60, -95);
  ctx.lineTo(70, -95);
  ctx.lineTo(frontX - 25, -15);
  ctx.stroke();

  // Engine block
  ctx.beginPath();
  ctx.roundRect(-70, -70, 120, 60, 10);
  ctx.stroke();

  // Seat
  ctx.beginPath();
  ctx.moveTo(-130, -100);
  ctx.lineTo(-45, -100);
  ctx.stroke();

  // Rear fender
  ctx.beginPath();
  ctx.arc(rearX, 0, wheelR + 18, Math.PI * 1.05, Math.PI * 1.6);
  ctx.stroke();

  // Front fork + fender
  ctx.beginPath();
  ctx.moveTo(70, -95);
  ctx.lineTo(frontX, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(frontX, 0, wheelR + 18, Math.PI * 1.35, Math.PI * 1.95);
  ctx.stroke();

  // Handlebar
  ctx.beginPath();
  ctx.moveTo(70, -95);
  ctx.lineTo(100, -150);
  ctx.lineTo(140, -145);
  ctx.stroke();

  // Headlight
  ctx.beginPath();
  ctx.arc(120, -115, 18, 0, Math.PI * 2);
  ctx.stroke();

  // Fuel tank
  ctx.beginPath();
  ctx.moveTo(-45, -100);
  ctx.quadraticCurveTo(10, -130, 70, -95);
  ctx.stroke();

  // Exhaust
  ctx.beginPath();
  ctx.moveTo(-20, -20);
  ctx.quadraticCurveTo(-120, 10, rearX - 30, -35);
  ctx.stroke();

  ctx.restore();
};

export const drawPoster = (canvas: HTMLCanvasElement, data: PosterData) => {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Subtle diagonal sheen
  const sheen = ctx.createLinearGradient(0, 0, W, H);
  sheen.addColorStop(0, "rgba(249,115,22,0.10)");
  sheen.addColorStop(0.5, "rgba(249,115,22,0)");
  sheen.addColorStop(1, "rgba(251,191,36,0.08)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);

  // Decorative gears
  drawGear(ctx, W - 60, 90, 110, 12, ORANGE, 0.25);
  drawGear(ctx, 60, 1290, 90, 10, AMBER, 0.18);

  // Top brand bar
  ctx.fillStyle = ORANGE;
  ctx.fillRect(0, 0, W, 14);
  ctx.fillStyle = AMBER;
  ctx.fillRect(0, 14, W, 4);

  // Branding
  ctx.textAlign = "center";
  ctx.fillStyle = MUTED;
  ctx.font = "600 30px Arial, sans-serif";
  ctx.fillText("ஸ்ரீ பெரியகாண்டி அம்மன் துணை", W / 2, 100);

  ctx.fillStyle = TEXT;
  ctx.font = "900 78px Arial, sans-serif";
  ctx.fillText("SRI KANDHAN AUTOS", W / 2, 190);

  ctx.fillStyle = MUTED;
  ctx.font = "500 32px Arial, sans-serif";
  ctx.fillText("Professional Bike Service & Repair", W / 2, 245);

  // Divider
  ctx.strokeStyle = "rgba(249,115,22,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(240, 285);
  ctx.lineTo(W - 240, 285);
  ctx.stroke();

  // SERVICE REMINDER heading with side rules
  ctx.fillStyle = ORANGE;
  ctx.font = "900 92px Arial, sans-serif";
  ctx.fillText("SERVICE", W / 2, 415);
  const grad = ctx.createLinearGradient(W / 2 - 300, 0, W / 2 + 300, 0);
  grad.addColorStop(0, ORANGE);
  grad.addColorStop(1, AMBER);
  ctx.fillStyle = grad;
  ctx.fillText("REMINDER", W / 2, 515);

  // Customer name
  ctx.fillStyle = MUTED;
  ctx.font = "500 34px Arial, sans-serif";
  ctx.fillText("Dear", W / 2, 600);
  ctx.fillStyle = TEXT;
  ctx.font = "800 64px Arial, sans-serif";
  const name = (data.customerName || "Valued Customer").toUpperCase();
  ctx.fillText(name, W / 2, 670);

  // Bike details line
  const bikeLine = [data.bikeName, data.bikeNumber].filter(Boolean).join("  •  ");
  if (bikeLine) {
    ctx.fillStyle = AMBER;
    ctx.font = "600 34px Arial, sans-serif";
    ctx.fillText(bikeLine, W / 2, 725);
  }

  // Reminder message panel
  const panelY = 770;
  ctx.fillStyle = PANEL;
  ctx.strokeStyle = "rgba(249,115,22,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(90, panelY, W - 180, 210, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = TEXT;
  ctx.font = "400 33px Arial, sans-serif";
  ctx.textAlign = "center";
  const lines = wrapText(ctx, REMINDER_MESSAGE, W - 260);
  lines.slice(0, 4).forEach((line, i) => {
    ctx.fillText(line, W / 2, panelY + 60 + i * 48);
  });

  // Next service date box
  const dateY = 1045;
  const dateGrad = ctx.createLinearGradient(140, dateY, W - 140, dateY + 150);
  dateGrad.addColorStop(0, ORANGE);
  dateGrad.addColorStop(1, "#ea580c");
  ctx.fillStyle = dateGrad;
  ctx.beginPath();
  ctx.roundRect(140, dateY, W - 280, 170, 22);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "700 34px Arial, sans-serif";
  ctx.fillText("📅  NEXT SERVICE DATE", W / 2, dateY + 60);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 58px Arial, sans-serif";
  ctx.fillText(formatDate(data.nextServiceDate), W / 2, dateY + 130);

  // Motorcycle illustration
  drawMotorcycle(ctx, W / 2, 1330, 0.62);

  // Tread strip above footer
  drawTread(ctx, 1390);

  // Footer contact
  ctx.fillStyle = "#0b0e12";
  ctx.fillRect(0, 1412, W, 28);
  ctx.fillStyle = TEXT;
  ctx.font = "700 30px Arial, sans-serif";
  ctx.fillText(`📞  ${"9842849933"}`, W / 2, 1434);

  // Footer band
  ctx.fillStyle = ORANGE;
  ctx.fillRect(0, H - 14, W, 14);
};

interface ReminderPosterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PosterData;
}

const ReminderPoster = ({ open, onOpenChange, data }: ReminderPosterProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (open && canvasRef.current) {
      drawPoster(canvasRef.current, data);
      setPreview(canvasRef.current.toDataURL("image/png"));
    }
  }, [open, data]);

  const getCanvas = () => {
    if (canvasRef.current) drawPoster(canvasRef.current, data);
    return canvasRef.current;
  };

  const handleDownloadPng = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `service-reminder-${data.customerName || "customer"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Poster downloaded as PNG");
  };

  const handleDownloadPdf = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [W, H], hotfixes: ["px_scaling"] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, W, H);
    pdf.save(`service-reminder-${data.customerName || "customer"}.pdf`);
    toast.success("Poster downloaded as PDF");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📄 Service Reminder Poster
          </DialogTitle>
        </DialogHeader>
        <canvas ref={canvasRef} className="hidden" />
        {preview && (
          <img
            src={preview}
            alt="Service reminder poster preview"
            className="w-full rounded-lg border border-border"
          />
        )}
        <div className="flex gap-3 mt-2">
          <Button onClick={handleDownloadPng} className="flex-1 btn-hover-glow">
            <Download className="w-4 h-4 mr-2" />
            PNG
          </Button>
          <Button onClick={handleDownloadPdf} variant="outline" className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <FileDown className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderPoster;
