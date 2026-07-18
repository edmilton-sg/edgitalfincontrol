
-- ============ SUPPLIERS ============
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage suppliers" ON public.suppliers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = suppliers.company_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = suppliers.company_id AND m.user_id = auth.uid()));
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'un',
  category TEXT,
  cost_price NUMERIC(14,4) NOT NULL DEFAULT 0,
  sale_price NUMERIC(14,4) NOT NULL DEFAULT 0,
  current_stock NUMERIC(14,4) NOT NULL DEFAULT 0,
  min_stock NUMERIC(14,4) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage products" ON public.products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = products.company_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = products.company_id AND m.user_id = auth.uid()));
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STOCK MOVEMENTS ============
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in','out','adjustment')),
  quantity NUMERIC(14,4) NOT NULL,
  unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage stock_movements" ON public.stock_movements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = stock_movements.company_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = stock_movements.company_id AND m.user_id = auth.uid()));

-- trigger: keep products.current_stock in sync
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE delta NUMERIC(14,4);
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'in' THEN delta := NEW.quantity;
    ELSIF NEW.type = 'out' THEN delta := -NEW.quantity;
    ELSE delta := NEW.quantity; END IF;
    UPDATE public.products SET current_stock = current_stock + delta WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'in' THEN delta := -OLD.quantity;
    ELSIF OLD.type = 'out' THEN delta := OLD.quantity;
    ELSE delta := -OLD.quantity; END IF;
    UPDATE public.products SET current_stock = current_stock + delta WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_stock_movements_apply
  AFTER INSERT OR DELETE ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- ============ QUOTATIONS ============
CREATE TABLE public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','received','approved','rejected')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO service_role;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage quotations" ON public.quotations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = quotations.company_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = quotations.company_id AND m.user_id = auth.uid()));
CREATE TRIGGER trg_quotations_updated_at BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(14,4) NOT NULL DEFAULT 1,
  target_price NUMERIC(14,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_items TO authenticated;
GRANT ALL ON public.quotation_items TO service_role;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage quotation_items" ON public.quotation_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.quotations q JOIN public.company_members m ON m.company_id = q.company_id WHERE q.id = quotation_items.quotation_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quotations q JOIN public.company_members m ON m.company_id = q.company_id WHERE q.id = quotation_items.quotation_id AND m.user_id = auth.uid()));

CREATE TABLE public.quotation_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  delivery_days INTEGER,
  payment_terms TEXT,
  notes TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_suppliers TO authenticated;
GRANT ALL ON public.quotation_suppliers TO service_role;
ALTER TABLE public.quotation_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage quotation_suppliers" ON public.quotation_suppliers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.quotations q JOIN public.company_members m ON m.company_id = q.company_id WHERE q.id = quotation_suppliers.quotation_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quotations q JOIN public.company_members m ON m.company_id = q.company_id WHERE q.id = quotation_suppliers.quotation_id AND m.user_id = auth.uid()));

CREATE TABLE public.quotation_supplier_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_supplier_id UUID NOT NULL REFERENCES public.quotation_suppliers(id) ON DELETE CASCADE,
  quotation_item_id UUID NOT NULL REFERENCES public.quotation_items(id) ON DELETE CASCADE,
  unit_price NUMERIC(14,4) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_supplier_items TO authenticated;
GRANT ALL ON public.quotation_supplier_items TO service_role;
ALTER TABLE public.quotation_supplier_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage quotation_supplier_items" ON public.quotation_supplier_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.quotation_suppliers qs JOIN public.quotations q ON q.id = qs.quotation_id JOIN public.company_members m ON m.company_id = q.company_id WHERE qs.id = quotation_supplier_items.quotation_supplier_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quotation_suppliers qs JOIN public.quotations q ON q.id = qs.quotation_id JOIN public.company_members m ON m.company_id = q.company_id WHERE qs.id = quotation_supplier_items.quotation_supplier_id AND m.user_id = auth.uid()));

-- ============ PURCHASE INVOICES ============
CREATE TABLE public.purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  invoice_number TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  taxes_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  freight_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  other_costs NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_invoices TO authenticated;
GRANT ALL ON public.purchase_invoices TO service_role;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage purchase_invoices" ON public.purchase_invoices FOR ALL
  USING (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = purchase_invoices.company_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = purchase_invoices.company_id AND m.user_id = auth.uid()));
CREATE TRIGGER trg_purchase_invoices_updated_at BEFORE UPDATE ON public.purchase_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(14,4) NOT NULL DEFAULT 1,
  unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  total_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_invoice_items TO authenticated;
GRANT ALL ON public.purchase_invoice_items TO service_role;
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage purchase_invoice_items" ON public.purchase_invoice_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.purchase_invoices pi JOIN public.company_members m ON m.company_id = pi.company_id WHERE pi.id = purchase_invoice_items.invoice_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_invoices pi JOIN public.company_members m ON m.company_id = pi.company_id WHERE pi.id = purchase_invoice_items.invoice_id AND m.user_id = auth.uid()));

-- ============ PRICING ============
CREATE TABLE public.pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Padrão',
  target_margin_percent NUMERIC(8,4) NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_configs TO authenticated;
GRANT ALL ON public.pricing_configs TO service_role;
ALTER TABLE public.pricing_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage pricing_configs" ON public.pricing_configs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = pricing_configs.company_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = pricing_configs.company_id AND m.user_id = auth.uid()));
CREATE TRIGGER trg_pricing_configs_updated_at BEFORE UPDATE ON public.pricing_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pricing_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.pricing_configs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('cost','tax','fee','margin','freight','other')),
  label TEXT NOT NULL,
  value_type TEXT NOT NULL CHECK (value_type IN ('percent','fixed')),
  value NUMERIC(14,4) NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_components TO authenticated;
GRANT ALL ON public.pricing_components TO service_role;
ALTER TABLE public.pricing_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage pricing_components" ON public.pricing_components FOR ALL
  USING (EXISTS (SELECT 1 FROM public.pricing_configs pc JOIN public.company_members m ON m.company_id = pc.company_id WHERE pc.id = pricing_components.config_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pricing_configs pc JOIN public.company_members m ON m.company_id = pc.company_id WHERE pc.id = pricing_components.config_id AND m.user_id = auth.uid()));

-- ============ ISSUED INVOICES (skeleton) ============
CREATE TABLE public.issued_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('nfe','nfse')),
  number TEXT,
  series TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','cancelled','error')),
  recipient_document TEXT,
  recipient_name TEXT,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xml_url TEXT,
  pdf_url TEXT,
  provider_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issued_invoices TO authenticated;
GRANT ALL ON public.issued_invoices TO service_role;
ALTER TABLE public.issued_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage issued_invoices" ON public.issued_invoices FOR ALL
  USING (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = issued_invoices.company_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = issued_invoices.company_id AND m.user_id = auth.uid()));
CREATE TRIGGER trg_issued_invoices_updated_at BEFORE UPDATE ON public.issued_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
