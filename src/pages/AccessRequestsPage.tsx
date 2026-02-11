import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface PendingRequest {
  id: string;
  requester_id: string;
  company_id: string;
  created_at: string;
  requester_name: string;
  company_name: string;
}

export default function AccessRequestsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) return;

    // Get companies owned by current user
    const { data: myCompanies } = await supabase
      .from("companies")
      .select("id, name")
      .eq("owner_id", user.id);

    if (!myCompanies || myCompanies.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const companyIds = myCompanies.map((c) => c.id);
    const companyMap = new Map(myCompanies.map((c) => [c.id, c.name]));

    const { data: pendingReqs } = await supabase
      .from("access_requests")
      .select("id, requester_id, company_id, created_at")
      .in("company_id", companyIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!pendingReqs || pendingReqs.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    // Get requester profiles
    const requesterIds = [...new Set(pendingReqs.map((r) => r.requester_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", requesterIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name ?? t("accountantName")]) ?? []);

    setRequests(
      pendingReqs.map((r) => ({
        ...r,
        requester_name: profileMap.get(r.requester_id) ?? t("accountantName"),
        company_name: companyMap.get(r.company_id) ?? "—",
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleResolve = async (requestId: string, status: "approved" | "rejected", req: PendingRequest) => {
    if (!user) return;
    setProcessingId(requestId);

    const { error } = await supabase
      .from("access_requests")
      .update({ status, resolved_at: new Date().toISOString(), resolved_by: user.id })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setProcessingId(null);
      return;
    }

    if (status === "approved") {
      // Add as company member
      await supabase
        .from("company_members")
        .insert({ company_id: req.company_id, user_id: req.requester_id, role: "accountant" });
      toast({ title: t("requestApproved") });
    } else {
      toast({ title: t("requestRejected") });
    }

    setProcessingId(null);
    fetchRequests();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("accessRequests")}</h1>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("pendingRequests")}: 0
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{req.requester_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {req.company_name} • {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => handleResolve(req.id, "approved", req)}
                    disabled={processingId === req.id}
                  >
                    {processingId === req.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={14} className="mr-1" />
                        {t("approve")}
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleResolve(req.id, "rejected", req)}
                    disabled={processingId === req.id}
                  >
                    <XCircle size={14} className="mr-1" />
                    {t("reject")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
