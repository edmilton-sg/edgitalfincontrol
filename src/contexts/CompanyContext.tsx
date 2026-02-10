import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  owner_id: string;
}

interface CompanyContextType {
  companies: Company[];
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  selectedCompany: Company | null;
  loading: boolean;
  refetchCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  selectedCompanyId: null,
  setSelectedCompanyId: () => {},
  selectedCompany: null,
  loading: true,
  refetchCompanies: async () => {},
});

export const useCompany = () => useContext(CompanyContext);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    if (!user) {
      setCompanies([]);
      setSelectedCompanyId(null);
      setLoading(false);
      return;
    }

    // company_members RLS will filter to user's companies
    const { data: memberships } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id);

    if (memberships && memberships.length > 0) {
      const companyIds = memberships.map((m) => m.company_id);
      const { data: companiesData } = await supabase
        .from("companies")
        .select("id, name, cnpj, owner_id")
        .in("id", companyIds);

      setCompanies(companiesData ?? []);
      if (!selectedCompanyId && companiesData && companiesData.length > 0) {
        setSelectedCompanyId(companiesData[0].id);
      }
    } else {
      setCompanies([]);
      setSelectedCompanyId(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, [user, role]);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? null;

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompanyId,
        setSelectedCompanyId,
        selectedCompany,
        loading,
        refetchCompanies: fetchCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}
