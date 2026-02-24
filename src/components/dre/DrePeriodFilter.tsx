import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

interface DrePeriodFilterProps {
  month: number; // 0-11
  year: number;
  onChange: (month: number, year: number) => void;
}

const monthKeys: TranslationKey[] = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

export function DrePeriodFilter({ month, year, onChange }: DrePeriodFilterProps) {
  const { t } = useLanguage();

  const goPrev = () => {
    if (month === 0) onChange(11, year - 1);
    else onChange(month - 1, year);
  };

  const goNext = () => {
    if (month === 11) onChange(0, year + 1);
    else onChange(month + 1, year);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={goPrev} title={t("previousMonth")}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[120px] text-center font-medium text-sm">
        {t(monthKeys[month])} / {year}
      </span>
      <Button variant="outline" size="icon" onClick={goNext} title={t("nextMonth")}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
