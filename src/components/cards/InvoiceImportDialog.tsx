import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, FileText } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseInvoiceCSV, type ParsedTransaction } from "@/lib/parseInvoiceCSV";
import { useCategories } from "@/hooks/useCategories";

interface InvoiceImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  companyId: string;
}

async function extractPDFText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n");
}

export function InvoiceImportDialog({ open, onOpenChange, cardId, companyId }: InvoiceImportDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { categories } = useCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "review">("upload");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setLoading(false);
    setTransactions([]);
    setImporting(false);
    setSelectedFile(null);
  }, []);

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function processFile(file: File) {
    setSelectedFile(file);
    setLoading(true);

    try {
      let parsed: ParsedTransaction[] = [];

      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        parsed = parseInvoiceCSV(text);
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        const text = await extractPDFText(file);
        const { data, error } = await supabase.functions.invoke("parse-invoice", {
          body: { content: text },
        });

        if (error) throw new Error(error.message || t("parsingError"));

        if (data?.error) {
          throw new Error(data.message || t("parsingError"));
        }

        parsed = (data?.transactions || []).map((tx: any) => ({
          date: tx.date,
          description: tx.description,
          amount: Math.abs(tx.amount),
          installment_number: tx.installment_number || undefined,
          installment_total: tx.installment_total || undefined,
          category: "",
          selected: true,
        }));
      } else {
        throw new Error(t("invalidFile") || "Invalid file");
      }

      if (parsed.length === 0) {
        toast({ title: t("noTransactionsFound"), variant: "destructive" });
        setLoading(false);
        return;
      }

      setTransactions(parsed);
      setStep("review");
    } catch (err: any) {
      console.error("Parse error:", err);
      toast({ title: t("parsingError"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function toggleAll(checked: boolean) {
    setTransactions((prev) => prev.map((tx) => ({ ...tx, selected: checked })));
  }

  function updateTx(index: number, field: keyof ParsedTransaction, value: any) {
    setTransactions((prev) =>
      prev.map((tx, i) => (i === index ? { ...tx, [field]: value } : tx))
    );
  }

  const selectedTxs = transactions.filter((tx) => tx.selected);
  const selectedTotal = selectedTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const allSelected = transactions.length > 0 && transactions.every((tx) => tx.selected);

  async function handleImport() {
    if (selectedTxs.length === 0) return;
    setImporting(true);

    try {
      // Insert transactions
      const rows = selectedTxs.map((tx) => ({
        card_id: cardId,
        company_id: companyId,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        category: tx.category || null,
        installment_number: tx.installment_number || null,
        installment_total: tx.installment_total || null,
      }));

      const { error } = await supabase.from("card_transactions").insert(rows);
      if (error) throw error;

      // Upload original file
      if (selectedFile) {
        const filePath = `${companyId}/card_invoice/${cardId}/${Date.now()}_${selectedFile.name}`;
        await supabase.storage.from("attachments").upload(filePath, selectedFile);
        await supabase.from("attachments").insert({
          record_type: "card_invoice",
          record_id: cardId,
          company_id: companyId,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          content_type: selectedFile.type,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["card_transactions", cardId] });
      toast({ title: t("transactionsImported") });
      handleClose(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" ? t("importInvoice") : t("reviewTransactions")}
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div
            className="flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg p-12 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {loading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("processing")}</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">{t("dragDropFile")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("supportedFormats")}</p>
                </div>
                <Button variant="outline" size="sm" type="button">
                  <FileText className="h-4 w-4 mr-2" />
                  {t("selectFile")}
                </Button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {step === "review" && (
          <div className="flex flex-col gap-3 min-h-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                />
                <span className="text-sm">
                  {allSelected ? t("deselectAll") : t("selectAll")}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedTxs.length} {t("totalSelected")} — R$ {selectedTotal.toFixed(2)}
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto max-h-[50vh] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead className="w-28">{t("date")}</TableHead>
                    <TableHead>{t("description")}</TableHead>
                    <TableHead className="w-32">{t("category")}</TableHead>
                    <TableHead className="w-24 text-right">{t("amount")}</TableHead>
                    <TableHead className="w-20">{t("installment")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Checkbox
                          checked={tx.selected}
                          onCheckedChange={(checked) => updateTx(i, "selected", !!checked)}
                        />
                      </TableCell>
                      <TableCell className="text-xs">{tx.date}</TableCell>
                      <TableCell>
                        <Input
                          value={tx.description}
                          onChange={(e) => updateTx(i, "description", e.target.value)}
                          className="h-7 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={tx.category || "__none__"}
                          onValueChange={(v) => updateTx(i, "category", v === "__none__" ? "" : v)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">—</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        R$ {tx.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        {tx.installment_number && tx.installment_total
                          ? `${tx.installment_number}/${tx.installment_total}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleImport} disabled={importing || selectedTxs.length === 0}>
                {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("importSelected")} ({selectedTxs.length})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
