import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

interface PlaceholderPageProps {
  titleKey: TranslationKey;
}

const PlaceholderPage = ({ titleKey }: PlaceholderPageProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
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

export default PlaceholderPage;
