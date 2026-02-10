
-- 1. Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'accountant', 'company_owner');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Company members table (links users to companies)
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'accountant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

-- 6. Revenues table
CREATE TABLE public.revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  client TEXT,
  gross_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  fee_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  cost_center TEXT,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  installments INTEGER DEFAULT 1,
  installment_number INTEGER DEFAULT 1,
  installment_total INTEGER DEFAULT 1,
  is_fixed BOOLEAN DEFAULT false,
  is_personal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Credit cards table
CREATE TABLE public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'visa',
  last_digits TEXT,
  card_limit NUMERIC(15,2) NOT NULL DEFAULT 0,
  closing_day INTEGER NOT NULL DEFAULT 1,
  due_day INTEGER NOT NULL DEFAULT 10,
  current_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Card transactions table
CREATE TABLE public.card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  installment_number INTEGER DEFAULT 1,
  installment_total INTEGER DEFAULT 1,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_transactions ENABLE ROW LEVEL SECURITY;

-- 11. Helper function: is_company_member
CREATE OR REPLACE FUNCTION public.is_company_member(_company_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company_id AND user_id = _user_id
  )
$$;

-- 12. Helper function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 13. Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Trigger: update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- RLS POLICIES
-- =====================

-- Profiles: users can only see and update their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- User roles: users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Insert role only for self (used during signup)
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Companies: SELECT via membership, INSERT by authenticated, UPDATE/DELETE by owner
CREATE POLICY "Members can view companies" ON public.companies FOR SELECT TO authenticated
  USING (public.is_company_member(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can create companies" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update companies" ON public.companies FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete companies" ON public.companies FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Company members: SELECT via membership, INSERT/UPDATE/DELETE by company owner
CREATE POLICY "Members can view company members" ON public.company_members FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can add members" ON public.company_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Owners can update members" ON public.company_members FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Owners can delete members" ON public.company_members FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Data tables: all operations require company membership
-- Revenues
CREATE POLICY "Members can view revenues" ON public.revenues FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can insert revenues" ON public.revenues FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can update revenues" ON public.revenues FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can delete revenues" ON public.revenues FOR DELETE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

-- Expenses
CREATE POLICY "Members can view expenses" ON public.expenses FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can insert expenses" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can update expenses" ON public.expenses FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can delete expenses" ON public.expenses FOR DELETE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

-- Credit cards
CREATE POLICY "Members can view cards" ON public.credit_cards FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can insert cards" ON public.credit_cards FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can update cards" ON public.credit_cards FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can delete cards" ON public.credit_cards FOR DELETE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

-- Card transactions
CREATE POLICY "Members can view card transactions" ON public.card_transactions FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can insert card transactions" ON public.card_transactions FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can update card transactions" ON public.card_transactions FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members can delete card transactions" ON public.card_transactions FOR DELETE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

-- Indexes for performance
CREATE INDEX idx_company_members_user ON public.company_members(user_id);
CREATE INDEX idx_company_members_company ON public.company_members(company_id);
CREATE INDEX idx_revenues_company ON public.revenues(company_id);
CREATE INDEX idx_expenses_company ON public.expenses(company_id);
CREATE INDEX idx_credit_cards_company ON public.credit_cards(company_id);
CREATE INDEX idx_card_transactions_company ON public.card_transactions(company_id);
CREATE INDEX idx_card_transactions_card ON public.card_transactions(card_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
