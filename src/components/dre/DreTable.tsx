import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";

export interface DreLine {
  label: string;
  value: number;
  percent: number;
  type: "header" | "item" | "subtotal" | "total";
  indent?: boolean;
}

interface DreTableProps {
  lines: DreLine[];
}

export function DreTable({ lines }: DreTableProps) {
  const { language, t } = useLanguage();

  if (lines.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">{t("noDataForPeriod")}</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50%]">{t("description")}</TableHead>
          <TableHead className="text-right">{t("amount")}</TableHead>
          <TableHead className="text-right">{t("percentOfRevenue")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line, i) => {
          const isNegative = line.value < 0;
          const isResult = line.type === "subtotal" || line.type === "total";

          return (
            <TableRow
              key={i}
              className={cn(
                line.type === "total" && "bg-muted/50 border-t-2 border-border",
                line.type === "subtotal" && "bg-muted/30",
              )}
            >
              <TableCell
                className={cn(
                  "font-normal",
                  line.indent && "pl-8",
                  isResult && "font-semibold",
                  line.type === "header" && "font-semibold text-muted-foreground uppercase text-xs tracking-wide",
                )}
              >
                {line.label}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  isResult && "font-semibold",
                  isNegative ? "text-destructive" : isResult && line.value > 0 ? "text-chart-2" : "",
                )}
              >
                {line.type === "header" ? "" : formatCurrency(line.value, language)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums text-muted-foreground",
                  isResult && "font-semibold",
                )}
              >
                {line.type === "header" ? "" : `${line.percent.toFixed(1)}%`}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
