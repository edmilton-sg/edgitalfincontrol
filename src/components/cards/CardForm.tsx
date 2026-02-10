import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(1).max(100),
  brand: z.enum(["visa", "mastercard", "elo", "amex"]),
  last_digits: z.string().min(4).max(4),
  card_limit: z.coerce.number().positive(),
  closing_day: z.coerce.number().int().min(1).max(31),
  due_day: z.coerce.number().int().min(1).max(31),
});

type FormValues = z.infer<typeof schema>;

interface CardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (card: { name: string; brand: string; last_digits: string; card_limit: number; closing_day: number; due_day: number }) => void;
}

export function CardForm({ open, onOpenChange, onSave }: CardFormProps) {
  const { t } = useLanguage();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", brand: "visa", last_digits: "", card_limit: 0, closing_day: 25, due_day: 5 },
  });

  function onSubmit(values: FormValues) {
    onSave(values as { name: string; brand: string; last_digits: string; card_limit: number; closing_day: number; due_day: number });
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t("newCard")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("cardName")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("cardBrand")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="visa">{t("visa")}</SelectItem>
                      <SelectItem value="mastercard">{t("mastercard")}</SelectItem>
                      <SelectItem value="elo">{t("elo")}</SelectItem>
                      <SelectItem value="amex">{t("amex")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="last_digits" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("lastDigits")}</FormLabel>
                  <FormControl><Input maxLength={4} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="card_limit" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("cardLimit")}</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="closing_day" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("closingDay")}</FormLabel>
                  <FormControl><Input type="number" min={1} max={31} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="due_day" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dueDay")}</FormLabel>
                  <FormControl><Input type="number" min={1} max={31} {...field} /></FormControl>
                  <FormMessage />
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
