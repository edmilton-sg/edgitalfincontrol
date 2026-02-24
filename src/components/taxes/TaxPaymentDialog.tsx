import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Upload, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface TaxGuide {
  referenceMonth: string;
  estimatedAmount: number;
  dueDate: string;
  paymentId?: string;
}

interface TaxPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guide: TaxGuide | null;
  onSaved: () => void;
}

interface VerificationResult {
  extracted_value: number | null;
  extracted_date: string | null;
  confidence: string;
  divergent: boolean;
}

export function TaxPaymentDialog({ open, onOpenChange, guide, onSaved }: TaxPaymentDialogProps) {
  const { t } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const [paidAmount, setPaidAmount] = useState("");
  const [paidDate, setPaidDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setPaidAmount("");
    setPaidDate(format(new Date(), "yyyy-MM-dd"));
    setSelectedFile(null);
    setVerification(null);
    setVerifying(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(t("fileTooBig"));
        return;
      }
      setSelectedFile(file);
      setVerification(null);
    }
  };

  const extractPDFText = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return text;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleVerify = async () => {
    if (!selectedFile) return;
    setVerifying(true);
    setVerification(null);

    try {
      const isPDF = selectedFile.type === "application/pdf";
      let payload: any;

      if (isPDF) {
        const text = await extractPDFText(selectedFile);
        payload = { content: text, type: "text" };
      } else {
        const base64 = await fileToBase64(selectedFile);
        payload = { content: "", type: "image", image_base64: base64 };
      }

      const { data, error } = await supabase.functions.invoke("verify-tax-receipt", {
        body: payload,
      });

      if (error) throw error;

      const userAmount = parseFloat(paidAmount) || guide?.estimatedAmount || 0;
      const extractedVal = data.extracted_value;
      let divergent = false;

      if (extractedVal != null && userAmount > 0) {
        const diff = Math.abs(extractedVal - userAmount) / userAmount;
        divergent = diff > 0.01;
      }

      setVerification({ ...data, divergent });

      if (data.extracted_date && !paidDate) {
        setPaidDate(data.extracted_date);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      toast.error(t("aiVerificationError"));
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId || !guide) return;
    if (!selectedFile) {
      toast.error(t("receiptRequiredError"));
      return;
    }

    setSaving(true);
    const amount = parseFloat(paidAmount) || guide.estimatedAmount;

    let paymentId = guide.paymentId;

    if (paymentId) {
      await supabase.from("tax_payments" as any).update({
        paid_amount: amount,
        paid_date: paidDate,
        status: "paid",
      }).eq("id", paymentId);
    } else {
      const { data: inserted } = await supabase.from("tax_payments" as any).insert({
        company_id: selectedCompanyId,
        reference_month: guide.referenceMonth,
        tax_type: "DAS",
        estimated_amount: guide.estimatedAmount,
        paid_amount: amount,
        due_date: guide.dueDate,
        paid_date: paidDate,
        status: "paid",
      }).select("id").single();
      paymentId = (inserted as any)?.id;
    }

    // Upload receipt
    if (paymentId && selectedFile) {
      const timestamp = Date.now();
      const filePath = `${selectedCompanyId}/tax_payment/${paymentId}/${timestamp}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, selectedFile);

      if (!uploadError) {
        await supabase.from("attachments").insert({
          company_id: selectedCompanyId,
          record_id: paymentId,
          record_type: "tax_payment",
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          content_type: selectedFile.type,
        });
      }
    }

    setSaving(false);
    toast.success(t("paymentRegistered"));
    onSaved();
    handleOpenChange(false);
  };

  const userAmount = parseFloat(paidAmount) || guide?.estimatedAmount || 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("markAsPaid")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("paidAmount")}</Label>
            <Input
              type="number"
              step="0.01"
              value={paidAmount}
              onChange={(e) => { setPaidAmount(e.target.value); setVerification(null); }}
              placeholder={guide?.estimatedAmount.toFixed(2)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("paymentDate")}</Label>
            <Input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
            />
          </div>

          {/* Receipt upload */}
          <div className="space-y-2">
            <Label>{t("receiptRequired")} *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {selectedFile ? selectedFile.name : t("attachReceipt")}
            </Button>
          </div>

          {/* Verify button */}
          {selectedFile && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("verifying")}</>
              ) : (
                t("verifyReceipt")
              )}
            </Button>
          )}

          {/* Verification result */}
          {verification && (
            <div className="space-y-2">
              {verification.extracted_value != null && (
                <p className="text-sm text-muted-foreground">
                  {t("aiExtractedValue")}: R$ {verification.extracted_value.toFixed(2)}
                </p>
              )}
              {verification.divergent ? (
                <Alert variant="destructive" className="border-yellow-500 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                    {t("receiptValueDivergence")}
                    <br />
                    <span className="text-xs">
                      {t("paidAmount")}: R$ {userAmount.toFixed(2)} | {t("aiExtractedValue")}: R$ {verification.extracted_value?.toFixed(2)}
                    </span>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-500 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {t("receiptValueMatch")}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>{t("cancel")}</Button>
            <Button onClick={handleSave} disabled={saving || !selectedFile}>{t("save")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
