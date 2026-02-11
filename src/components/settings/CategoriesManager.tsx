import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Tag } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

export function CategoriesManager() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { categories, isLoading, addCategory, updateCategory, deleteCategory } = useCategories();

  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd() {
    if (!newName.trim()) return;
    try {
      await addCategory.mutateAsync(newName);
      toast({ title: t("categorySaved") });
      setNewName("");
    } catch (err: any) {
      if (err.message?.includes("duplicate") || err.code === "23505") {
        toast({ title: t("categoryExists"), variant: "destructive" });
      } else {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
      }
    }
  }

  async function handleUpdate() {
    if (!editingId || !editingName.trim()) return;
    try {
      await updateCategory.mutateAsync({ id: editingId, name: editingName });
      toast({ title: t("categorySaved") });
      setEditingId(null);
    } catch (err: any) {
      if (err.message?.includes("duplicate") || err.code === "23505") {
        toast({ title: t("categoryExists"), variant: "destructive" });
      } else {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
      }
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteCategory.mutateAsync(deleteId);
      toast({ title: t("categoryDeleted") });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tag size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">{t("manageCategories")}</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchExpense")}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("categoryName")}
            className="sm:w-[200px]"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd} disabled={addCategory.isPending || !newName.trim()}>
            <Plus className="h-4 w-4 mr-1" />
            {t("newCategory")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{t("noTransactionsFound")}</p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("categoryName")}</TableHead>
                <TableHead className="w-24 text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    {editingId === cat.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onBlur={handleUpdate}
                        className="h-8"
                        autoFocus
                      />
                    ) : (
                      cat.name
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(cat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
