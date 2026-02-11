import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FileAttachments } from "@/components/shared/FileAttachments";
import type { Revenue, PaymentMethod, TransactionStatus, Attachment } from "@/data/mockData";

const schema = z.object({
  date: z.date({ required_error: "Required" }),
  description: z.string().min(1).max(200),
  client: z.string().min(1).max(200),
  gross_amount: z.coerce.number().positive(),
  fee_amount: z.coerce.number().min(0),
  payment_method: z.enum(["pix", "bankSlip", "creditCard", "transfer", "cash"]),
  status: z.enum(["paid", "pending", "overdue"]),
  is_recurring: z.boolean(),
  recurrence_interval: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface RevenueFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (revenue: Revenue, pendingFiles: File[]) => void;
  revenue?: Revenue | null;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  companyId?: string;
}

export function RevenueForm({ open, onOpenChange, onSave, revenue, attachments = [], onAttachmentsChange, companyId = "" }: RevenueFormProps) {
  const { t } = useLanguage();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const isEditing = !!revenue;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: "", client: "", gross_amount: 0, fee_amount: 0,
      payment_method: "pix", status: "pending", is_recurring: false, recurrence_interval: "monthly",
    },
  });

  useEffect(() => {
    if (open && revenue) {
      form.reset({
        date: new Date(revenue.date + "T00:00:00"),
        description: revenue.description,
        client: revenue.client,
        gross_amount: revenue.gross_amount,
        fee_amount: revenue.fee_amount,
        payment_method: revenue.payment_method,
        status: revenue.status,
        is_recurring: revenue.is_recurring,
        recurrence_interval: revenue.recurrence_interval || "monthly",
      });
    } else if (open) {
      form.reset({
        description: "", client: "", gross_amount: 0, fee_amount: 0,
        payment_method: "pix", status: "pending", is_recurring: false, recurrence_interval: "monthly",
      });
      setPendingFiles([]);
    }
  }, [open, revenue]);

  const grossAmount = form.watch("gross_amount") || 0;
  const feeAmount = form.watch("fee_amount") || 0;
  const netAmount = grossAmount - feeAmount;
  const isRecurring = form.watch("is_recurring");

  function onSubmit(values: FormValues) {
    const rev: Revenue = {
      id: revenue?.id || Date.now(),
      date: format(values.date, "yyyy-MM-dd"),
      description: values.description,
      client: values.client,
      gross_amount: values.gross_amount,
      fee_amount: values.fee_amount,
      net_amount: values.gross_amount - values.fee_amount,
      payment_method: values.payment_method as PaymentMethod,
      status: values.status as TransactionStatus,
      is_recurring: values.is_recurring,
      recurrence_interval: values.is_recurring ? values.recurrence_interval : undefined,
      recurrence_group_id: revenue?.recurrence_group_id,
    };
    onSave(rev, pendingFiles);
    setPendingFiles([]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("editRevenue") : t("newRevenue")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("date")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : t("date")}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("description")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="client" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("client")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="gross_amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("grossAmount")}</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fee_amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("feeAmount")}</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="text-muted-foreground">{t("netAmount")}:</span>{" "}
              <span className="font-semibold">{netAmount.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="payment_method" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("paymentMethod")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pix">{t("pix")}</SelectItem>
                      <SelectItem value="bankSlip">{t("bankSlip")}</SelectItem>
                      <SelectItem value="creditCard">{t("creditCard")}</SelectItem>
                      <SelectItem value="transfer">{t("transfer")}</SelectItem>
                      <SelectItem value="cash">{t("cash")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="paid">{t("paid")}</SelectItem>
                      <SelectItem value="pending">{t("pending")}</SelectItem>
                      <SelectItem value="overdue">{t("overdue")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Recurrence */}
            <div className="space-y-3 rounded-md border p-3">
              <FormField control={form.control} name="is_recurring" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="cursor-pointer">{t("recurring")}</FormLabel>
                </FormItem>
              )} />
              {isRecurring && (
                <FormField control={form.control} name="recurrence_interval" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("recurrenceInterval")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "monthly"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">{t("monthly")}</SelectItem>
                        <SelectItem value="weekly">{t("weekly")}</SelectItem>
                        <SelectItem value="yearly">{t("yearly")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              )}
            </div>

            {/* Attachments */}
            <div className="border-t pt-4">
              <FileAttachments
                attachments={attachments}
                recordId={isEditing ? (revenue!.id as string) : undefined}
                recordType="revenue"
                companyId={companyId}
                onAttachmentsChange={onAttachmentsChange}
                pendingFiles={pendingFiles}
                onPendingFilesChange={setPendingFiles}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
              <Button type="submit">{t("save")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
