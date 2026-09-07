-- ============================================================
-- MOTOR DE PRECIFICAÇÃO
-- Produtos montados (com ficha técnica) + produtos de revenda,
-- mão de obra por produto, parâmetros da empresa e modos de preço.
-- ============================================================

-- ---------- 1. PRODUTOS: tipo e mão de obra ----------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'resale'
    CHECK (product_type IN ('resale','assembled')),
  ADD COLUMN IF NOT EXISTS labor_mode TEXT NOT NULL DEFAULT 'none'
    CHECK (labor_mode IN ('none','hourly','fixed')),
  ADD COLUMN IF NOT EXISTS labor_hours NUMERIC(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labor_fixed_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_cost_label TEXT;

COMMENT ON COLUMN public.products.product_type IS 'resale = comprado pronto para revenda; assembled = montado a partir de uma ficha técnica';
COMMENT ON COLUMN public.products.labor_mode IS 'none = sem mão de obra; hourly = horas x valor/hora da empresa; fixed = valor fixo por unidade';
COMMENT ON COLUMN public.products.extra_cost IS 'Custo adicional por unidade (frete de entrega, instalação, etc.)';

-- ---------- 2. FICHA TÉCNICA (BOM) ----------
CREATE TABLE IF NOT EXISTS public.product_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  component_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(14,4) NOT NULL DEFAULT 1,
  unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_components_no_self CHECK (parent_product_id <> component_product_id)
);
CREATE INDEX IF NOT EXISTS idx_product_components_parent ON public.product_components(parent_product_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_components TO authenticated;
GRANT ALL ON public.product_components TO service_role;
ALTER TABLE public.product_components ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members manage product_components" ON public.product_components;
CREATE POLICY "Members manage product_components" ON public.product_components FOR ALL
  USING (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = product_components.company_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = product_components.company_id AND m.user_id = auth.uid()));

-- ---------- 3. PARÂMETROS DE PRECIFICAÇÃO DA EMPRESA ----------
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  hourly_rate NUMERIC(14,4) NOT NULL DEFAULT 0,
  default_tax_percent NUMERIC(8,4) NOT NULL DEFAULT 0,
  default_commission_percent NUMERIC(8,4) NOT NULL DEFAULT 0,
  default_target_margin NUMERIC(8,4) NOT NULL DEFAULT 30,
  payment_terms_days INTEGER[] NOT NULL DEFAULT ARRAY[30],
  supplier_payment_days INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.pricing_settings.payment_terms_days IS 'Prazos de recebimento do cliente em dias, ex.: {30,60,90}';
COMMENT ON COLUMN public.pricing_settings.supplier_payment_days IS 'Prazo médio de pagamento aos fornecedores, em dias (0 = à vista)';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_settings TO authenticated;
GRANT ALL ON public.pricing_settings TO service_role;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members manage pricing_settings" ON public.pricing_settings;
CREATE POLICY "Members manage pricing_settings" ON public.pricing_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = pricing_settings.company_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = pricing_settings.company_id AND m.user_id = auth.uid()));
DROP TRIGGER IF EXISTS trg_pricing_settings_updated_at ON public.pricing_settings;
CREATE TRIGGER trg_pricing_settings_updated_at BEFORE UPDATE ON public.pricing_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 4. CONFIG DE PRECIFICAÇÃO: modo, lote e locação ----------
ALTER TABLE public.pricing_configs
  -- modo de cálculo
  ADD COLUMN IF NOT EXISTS pricing_mode TEXT NOT NULL DEFAULT 'target_margin'
    CHECK (pricing_mode IN ('target_margin','fixed_price')),
  ADD COLUMN IF NOT EXISTS fixed_sale_price NUMERIC(14,4) NOT NULL DEFAULT 0,
  -- custos por unidade que não estão na ficha técnica
  ADD COLUMN IF NOT EXISTS inbound_freight NUMERIC(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outbound_freight NUMERIC(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS installation_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS packaging_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  -- deduções que incidem sobre o preço de venda
  ADD COLUMN IF NOT EXISTS tax_percent NUMERIC(8,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(8,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_percent NUMERIC(8,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_fixed NUMERIC(14,4) NOT NULL DEFAULT 0,
  -- simulação de lote
  ADD COLUMN IF NOT EXISTS batch_units INTEGER NOT NULL DEFAULT 1,
  -- locação
  ADD COLUMN IF NOT EXISTS rental_months INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS rental_markup NUMERIC(8,4) NOT NULL DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS rental_support_cost NUMERIC(14,4) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.pricing_configs.inbound_freight IS 'Frete pago na compra dos insumos, por unidade';
COMMENT ON COLUMN public.pricing_configs.outbound_freight IS 'Frete de entrega ao cliente, por unidade';
COMMENT ON COLUMN public.pricing_configs.tax_percent IS 'Alíquota efetiva sobre o preço de venda, em %';

COMMENT ON COLUMN public.pricing_configs.pricing_mode IS 'target_margin = calcula o preço a partir da margem alvo; fixed_price = preço definido, calcula a margem resultante';

-- ---------- 5. CUSTO DA FICHA TÉCNICA REFLETIDO NO PRODUTO ----------
CREATE OR REPLACE FUNCTION public.recalc_assembled_cost(p_product_id UUID)
RETURNS VOID LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_total NUMERIC(14,4);
BEGIN
  SELECT COALESCE(SUM(quantity * unit_cost), 0) INTO v_total
  FROM public.product_components WHERE parent_product_id = p_product_id;

  UPDATE public.products
     SET cost_price = v_total
   WHERE id = p_product_id AND product_type = 'assembled';
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_product_components_recalc()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_assembled_cost(OLD.parent_product_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_assembled_cost(NEW.parent_product_id);
  IF TG_OP = 'UPDATE' AND OLD.parent_product_id <> NEW.parent_product_id THEN
    PERFORM public.recalc_assembled_cost(OLD.parent_product_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_components_recalc ON public.product_components;
CREATE TRIGGER trg_product_components_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.product_components
  FOR EACH ROW EXECUTE FUNCTION public.trg_product_components_recalc();
