import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function RequestAccessInline() {
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
      const { data: companies } = await supabase.rpc("get_requested_companies");
      const companyMap = new Map((companies ?? []).map((c) => [c.id, c.name]));
      setMyRequests(data.map((r) => ({ ...r, company_name: companyMap.get(r.company_id) ?? "—" })));
    } else {
      setMyRequests([]);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, [user]);

  const handleCnpjChange = (value: string) => {
    setCnpj(formatCnpj(value));
    setFoundCompany(null);
  };

  const searchCompany = async () => {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return;

    setSearching(true);
    setFoundCompany(null);

    const { data } = await supabase.rpc("search_company_by_cnpj", { _cnpj: digits });
    const found = data?.[0] ?? null;

    if (found) {
      setFoundCompany(found);
    } else {
      toast({ title: t("companyNotFound"), variant: "destructive" });
    }
    setSearching(false);
  };

  const handleRequest = async () => {
    if (!user || !foundCompany) return;
    setSubmitting(true);

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
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">{t("requestAccess")}</h3>
        <p className="text-sm text-muted-foreground">{t("requestAccessDesc")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cnpj-inline">{t("cnpj")}</Label>
        <div className="flex gap-2">
          <Input
            id="cnpj-inline"
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

      {myRequests.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <h4 className="text-sm font-medium">{t("myRequests")}</h4>
          <div className="space-y-2">
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
        </div>
      )}
    </div>
  );
}
