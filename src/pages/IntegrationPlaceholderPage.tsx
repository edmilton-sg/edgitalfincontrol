import { Card, CardContent } from "@/components/ui/card";
import { Plug } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

interface Props { titleKey: TranslationKey; description: string; }

export default function IntegrationPlaceholderPage({ titleKey, description }: Props) {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Plug size={48} className="text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Não conectado</h2>
          <p className="mt-2 max-w-md text-muted-foreground">{description}</p>
          <p className="mt-4 text-xs text-muted-foreground">Integração planejada para próximas versões.</p>
        </CardContent>
      </Card>
    </div>
  );
}