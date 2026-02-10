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
import type { Expense, PaymentMethod, ExpenseCategory } from "@/data/mockData";

const schema = z.object({
  date: z.date({ required_error: "Required" }),
  description: z.string().min(1).max(200),
  category: z.enum(["rent", "energy", "internet", "officeSupplies", "marketing", "transport", "food", "software"]),
  cost_center: z.string().min(1).max(100),
  amount: z.coerce.number().positive(),
  payment_method: z.enum(["pix", "bankSlip", "creditCard", "transfer", "cash"]),
  installments: z.coerce.number().int().min(1).max(48),
  is_fixed: z.boolean(),
  is_personal: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Expense) => void;
}

export function ExpenseForm({ open, onOpenChange, onSave }: ExpenseFormProps) {
  const { t } = useLanguage();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { description: "", cost_center: "", amount: 0, payment_method: "pix", category: "rent", installments: 1, is_fixed: false, is_personal: false },
  });

  function onSubmit(values: FormValues) {
    const expense: Expense = {
      id: Date.now(),
      date: format(values.date, "yyyy-MM-dd"),
      description: values.description,
      category: values.category as ExpenseCategory,
      cost_center: values.cost_center,
      amount: values.amount,
      payment_method: values.payment_method as PaymentMethod,
      installments: values.installments,
      installment_number: 1,
      installment_total: values.installments,
      is_fixed: values.is_fixed,
      is_personal: values.is_personal,
    };
    onSave(expense);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("newExpense")}</DialogTitle>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(["rent", "energy", "internet", "officeSupplies", "marketing", "transport", "food", "software"] as const).map((c) => (
                        <SelectItem key={c} value={c}>{t(c)}</SelectItem>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <FormField control={form.control} name="is_fixed" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="cursor-pointer">{t("fixed")}</FormLabel>
                </FormItem>
              )} />
              <FormField control={form.control} name="is_personal" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="cursor-pointer">{t("personal")}</FormLabel>
                </FormItem>
              )} />
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
