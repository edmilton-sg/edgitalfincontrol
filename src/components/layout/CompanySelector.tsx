import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function CompanySelector() {
  const { t } = useLanguage();
  const { role } = useAuth();
  const { companies, selectedCompanyId, setSelectedCompanyId } = useCompany();

  // Show for accountants always, and for owners with multiple companies
  const showSelector = role === "accountant" || companies.length > 1;
  if (!showSelector || companies.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 size={16} className="text-muted-foreground shrink-0" />
      <Select value={selectedCompanyId ?? ""} onValueChange={setSelectedCompanyId}>
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue placeholder={t("selectCompany")} />
        </SelectTrigger>
        <SelectContent>
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id} className="text-xs">
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
