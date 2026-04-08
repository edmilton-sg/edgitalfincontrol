import { useState, useRef } from "react";
import { format } from "date-fns";
import { CalendarIcon, Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PayrollRow } from "./PayrollTable";

interface PayrollPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: PayrollRow | null;
  onConfirm: (data: {
    payroll: PayrollRow;
    paymentDate: string;
    invoiceFile: File;
    proofFile: File;
    boletoFile?: File;
  }) => void;
  loading?: boolean;
}

export function PayrollPaymentDialog({
  open, onOpenChange, payroll, onConfirm, loading,
}: PayrollPaymentDialogProps) {
  const { t } = useLanguage();
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [boletoFile, setBoletoFile] = useState<File | null>(null);

  const invoiceRef = useRef<HTMLInputElement>(null);
  const proofRef = useRef<HTMLInputElement>(null);
  const boletoRef = useRef<HTMLInputElement>(null);

  const canConfirm = !!paymentDate && !!invoiceFile && !!proofFile && !loading;

  function reset() {
    setPaymentDate(new Date());
    setInvoiceFile(null);
    setProofFile(null);
    setBoletoFile(null);
  }

  function handleOpenChange(o: boolean) {
    if (!o) reset();
    onOpenChange(o);
  }

  function handleConfirm() {
    if (!payroll || !paymentDate || !invoiceFile || !proofFile) return;
    onConfirm({
      payroll,
      paymentDate: format(paymentDate, "yyyy-MM-dd"),
      invoiceFile,
      proofFile,
      boletoFile: boletoFile ?? undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("paymentConfirmation")}</DialogTitle>
          <DialogDescription>{t("paymentConfirmationDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment date */}
          <div className="space-y-2">
            <Label>{t("paymentDate")} *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !paymentDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, "dd/MM/yyyy") : t("selectFile")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={setPaymentDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Invoice file (required) */}
          <FileField
            label={`${t("invoiceFile")} *`}
            file={invoiceFile}
            inputRef={invoiceRef}
            onSelect={setInvoiceFile}
            onClear={() => setInvoiceFile(null)}
          />

          {/* Payment proof (required) */}
          <FileField
            label={`${t("paymentProofFile")} *`}
            file={proofFile}
            inputRef={proofRef}
            onSelect={setProofFile}
            onClear={() => setProofFile(null)}
          />

          {/* Boleto (optional) */}
          <FileField
            label={t("boleto")}
            file={boletoFile}
            inputRef={boletoRef}
            onSelect={setBoletoFile}
            onClear={() => setBoletoFile(null)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {loading ? t("saving") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FileField({
  label, file, inputRef, onSelect, onClear,
}: {
  label: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onSelect: (f: File) => void;
  onClear: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />
      {file ? (
        <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate flex-1">{file.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClear}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" /> {t("selectFile")}
        </Button>
      )}
    </div>
  );
}
