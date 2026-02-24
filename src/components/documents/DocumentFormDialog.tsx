import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { CompanyDocument } from "@/data/mockData";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  hasExpiry: z.boolean(),
  expires_at: z.string().optional(),
  alert_days_before: z.coerce.number().min(1).default(30),
});

type FormValues = z.infer<typeof schema>;

interface DocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { title: string; description?: string; expires_at?: string | null; alert_days_before: number; file?: File }, existingId?: string) => void;
  document?: CompanyDocument | null;
}

export function DocumentFormDialog({ open, onOpenChange, onSave, document }: DocumentFormDialogProps) {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", hasExpiry: false, expires_at: "", alert_days_before: 30 },
  });

  useEffect(() => {
    if (open) {
      if (document) {
        form.reset({
          title: document.title,
          description: document.description || "",
          hasExpiry: !!document.expires_at,
          expires_at: document.expires_at || "",
          alert_days_before: document.alert_days_before,
        });
      } else {
        form.reset({ title: "", description: "", hasExpiry: false, expires_at: "", alert_days_before: 30 });
      }
      setFile(null);
    }
  }, [open, document]);

  const hasExpiry = form.watch("hasExpiry");

  const onSubmit = (values: FormValues) => {
    if (!document && !file) return; // new doc requires file
    onSave(
      {
        title: values.title,
        description: values.description || undefined,
        expires_at: values.hasExpiry && values.expires_at ? values.expires_at : null,
        alert_days_before: values.alert_days_before,
        file: file || undefined,
      },
      document?.id,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{document ? t("editDocument") : t("newDocument")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("documentTitle")}</FormLabel>
                <FormControl><Input {...field} placeholder="Ex: Cartão CNPJ" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("documentDescription")}</FormLabel>
                <FormControl><Textarea {...field} rows={2} /></FormControl>
              </FormItem>
            )} />

            {/* File upload */}
            <div className="space-y-2">
              <Label>{document ? t("replaceFile") : t("uploadFile")}</Label>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                {file ? file.name : document ? document.file_name : t("uploadFile")}
              </Button>
              {!document && !file && <p className="text-xs text-destructive">* Arquivo obrigatório</p>}
            </div>

            {/* Expiry toggle */}
            <div className="flex items-center gap-3">
              <Switch checked={hasExpiry} onCheckedChange={(v) => form.setValue("hasExpiry", v)} />
              <Label>{t("documentExpiry")}</Label>
            </div>

            {hasExpiry && (
              <>
                <FormField control={form.control} name="expires_at" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("expiresAt")}</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="alert_days_before" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("alertDaysBefore")}</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
              <Button type="submit">{t("save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
