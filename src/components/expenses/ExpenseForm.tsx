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
import type { Expense, PaymentMethod, ExpenseCategory, Attachment } from "@/data/mockData";
import { useCategories } from "@/hooks/useCategories";

const schema = z.object({
  date: z.date({ required_error: "Required" }),
  description: z.string().min(1).max(200),
  category: z.string().min(1),
  cost_center: z.string().min(1).max(100),
  amount: z.coerce.number().positive(),
  payment_method: z.enum(["pix", "bankSlip", "creditCard", "transfer", "cash"]),
  installments: z.coerce.number().int().min(1).max(48),
  is_personal: z.boolean(),
  is_recurring: z.boolean(),
  recurrence_interval: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Expense, pendingFiles: File[]) => void;
  expense?: Expense | null;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  companyId?: string;
}

export function ExpenseForm({ open, onOpenChange, onSave, expense, attachments = [], onAttachmentsChange, companyId = "" }: ExpenseFormProps) {
  const { t } = useLanguage();
  const { categories } = useCategories();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const isEditing = !!expense;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: "", cost_center: "", amount: 0, payment_method: "pix",
      category: categories[0]?.name || "", installments: 1, is_personal: false,
      is_recurring: false, recurrence_interval: "monthly",
    },
  });

  useEffect(() => {
    if (open && expense) {
      form.reset({
        date: new Date(expense.date + "T00:00:00"),
        description: expense.description,
        category: expense.category as any,
        cost_center: expense.cost_center,
        amount: expense.amount,
        payment_method: expense.payment_method as any,
        installments: expense.installments,
        is_personal: expense.is_personal,
        is_recurring: expense.is_recurring,
        recurrence_interval: expense.recurrence_interval || "monthly",
      });
    } else if (open) {
      form.reset({
        description: "", cost_center: "", amount: 0, payment_method: "pix",
        category: categories[0]?.name || "", installments: 1, is_personal: false,
        is_recurring: false, recurrence_interval: "monthly",
      });
      setPendingFiles([]);
    }
  }, [open, expense]);

  const isRecurring = form.watch("is_recurring");

  function onSubmit(values: FormValues) {
    const exp: Expense = {
      id: expense?.id || Date.now(),
      date: format(values.date, "yyyy-MM-dd"),
      description: values.description,
      category: values.category as ExpenseCategory,
      cost_center: values.cost_center,
      amount: values.amount,
      payment_method: values.payment_method as PaymentMethod,
      installments: values.installments,
      installment_number: expense?.installment_number || 1,
      installment_total: values.installments,
      is_fixed: false,
      is_personal: values.is_personal,
      is_recurring: values.is_recurring,
      recurrence_interval: values.is_recurring ? values.recurrence_interval : undefined,
      recurrence_group_id: expense?.recurrence_group_id,
    };
    onSave(exp, pendingFiles);
    setPendingFiles([]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("editExpense") : t("newExpense")}</DialogTitle>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("category")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cost_center" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("costCenter")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("amount")}</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
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
            </div>

            <FormField control={form.control} name="installments" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("installments")}</FormLabel>
                <FormControl><Input type="number" min={1} max={48} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-8">
              <FormField control={form.control} name="is_personal" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="cursor-pointer">{t("personal")}</FormLabel>
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
                recordId={isEditing ? (expense!.id as string) : undefined}
                recordType="expense"
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
