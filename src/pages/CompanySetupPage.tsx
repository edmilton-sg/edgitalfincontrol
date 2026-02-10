import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function CompanySetupPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { refetchCompanies } = useCompany();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { data: company, error } = await supabase
      .from("companies")
      .insert({ name, cnpj: cnpj || null, owner_id: user.id })
      .select("id")
      .single();

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Auto-add owner as company member
    await supabase
      .from("company_members")
      .insert({ company_id: company.id, user_id: user.id, role: "owner" });

    await refetchCompanies();
    toast({ title: t("companyCreated") });
    navigate("/");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">{t("setupCompany")}</CardTitle>
          <CardDescription>{t("setupCompanyDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">{t("companyName")}</Label>
              <Input id="companyName" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">{t("cnpj")}</Label>
              <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" maxLength={18} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : t("createCompany")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
