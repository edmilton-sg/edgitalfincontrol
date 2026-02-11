import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, ChevronRight, Tag } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { CategoriesManager } from "@/components/settings/CategoriesManager";
import { RequestAccessInline } from "@/components/settings/RequestAccessInline";

const SettingsPage = () => {
  const { t } = useLanguage();
  const { role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("settings")}</h1>

      {role === "accountant" && (
        <Card>
          <CardContent className="pt-6">
            <RequestAccessInline />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <CategoriesManager />
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
