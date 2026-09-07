import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";

/**
 * Acesso às tabelas e colunas criadas pela migração `20260907120000_pricing_engine`.
 *
 * `types.ts` é gerado pelo Supabase CLI e traz no topo "Do not edit it directly",
 * então ele ainda não conhece `product_components`, `pricing_settings` nem as
 * colunas novas de `products` e `pricing_configs`. Em vez de editar o arquivo
 * gerado à mão, este módulo concentra num único ponto o acesso sem tipagem de
 * schema — com os tipos das linhas escritos aqui, explicitamente.
 *
 * Depois de rodar, contra o banco já migrado:
 *
 *   supabase gen types typescript --linked > src/integrations/supabase/types.ts
 *
 * este arquivo pode ser apagado e as chamadas voltam a usar `supabase` direto.
 */
export const db = supabase as unknown as SupabaseClient;

export type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  cost_price: number;
  sale_price: number;
  product_type: "resale" | "assembled";
  labor_mode: "none" | "hourly" | "fixed";
  labor_hours: number;
  labor_fixed_cost: number;
};

export type ProductComponentRow = {
  id: string;
  company_id: string;
  parent_product_id: string;
  component_product_id: string | null;
  description: string;
  quantity: number;
  unit_cost: number;
  order_index: number;
};

export type PricingSettingsRow = {
  company_id: string;
  hourly_rate: number;
  default_tax_percent: number;
  default_commission_percent: number;
  default_target_margin: number;
  payment_terms_days: number[];
  supplier_payment_days: number;
};
