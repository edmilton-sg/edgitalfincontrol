import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Eye, Pencil, Trash2, Repeat, Link } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Expense } from "@/data/mockData";
import type { TranslationKey } from "@/i18n/translations";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExpenseTableProps {
  data: Expense[];
  onView?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

const sourceLabels: Record<string, TranslationKey> = {
  tax_payment: "taxExpense",
  card_transaction: "cardExpense",
};

const sourceTooltips: Record<string, TranslationKey> = {
  tax_payment: "managedByTaxModule",
  card_transaction: "managedByCardModule",
};

export function ExpenseTable({ data, onView, onEdit, onDelete }: ExpenseTableProps) {
  const { t, language } = useLanguage();
  const total = data.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("date")}</TableHead>
            <TableHead>{t("description")}</TableHead>
            <TableHead>{t("category")}</TableHead>
            <TableHead>{t("costCenter")}</TableHead>
            <TableHead className="text-right">{t("amount")}</TableHead>
            <TableHead>{t("paymentMethod")}</TableHead>
            <TableHead>{t("installment")}</TableHead>
            <TableHead className="text-center">{t("personal")}</TableHead>
            <TableHead className="text-center">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">—</TableCell>
            </TableRow>
          ) : (
            data.map((e) => {
              const isLinked = !!e.source_type;
              return (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap">{new Date(e.date).toLocaleDateString(language)}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      {e.description}
                      {e.is_recurring && <Repeat className="h-3.5 w-3.5 text-primary" />}
                      {isLinked && e.source_type && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="ml-1 text-[10px] gap-0.5 px-1.5 py-0">
                                <Link className="h-3 w-3" />
                                {t(sourceLabels[e.source_type] || "linkedExpense")}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t(sourceTooltips[e.source_type] || "linkedExpense")}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{t(e.category as TranslationKey)}</Badge></TableCell>
                  <TableCell>{e.cost_center}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(e.amount, language)}</TableCell>
                  <TableCell>{t(e.payment_method as TranslationKey)}</TableCell>
                  <TableCell>{e.installment_total > 1 ? `${e.installment_number}/${e.installment_total}` : "—"}</TableCell>
                  <TableCell className="text-center">
                    {e.is_personal ? <Check className="h-4 w-4 text-accent-foreground mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView?.(e)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isLinked ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{t(sourceTooltips[e.source_type!] || "linkedExpense")}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {isLinked ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{t(sourceTooltips[e.source_type!] || "linkedExpense")}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete?.(e)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
        {data.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="font-semibold">{t("totalAmount")}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(total, language)}</TableCell>
              <TableCell colSpan={4} />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
