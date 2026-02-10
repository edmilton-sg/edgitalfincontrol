
-- Fix ALL restrictive policies on companies to be permissive
DROP POLICY IF EXISTS "Members can view companies" ON public.companies;
CREATE POLICY "Members can view companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (is_company_member(id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owners can update companies" ON public.companies;
CREATE POLICY "Owners can update companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owners can delete companies" ON public.companies;
CREATE POLICY "Owners can delete companies"
  ON public.companies FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Fix ALL restrictive policies on company_members to be permissive
DROP POLICY IF EXISTS "Members can view company members" ON public.company_members;
CREATE POLICY "Members can view company members"
  ON public.company_members FOR SELECT
  TO authenticated
  USING (is_company_member(company_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owners can add members" ON public.company_members;
CREATE POLICY "Owners can add members"
  ON public.company_members FOR INSERT
  TO authenticated
  WITH CHECK (
    (EXISTS (SELECT 1 FROM companies WHERE companies.id = company_members.company_id AND companies.owner_id = auth.uid()))
    OR (user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Owners can update members" ON public.company_members;
CREATE POLICY "Owners can update members"
  ON public.company_members FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM companies WHERE companies.id = company_members.company_id AND companies.owner_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Owners can delete members" ON public.company_members;
CREATE POLICY "Owners can delete members"
  ON public.company_members FOR DELETE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM companies WHERE companies.id = company_members.company_id AND companies.owner_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Fix ALL restrictive policies on other tables too
DROP POLICY IF EXISTS "Members can view expenses" ON public.expenses;
CREATE POLICY "Members can view expenses" ON public.expenses FOR SELECT TO authenticated USING (is_company_member(company_id, auth.uid()));
DROP POLICY IF EXISTS "Members can insert expenses" ON public.expenses;
CREATE POLICY "Members can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id, auth.uid()));
DROP POLICY IF EXISTS "Members can update expenses" ON public.expenses;
CREATE POLICY "Members can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (is_company_member(company_id, auth.uid()));
DROP POLICY IF EXISTS "Members can delete expenses" ON public.expenses;
CREATE POLICY "Members can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (is_company_member(company_id, auth.uid()));

DROP POLICY IF EXISTS "Members can view revenues" ON public.revenues;
CREATE POLICY "Members can view revenues" ON public.revenues FOR SELECT TO authenticated USING (is_company_member(company_id, auth.uid()));
DROP POLICY IF EXISTS "Members can insert revenues" ON public.revenues;
CREATE POLICY "Members can insert revenues" ON public.revenues FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id, auth.uid()));
DROP POLICY IF EXISTS "Members can update revenues" ON public.revenues;
CREATE POLICY "Members can update revenues" ON public.revenues FOR UPDATE TO authenticated USING (is_company_member(company_id, auth.uid()));
DROP POLICY IF EXISTS "Members can delete revenues" ON public.revenues;
CREATE POLICY "Members can delete revenues" ON public.revenues FOR DELETE TO authenticated USING (is_company_member(company_id, auth.uid()));

DROP POLICY IF EXISTS "Members can view cards" ON public.credit_cards;
CREATE POLICY "Members can view cards" ON public.credit_cards FOR SELECT TO authenticated USING (is_company_member(company_id, auth.uid()));
DROP POLICY IF EXISTS "Members can insert cards" ON public.credit_cards;
CREATE POLICY "Members can insert cards" ON public.credit_cards FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id, auth.uid()));
DROP POLICY IF EXISTS "Members can update cards" ON public.credit_cards;
CREATE POLICY "Members can update cards" ON public.credit_cards FOR UPDATE TO authenticated USING (is_company_member(company_id, auth.uid()));
DROP POLICY IF EXISTS "Members can delete cards" ON public.credit_cards;
CREATE POLICY "Members can delete cards" ON public.credit_cards FOR DELETE TO authenticated USING (is_company_member(company_id, auth.uid()));

DROP POLICY IF EXISTS "Members can view card transactions" ON public.card_transactions;
CREATE POLICY "Members can view card transactions" ON public.card_transactions FOR SELECT TO authenticated USING (is_company_member(company_id, auth.uid()));
DROP POLICY IF EXISTS "Members can insert card transactions" ON public.card_transactions;
CREATE POLICY "Members can insert card transactions" ON public.card_transactions FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id, auth.uid()));
DROP POLICY IF EXISTS "Members can update card transactions" ON public.card_transactions;
CREATE POLICY "Members can update card transactions" ON public.card_transactions FOR UPDATE TO authenticated USING (is_company_member(company_id, auth.uid()));
DROP POLICY IF EXISTS "Members can delete card transactions" ON public.card_transactions;
CREATE POLICY "Members can delete card transactions" ON public.card_transactions FOR DELETE TO authenticated USING (is_company_member(company_id, auth.uid()));

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
