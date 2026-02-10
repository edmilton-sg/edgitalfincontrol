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
import { Loader2 } from "lucide-react";

interface CnpjData {
  legalName: string;
  tradeName: string;
  foundedDate: string;
  mainActivity: string;
  mainActivityCode: number | null;
  sideActivities: unknown[];
  legalNature: string;
  companySize: string;
  simplesOptant: boolean;
  simeiOptant: boolean;
  equity: number;
  registrationStatus: string;
  statusDate: string;
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressDetails: string;
  addressZip: string;
  city: string;
  state: string;
  phones: unknown[];
  emails: unknown[];
  members: unknown[];
  isHead: boolean;
}

export default function CompanySetupPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { refetchCompanies } = useCompany();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [cnpjData, setCnpjData] = useState<CnpjData | null>(null);

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const fetchCnpjData = async (digits: string) => {
    setFetching(true);
    setCnpjData(null);
    try {
      const res = await fetch(`https://open.cnpja.com/office/${digits}`);
      if (!res.ok) throw new Error("not found");
      const data = await res.json();

      const mainActivity = data.mainActivity || {};
      const address = data.address || {};

      const parsed: CnpjData = {
        legalName: data.company?.name || "",
        tradeName: data.alias || "",
        foundedDate: data.founded || "",
        mainActivity: mainActivity.text || "",
        mainActivityCode: mainActivity.id ?? null,
        sideActivities: data.sideActivities || [],
        legalNature: data.company?.nature?.text || "",
        companySize: data.company?.size?.text || "",
        simplesOptant: data.company?.simples?.optant ?? false,
        simeiOptant: data.company?.simei?.optant ?? false,
        equity: data.company?.equity ?? 0,
        registrationStatus: data.status?.text || "",
        statusDate: data.statusDate || "",
        addressStreet: address.street || "",
        addressNumber: address.number || "",
        addressDistrict: address.district || "",
        addressDetails: address.details || "",
        addressZip: address.zip || "",
        city: address.city || "",
        state: address.state || "",
        phones: data.phones || [],
        emails: data.emails || [],
        members: data.company?.members || [],
        isHead: data.head ?? false,
      };

      setCnpjData(parsed);
    } catch {
      toast({ title: t("cnpjNotFound"), variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const handleCnpjChange = (value: string) => {
    const formatted = formatCnpj(value);
    setCnpj(formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 14) {
      fetchCnpjData(digits);
    } else {
      setCnpjData(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const insertData: Record<string, unknown> = {
      name,
      cnpj: cnpj || null,
      owner_id: user.id,
    };

    if (cnpjData) {
      insertData.legal_name = cnpjData.legalName;
      insertData.trade_name = cnpjData.tradeName;
      insertData.founded_date = cnpjData.foundedDate;
      insertData.main_activity = cnpjData.mainActivity;
      insertData.main_activity_code = cnpjData.mainActivityCode;
      insertData.side_activities = cnpjData.sideActivities;
      insertData.legal_nature = cnpjData.legalNature;
      insertData.company_size = cnpjData.companySize;
      insertData.simples_optant = cnpjData.simplesOptant;
      insertData.simei_optant = cnpjData.simeiOptant;
      insertData.equity = cnpjData.equity;
      insertData.registration_status = cnpjData.registrationStatus;
      insertData.status_date = cnpjData.statusDate;
      insertData.address_street = cnpjData.addressStreet;
      insertData.address_number = cnpjData.addressNumber;
      insertData.address_district = cnpjData.addressDistrict;
      insertData.address_details = cnpjData.addressDetails;
      insertData.address_zip = cnpjData.addressZip;
      insertData.city = cnpjData.city;
      insertData.state = cnpjData.state;
      insertData.phones = cnpjData.phones;
      insertData.emails = cnpjData.emails;
      insertData.members = cnpjData.members;
      insertData.is_head = cnpjData.isHead;
    }

    const { data: company, error } = await supabase
      .from("companies")
      .insert(insertData as any)
      .select("id")
      .single();

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

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
              <div className="relative">
                <Input
                  id="cnpj"
                  value={cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
                {fetching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {cnpjData && (
              <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">{t("legalName")}: </span>
                  <span className="text-foreground">{cnpjData.legalName}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">{t("foundedDate")}: </span>
                  <span className="text-foreground">{formatDate(cnpjData.foundedDate)}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">{t("cityState")}: </span>
                  <span className="text-foreground">{cnpjData.city} / {cnpjData.state}</span>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || fetching}>
              {loading ? "..." : t("createCompany")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
