import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Clock, CheckCircle, XCircle } from "lucide-react";

interface FoundCompany {
  id: string;
  name: string;
  legal_name: string | null;
  cnpj: string | null;
}

interface AccessRequest {
  id: string;
  status: string;
  created_at: string;
  company_id: string;
}

export default function RequestAccessPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [cnpj, setCnpj] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundCompany, setFoundCompany] = useState<FoundCompany | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<(AccessRequest & { company_name?: string })[]>([]);

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const fetchMyRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("access_requests")
      .select("id, status, created_at, company_id")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const companyIds = [...new Set(data.map((r) => r.company_id))];
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", companyIds);

      const companyMap = new Map(companies?.map((c) => [c.id, c.name]) ?? []);
      setMyRequests(data.map((r) => ({ ...r, company_name: companyMap.get(r.company_id) ?? "—" })));
    } else {
      setMyRequests([]);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, [user]);

  const handleCnpjChange = (value: string) => {
    const formatted = formatCnpj(value);
    setCnpj(formatted);
    setFoundCompany(null);
  };

  const searchCompany = async () => {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return;

    setSearching(true);
    setFoundCompany(null);

    const formatted = formatCnpj(digits);
    const { data } = await supabase
      .from("companies")
      .select("id, name, legal_name, cnpj")
      .eq("cnpj", formatted)
      .maybeSingle();

    if (data) {
      setFoundCompany(data);
    } else {
      toast({ title: t("companyNotFound"), variant: "destructive" });
    }
    setSearching(false);
  };

  const handleRequest = async () => {
    if (!user || !foundCompany) return;
    setSubmitting(true);

    // Check if already requested
    const { data: existing } = await supabase
      .from("access_requests")
      .select("id")
      .eq("requester_id", user.id)
      .eq("company_id", foundCompany.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      toast({ title: t("alreadyRequested"), variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("access_requests")
      .insert({ requester_id: user.id, company_id: foundCompany.id });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("requestSent") });
      setFoundCompany(null);
      setCnpj("");
      fetchMyRequests();
    }
    setSubmitting(false);
  };

  const statusIcon = (status: string) => {
    if (status === "pending") return <Clock size={14} className="text-yellow-500" />;
    if (status === "approved") return <CheckCircle size={14} className="text-green-500" />;
    return <XCircle size={14} className="text-red-500" />;
  };

  const statusLabel = (status: string) => {
    if (status === "pending") return t("requestPending");
    if (status === "approved") return t("requestApprovedStatus");
    return t("requestRejectedStatus");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">{t("requestAccess")}</CardTitle>
            <CardDescription>{t("requestAccessDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">{t("cnpj")}</Label>
              <div className="flex gap-2">
                <Input
                  id="cnpj"
                  value={cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
                <Button
                  onClick={searchCompany}
                  disabled={cnpj.replace(/\D/g, "").length !== 14 || searching}
                  size="icon"
                  variant="outline"
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={16} />}
                </Button>
              </div>
            </div>

            {foundCompany && (
              <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-3">
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">{t("companyName")}: </span>
                  <span className="text-foreground">{foundCompany.name}</span>
                </div>
                {foundCompany.legal_name && (
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">{t("legalName")}: </span>
                    <span className="text-foreground">{foundCompany.legal_name}</span>
                  </div>
                )}
                <Button onClick={handleRequest} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t("requestAccess")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {myRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("myRequests")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{req.company_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {statusIcon(req.status)}
                      {statusLabel(req.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
