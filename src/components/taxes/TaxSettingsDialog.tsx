import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaxSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: { tax_mode: string; tax_percentage: number; fixed_amount: number; due_day?: number } | null;
  onSaved: () => void;
}

export function TaxSettingsDialog({ open, onOpenChange, currentSettings, onSaved }: TaxSettingsDialogProps) {
  const { t } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const [mode, setMode] = useState<string>("percentage");
  const [percentage, setPercentage] = useState("6");
  const [fixedAmount, setFixedAmount] = useState("0");
  const [dueDay, setDueDay] = useState("20");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setMode(currentSettings.tax_mode);
      setPercentage(String(currentSettings.tax_percentage));
      setFixedAmount(String(currentSettings.fixed_amount));
      setDueDay(String(currentSettings.due_day ?? 20));
    } else {
      setMode("percentage");
      setPercentage("6");
      setFixedAmount("0");
      setDueDay("20");
    }
  }, [currentSettings, open]);

  const handleSave = async () => {
    if (!selectedCompanyId) return;
    setSaving(true);

    const dueDayNum = Math.min(28, Math.max(1, parseInt(dueDay) || 20));

    const payload = {
      company_id: selectedCompanyId,
      tax_mode: mode,
      tax_percentage: parseFloat(percentage) || 6,
      fixed_amount: parseFloat(fixedAmount) || 0,
      due_day: dueDayNum,
    };

    const { error } = currentSettings
      ? await supabase.from("tax_settings" as any).update(payload).eq("company_id", selectedCompanyId)
      : await supabase.from("tax_settings" as any).insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("settingsSaved"));
      onSaved();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("taxSettings")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <RadioGroup value={mode} onValueChange={setMode} className="space-y-3">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="percentage" id="mode-pct" />
              <Label htmlFor="mode-pct">{t("percentageMode")}</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="fixed" id="mode-fixed" />
              <Label htmlFor="mode-fixed">{t("fixedMode")}</Label>
            </div>
          </RadioGroup>

          {mode === "percentage" ? (
            <div className="space-y-2">
              <Label>{t("taxPercentage")}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="6.00"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("fixedAmount")}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                placeholder="75.60"
              />
              <p className="text-xs text-muted-foreground">{t("meiFixedValue")}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("dueDayLabel")}</Label>
            <Input
              type="number"
              min="1"
              max="28"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="20"
            />
            <p className="text-xs text-muted-foreground">{t("dueDayHint")}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>{t("save")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
