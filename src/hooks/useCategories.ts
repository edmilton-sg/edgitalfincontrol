import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export interface Category {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
}

export function useCategories() {
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();

  const queryKey = ["categories", selectedCompanyId];

  const { data: categories = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!selectedCompanyId,
  });

  const addCategory = useMutation({
    mutationFn: async (name: string) => {
      if (!selectedCompanyId) throw new Error("No company selected");
      const { data, error } = await supabase
        .from("categories")
        .insert({ company_id: selectedCompanyId, name: name.trim() })
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("categories")
        .update({ name: name.trim() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { categories, isLoading, addCategory, updateCategory, deleteCategory };
}
