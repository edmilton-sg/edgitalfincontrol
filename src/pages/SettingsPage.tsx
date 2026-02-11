import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, UserPlus, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const SettingsPage = () => {
  const { t } = useLanguage();
  const { role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("settings")}</h1>

      {role === "accountant" && (
        <Card
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => navigate("/request-access")}
        >
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <UserPlus size={20} className="text-primary" />
              <div>
                <CardTitle className="text-base">{t("manageCompanyAccess")}</CardTitle>
                <CardDescription>{t("manageCompanyAccessDesc")}</CardDescription>
              </div>
            </div>
            <ChevronRight size={20} className="text-muted-foreground" />
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Construction size={48} className="text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">{t("comingSoon")}</h2>
          <p className="mt-2 max-w-md text-muted-foreground">{t("comingSoonDesc")}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
