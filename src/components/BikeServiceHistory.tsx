import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Bike,
  CalendarDays,
  Download,
  FileArchive,
  FileText,
  Pencil,
  Search,
  Upload,
  UserRound,
  X,
} from "lucide-react";

type Customer = {
  id: string;
  owner_name: string;
  bike_model: string | null;
  bike_number: string | null;
};

type Bill = {
  id: string;
  customer_id: string;
  file_name: string;
  storage_path: string;
  service_date: string | null;
  created_at: string;
  file_size: number | null;
  price: number | null;
};

type PendingUpload = {
  id: string;
  file: File;
  ownerName: string;
  customerId: string;
  price: string;
};

type BikeServiceHistoryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const normalizeOwnerName = (value: string) =>
  value
    .replace(/\.pdf$/i, "")
    .replace(/[_-]\d+$/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

const displayOwnerName = (fileName: string) =>
  fileName
    .replace(/\.pdf$/i, "")
    .replace(/[_-]\d+$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();

const formatDate = (value: string | null) => {
  if (!value) return "Date not recorded";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatFileSize = (value: number | null) => {
  if (!value) return "PDF bill";
  return `${(value / 1024).toFixed(value > 1024 * 1024 ? 1 : 0)} ${value > 1024 * 1024 ? "MB" : "KB"}`;
};

const formatPrice = (value: number | null) => {
  if (value === null || value === undefined) return null;
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const BikeServiceHistory = ({ open, onOpenChange }: BikeServiceHistoryProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    const [{ data: customerRows, error: customerError }, { data: billRows, error: billError }] = await Promise.all([
      supabase
        .from("service_history_customers")
        .select("id, owner_name, bike_model, bike_number")
        .order("owner_name"),
      supabase
        .from("service_history_bills")
        .select("id, customer_id, file_name, storage_path, service_date, price, created_at, file_size")
        .order("file_name", { ascending: true }),
    ]);

    if (customerError || billError) {
      toast.error("Could not load bike service history");
    } else {
      setCustomers(customerRows ?? []);
      setBills(billRows ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (open) void loadHistory();
  }, [loadHistory, open]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [customer.owner_name, customer.bike_model, customer.bike_number]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term)),
    );
  }, [customers, search]);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) ?? null;
  const selectedBills = bills.filter((bill) => bill.customer_id === selectedCustomerId);

  const findCustomerForFile = (fileName: string) => {
    const normalized = normalizeOwnerName(fileName);
    return customers.find((customer) => normalizeOwnerName(customer.owner_name) === normalized)?.id ?? "";
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    );
    if (files.length === 0) return;

    setPendingUploads(
      files.map((file) => ({
        id: `${file.name}-${file.lastModified}`,
        file,
        ownerName: displayOwnerName(file.name),
        customerId: findCustomerForFile(file.name),
        price: "",
      })),
    );
    event.target.value = "";
  };

  const updatePendingCustomer = (pendingId: string, customerId: string) => {
    setPendingUploads((current) =>
      current.map((pending) => (pending.id === pendingId ? { ...pending, customerId } : pending)),
    );
  };

  const updatePendingPrice = (pendingId: string, price: string) => {
    setPendingUploads((current) =>
      current.map((pending) => (pending.id === pendingId ? { ...pending, price } : pending)),
    );
  };

  const removePendingFile = (pendingId: string) => {
    setPendingUploads((current) => current.filter((pending) => pending.id !== pendingId));
  };

  const uploadBills = async () => {
    if (pendingUploads.length === 0) return;
    const unmatched = pendingUploads.filter((pending) => !pending.customerId);
    if (unmatched.length > 0) {
      toast.error("Customer not found – Please select the customer manually");
      return;
    }

    setIsUploading(true);
    let uploadedCount = 0;
    try {
      for (const pending of pendingUploads) {
        const safeFileName = pending.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const storagePath = `service-bills/${crypto.randomUUID()}-${safeFileName}`;
        const { error: storageError } = await supabase.storage
          .from("service-bills")
          .upload(storagePath, pending.file, { contentType: "application/pdf", upsert: false });
        if (storageError) throw storageError;

        const { error: billError } = await supabase.from("service_history_bills").insert({
          customer_id: pending.customerId,
          file_name: pending.file.name,
          storage_path: storagePath,
          file_size: pending.file.size,
          price: pending.price.trim() === "" || !Number.isFinite(Number(pending.price)) ? null : Number(pending.price),
        });
        if (billError) throw billError;
        uploadedCount += 1;
      }

      setPendingUploads([]);
      await loadHistory();
      toast.success(`${uploadedCount} bills uploaded successfully`);
    } catch (error) {
      console.error(error);
      toast.error("Some bills could not be uploaded. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const startPriceEdit = (bill: Bill) => {
    setEditingBillId(bill.id);
    setPriceDraft(bill.price === null ? "" : String(bill.price));
  };

  const savePrice = async (bill: Bill) => {
    const trimmed = priceDraft.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
      toast.error("Enter a valid price");
      return;
    }
    setIsSavingPrice(true);
    const { error } = await supabase.from("service_history_bills").update({ price: parsed }).eq("id", bill.id);
    setIsSavingPrice(false);
    if (error) {
      toast.error("Could not save the price");
      return;
    }
    setBills((current) => current.map((item) => (item.id === bill.id ? { ...item, price: parsed } : item)));
    setEditingBillId(null);
    toast.success("Price saved");
  };

  const openBill = async (bill: Bill, download = false) => {
    const { data, error } = await supabase.storage.from("service-bills").createSignedUrl(bill.storage_path, 60 * 10);
    if (error || !data?.signedUrl) {
      toast.error("Could not open this bill");
      return;
    }

    if (download) {
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = bill.file_name;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.click();
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden p-0">
        <div className="flex max-h-[92vh] flex-col">
          <DialogHeader className="border-b border-border bg-card-header px-6 py-5 text-left">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-2xl">🏍️</span>
              Bike Service History
            </DialogTitle>
            <DialogDescription>
              Search owners, models, or bike numbers, then open any original bill without changing its contents.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.5fr)]">
            <section className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
              <div className="space-y-3 border-b border-border p-5">
                <Button className="w-full gap-2" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <Upload className="h-4 w-4" />
                  Upload Existing Bills
                </Button>
                <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" multiple className="hidden" onChange={handleFilesSelected} />
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search owner, bike model, number"
                    className="pl-9 pr-9"
                    aria-label="Search bike service history"
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground" aria-label="Clear history search">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-2 p-4">
                  {isLoading ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">Loading customers…</p>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="p-5 text-center text-sm text-muted-foreground">
                      <UserRound className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      No customers found
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const count = bills.filter((bill) => bill.customer_id === customer.id).length;
                      return (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => setSelectedCustomerId(customer.id)}
                          className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedCustomerId === customer.id ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted/60"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">{customer.owner_name}</p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">{customer.bike_model || "Bike model not recorded"}</p>
                              {customer.bike_number && <p className="mt-1 text-xs text-muted-foreground">{customer.bike_number}</p>}
                            </div>
                            <Badge variant="secondary" className="shrink-0">{count} {count === 1 ? "bill" : "bills"}</Badge>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </section>

            <section className="min-h-0 overflow-y-auto p-5">
              {selectedCustomer ? (
                <div className="space-y-5">
                  <div className="border-b border-border pb-5">
                    <p className="text-sm font-medium uppercase tracking-[0.12em] text-primary">Customer profile</p>
                    <h3 className="mt-1 text-3xl font-bold text-foreground">{selectedCustomer.owner_name}</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Bike name / model</p><p className="mt-1 flex items-center gap-2 font-medium"><Bike className="h-4 w-4 text-primary" />{selectedCustomer.bike_model || "Not recorded"}</p></div>
                      <div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Bike number</p><p className="mt-1 flex items-center gap-2 font-medium"><FileText className="h-4 w-4 text-primary" />{selectedCustomer.bike_number || "Not recorded"}</p></div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3"><h4 className="text-lg font-semibold">Previous Service Bills (A–Z)</h4><Badge variant="outline">{selectedBills.length} saved</Badge></div>
                    {selectedBills.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No previous bills saved for this customer.</div>
                    ) : (
                      <div className="space-y-3">
                        {selectedBills.map((bill) => (
                          <Card key={bill.id} className="border-border shadow-none">
                            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 items-center gap-3"><div className="rounded-lg bg-primary/10 p-2"><FileArchive className="h-5 w-5 text-primary" /></div><div className="min-w-0"><p className="truncate font-medium">{bill.file_name}</p><p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(bill.service_date)}</span>{editingBillId === bill.id ? (<span className="flex items-center gap-1"><Input type="number" min="0" step="0.01" value={priceDraft} onChange={(event) => setPriceDraft(event.target.value)} className="h-7 w-28" placeholder="Price ₹" aria-label={`Price for ${bill.file_name}`} /><Button size="sm" className="h-7 px-2 text-xs" onClick={() => void savePrice(bill)} disabled={isSavingPrice}>Save</Button><Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingBillId(null)}>Cancel</Button></span>) : (<span className="flex items-center gap-1">{bill.price === null ? "Price not set" : <span className="font-semibold text-foreground">{formatPrice(bill.price)}</span>}<button type="button" onClick={() => startPriceEdit(bill)} className="rounded p-0.5 hover:bg-muted" aria-label={`Edit price for ${bill.file_name}`}><Pencil className="h-3.5 w-3.5" /></button></span>)}<span>•</span><span>{formatFileSize(bill.file_size)}</span></p></div></div>
                              <div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => void openBill(bill)}><FileText className="mr-2 h-4 w-4" />View Bill</Button><Button variant="outline" size="sm" onClick={() => void openBill(bill, true)}><Download className="mr-2 h-4 w-4" />Download</Button></div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center text-muted-foreground"><span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">🏍️</span><h3 className="text-lg font-semibold text-foreground">Select a customer</h3><p className="mt-1 max-w-sm text-sm">Choose an owner from the list to view their bike details and previous bills.</p></div>
              )}
            </section>
          </div>

          {pendingUploads.length > 0 && (
            <div className="max-h-[45vh] overflow-y-auto border-t border-border bg-muted/30 p-5">
              <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-semibold">Review uploaded bills</h3><p className="text-sm text-muted-foreground">Owner names were read from the PDF filenames. Assign any unmatched files before uploading.</p></div><Button size="sm" onClick={() => void uploadBills()} disabled={isUploading || pendingUploads.some((pending) => !pending.customerId)}>{isUploading ? "Uploading…" : `Upload ${pendingUploads.length} ${pendingUploads.length === 1 ? "bill" : "bills"}`}</Button></div>
              <div className="space-y-2">
                {pendingUploads.map((pending) => (
                  <div key={pending.id} className="grid gap-2 rounded-lg border border-border bg-background p-3 md:grid-cols-[minmax(0,1fr)_minmax(200px,0.7fr)_minmax(140px,0.5fr)_auto] md:items-center">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{pending.file.name}</p><p className="text-xs text-muted-foreground">Owner match: {pending.ownerName}</p></div>
                    <div className="space-y-1">{pending.customerId ? <Label className="text-xs text-muted-foreground">Matched customer</Label> : <p className="text-xs font-medium text-destructive">Customer not found – Please select the customer manually</p>}<Select value={pending.customerId} onValueChange={(value) => updatePendingCustomer(pending.id, value)}><SelectTrigger className="h-9"><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.owner_name}</SelectItem>)}</SelectContent></Select></div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removePendingFile(pending.id)} aria-label={`Remove ${pending.file.name}`}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BikeServiceHistory;