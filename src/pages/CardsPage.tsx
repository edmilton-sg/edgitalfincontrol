import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { CardList } from "@/components/cards/CardList";
import { CardForm } from "@/components/cards/CardForm";
import { CardTransactions } from "@/components/cards/CardTransactions";
import { CardDetailDialog } from "@/components/cards/CardDetailDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreditCardData {
  id: string;
  name: string;
  brand: string;
  last_digits: string | null;
  card_limit: number;
  current_balance: number;
  closing_day: number;
  due_day: number;
  status?: string;
}

export default function CardsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardData | null>(null);
  const [viewingCard, setViewingCard] = useState<CreditCardData | null>(null);
  const [deletingCard, setDeletingCard] = useState<CreditCardData | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteStats, setDeleteStats] = useState({ transactions: 0, attachments: 0, expenses: 0 });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["credit_cards", selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const { data, error } = await supabase
        .from("credit_cards")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CreditCardData[];
    },
    enabled: !!selectedCompanyId,
  });

  const createCard = useMutation({
    mutationFn: async (card: {
      name: string; brand: string; last_digits: string;
      card_limit: number; closing_day: number; due_day: number;
    }) => {
      const { error } = await supabase.from("credit_cards").insert({
        ...card,
        company_id: selectedCompanyId!,
        current_balance: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_cards"] });
      toast({ title: t("cardCreated") });
    },
  });

  const updateCard = useMutation({
    mutationFn: async (card: {
      name: string; brand: string; last_digits: string;
      card_limit: number; closing_day: number; due_day: number;
    }) => {
      if (!editingCard) return;
      const { error } = await supabase.from("credit_cards").update(card).eq("id", editingCard.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_cards"] });
      setEditingCard(null);
      toast({ title: t("cardUpdated") });
    },
  });

  // Archive card
  const archiveCard = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase.from("credit_cards").update({ status: "archived" } as any).eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_cards"] });
      setDeleteDialogOpen(false);
      setDeletingCard(null);
      toast({ title: t("cardArchived") });
    },
  });

  // Unarchive card
  const unarchiveCard = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase.from("credit_cards").update({ status: "active" } as any).eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_cards"] });
      toast({ title: t("cardUnarchived") });
    },
  });

  // Full delete with storage cleanup
  async function handleFullDelete() {
    if (!deletingCard) return;
    setDeleteLoading(true);
    try {
      const cardId = deletingCard.id;

      // Get all transaction IDs for this card
      const { data: txs } = await supabase
        .from("card_transactions")
        .select("id")
        .eq("card_id", cardId);
      const txIds = (txs || []).map(t => t.id);

      // Fetch all attachments (card + transactions)
      const allRecordIds = [cardId, ...txIds];
      const { data: atts } = await supabase
        .from("attachments")
        .select("file_path")
        .in("record_id", allRecordIds);

      // Remove files from storage
      if (atts?.length) {
        await supabase.storage.from("attachments").remove(atts.map(a => a.file_path));
      }

      // Delete attachment records
      if (allRecordIds.length > 0) {
        await supabase.from("attachments").delete().in("record_id", allRecordIds);
      }

      // Delete linked expenses for transactions
      if (txIds.length > 0) {
        await supabase.from("expenses").delete()
          .eq("source_type", "card_transaction")
          .in("source_id", txIds);
      }

      // Delete transactions
      await supabase.from("card_transactions").delete().eq("card_id", cardId);

      // Delete the card
      const { error } = await supabase.from("credit_cards").delete().eq("id", cardId);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["credit_cards"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      if (selectedCardId === cardId) setSelectedCardId(null);
      toast({ title: t("cardDeleted") });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setDeletingCard(null);
    }
  }

  // When user clicks delete on a card, fetch stats and open dialog
  async function handleDeleteClick(card: CreditCardData) {
    setDeletingCard(card);

    // Fetch stats in parallel
    const [txRes, attRes, expRes] = await Promise.all([
      supabase.from("card_transactions").select("id", { count: "exact", head: true }).eq("card_id", card.id),
      supabase.from("attachments").select("id", { count: "exact", head: true }).eq("record_id", card.id),
      supabase.from("card_transactions").select("id").eq("card_id", card.id),
    ]);

    const txCount = txRes.count || 0;
    const txIds = (expRes.data || []).map(t => t.id);

    // Count attachments for card + transactions
    let attCount = attRes.count || 0;
    if (txIds.length > 0) {
      const { count } = await supabase.from("attachments").select("id", { count: "exact", head: true }).in("record_id", txIds);
      attCount += (count || 0);
    }

    // Count linked expenses
    let expCount = 0;
    if (txIds.length > 0) {
      const { count } = await supabase.from("expenses").select("id", { count: "exact", head: true })
        .eq("source_type", "card_transaction").in("source_id", txIds);
      expCount = count || 0;
    }

    setDeleteStats({ transactions: txCount, attachments: attCount, expenses: expCount });
    setDeleteDialogOpen(true);
  }

  function handleSave(card: { name: string; brand: string; last_digits: string; card_limit: number; closing_day: number; due_day: number }) {
    if (editingCard) {
      updateCard.mutate(card);
    } else {
      createCard.mutate(card);
    }
  }

  if (!selectedCompanyId) {
    return <div className="text-center text-muted-foreground py-12">{t("selectCompanyFirst")}</div>;
  }

  const detailsText = t("deleteCardDetails")
    .replace("{transactions}", String(deleteStats.transactions))
    .replace("{attachments}", String(deleteStats.attachments))
    .replace("{expenses}", String(deleteStats.expenses));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("cards")}</h1>
        <Button onClick={() => { setEditingCard(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t("newCard")}
        </Button>
      </div>

      <CardList
        cards={cards}
        isLoading={isLoading}
        selectedCardId={selectedCardId}
        onSelectCard={setSelectedCardId}
        onView={(card) => setViewingCard(card)}
        onEdit={(card) => { setEditingCard(card); setFormOpen(true); }}
        onDelete={handleDeleteClick}
        onArchive={(card) => archiveCard.mutate(card.id)}
        onUnarchive={(card) => unarchiveCard.mutate(card.id)}
      />

      {selectedCardId && (
        <CardTransactions cardId={selectedCardId} companyId={selectedCompanyId} />
      )}

      <CardForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
        card={editingCard}
      />

      <CardDetailDialog
        card={viewingCard}
        open={!!viewingCard}
        onOpenChange={(o) => { if (!o) setViewingCard(null); }}
        onEdit={() => { setEditingCard(viewingCard); setViewingCard(null); setFormOpen(true); }}
        companyId={selectedCompanyId}
      />

      {/* Custom archive/delete dialog for cards */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(o) => { if (!o) { setDeleteDialogOpen(false); setDeletingCard(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("archiveOrDelete")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground/80">{detailsText}</p>
                <div className="space-y-2 mt-2">
                  <div className="rounded-md border p-3">
                    <p className="font-medium text-sm">{t("archiveCard")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("archiveDescription")}</p>
                  </div>
                  <div className="rounded-md border border-destructive/30 p-3">
                    <p className="font-medium text-sm text-destructive">{t("deletePermanently")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("deleteAllDescription")}</p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={deleteLoading}>{t("cancel")}</AlertDialogCancel>
            <Button
              variant="outline"
              disabled={deleteLoading}
              onClick={() => deletingCard && archiveCard.mutate(deletingCard.id)}
            >
              {t("archiveCard")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteLoading}
              onClick={handleFullDelete}
            >
              {t("deletePermanently")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
