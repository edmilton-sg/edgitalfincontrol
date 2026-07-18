export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          company_id: string
          created_at: string
          id: string
          requester_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          requester_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          company_id: string
          content_type: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          record_id: string
          record_type: string
        }
        Insert: {
          company_id: string
          content_type: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          record_id: string
          record_type: string
        }
        Update: {
          company_id?: string
          content_type?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          record_id?: string
          record_type?: string
        }
        Relationships: []
      }
      card_transactions: {
        Row: {
          amount: number
          card_id: string
          category: string | null
          company_id: string
          created_at: string
          date: string
          description: string
          id: string
          installment_number: number | null
          installment_total: number | null
        }
        Insert: {
          amount?: number
          card_id: string
          category?: string | null
          company_id: string
          created_at?: string
          date: string
          description: string
          id?: string
          installment_number?: number | null
          installment_total?: number | null
        }
        Update: {
          amount?: number
          card_id?: string
          category?: string | null
          company_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          installment_number?: number | null
          installment_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "card_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address_details: string | null
          address_district: string | null
          address_number: string | null
          address_street: string | null
          address_zip: string | null
          city: string | null
          cnpj: string | null
          company_size: string | null
          created_at: string
          emails: Json | null
          equity: number | null
          founded_date: string | null
          id: string
          is_head: boolean | null
          legal_name: string | null
          legal_nature: string | null
          main_activity: string | null
          main_activity_code: number | null
          members: Json | null
          name: string
          owner_id: string
          phones: Json | null
          registration_status: string | null
          side_activities: Json | null
          simei_optant: boolean | null
          simples_optant: boolean | null
          state: string | null
          status_date: string | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          address_details?: string | null
          address_district?: string | null
          address_number?: string | null
          address_street?: string | null
          address_zip?: string | null
          city?: string | null
          cnpj?: string | null
          company_size?: string | null
          created_at?: string
          emails?: Json | null
          equity?: number | null
          founded_date?: string | null
          id?: string
          is_head?: boolean | null
          legal_name?: string | null
          legal_nature?: string | null
          main_activity?: string | null
          main_activity_code?: number | null
          members?: Json | null
          name: string
          owner_id: string
          phones?: Json | null
          registration_status?: string | null
          side_activities?: Json | null
          simei_optant?: boolean | null
          simples_optant?: boolean | null
          state?: string | null
          status_date?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          address_details?: string | null
          address_district?: string | null
          address_number?: string | null
          address_street?: string | null
          address_zip?: string | null
          city?: string | null
          cnpj?: string | null
          company_size?: string | null
          created_at?: string
          emails?: Json | null
          equity?: number | null
          founded_date?: string | null
          id?: string
          is_head?: boolean | null
          legal_name?: string | null
          legal_nature?: string | null
          main_activity?: string | null
          main_activity_code?: number | null
          members?: Json | null
          name?: string
          owner_id?: string
          phones?: Json | null
          registration_status?: string | null
          side_activities?: Json | null
          simei_optant?: boolean | null
          simples_optant?: boolean | null
          state?: string | null
          status_date?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_documents: {
        Row: {
          alert_days_before: number
          company_id: string
          content_type: string
          created_at: string
          description: string | null
          expires_at: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          alert_days_before?: number
          company_id: string
          content_type: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          alert_days_before?: number
          company_id?: string
          content_type?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          brand: string
          card_limit: number
          closing_day: number
          company_id: string
          created_at: string
          current_balance: number
          due_day: number
          id: string
          last_digits: string | null
          name: string
          status: string
        }
        Insert: {
          brand?: string
          card_limit?: number
          closing_day?: number
          company_id: string
          created_at?: string
          current_balance?: number
          due_day?: number
          id?: string
          last_digits?: string | null
          name: string
          status?: string
        }
        Update: {
          brand?: string
          card_limit?: number
          closing_day?: number
          company_id?: string
          created_at?: string
          current_balance?: number
          due_day?: number
          id?: string
          last_digits?: string | null
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          cnpj: string | null
          company_id: string
          cpf: string | null
          created_at: string
          department: string | null
          employment_type: string
          hire_date: string
          id: string
          name: string
          notes: string | null
          position: string | null
          salary: number
          status: string
          termination_date: string | null
        }
        Insert: {
          cnpj?: string | null
          company_id: string
          cpf?: string | null
          created_at?: string
          department?: string | null
          employment_type?: string
          hire_date: string
          id?: string
          name: string
          notes?: string | null
          position?: string | null
          salary?: number
          status?: string
          termination_date?: string | null
        }
        Update: {
          cnpj?: string | null
          company_id?: string
          cpf?: string | null
          created_at?: string
          department?: string | null
          employment_type?: string
          hire_date?: string
          id?: string
          name?: string
          notes?: string | null
          position?: string | null
          salary?: number
          status?: string
          termination_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          company_id: string
          cost_center: string | null
          created_at: string
          date: string
          description: string
          id: string
          installment_number: number | null
          installment_total: number | null
          installments: number | null
          is_fixed: boolean | null
          is_personal: boolean | null
          is_recurring: boolean
          payment_method: string | null
          recurrence_group_id: string | null
          recurrence_interval: string | null
          source_id: string | null
          source_type: string | null
        }
        Insert: {
          amount?: number
          category?: string | null
          company_id: string
          cost_center?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          installment_number?: number | null
          installment_total?: number | null
          installments?: number | null
          is_fixed?: boolean | null
          is_personal?: boolean | null
          is_recurring?: boolean
          payment_method?: string | null
          recurrence_group_id?: string | null
          recurrence_interval?: string | null
          source_id?: string | null
          source_type?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string
          cost_center?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          installment_number?: number | null
          installment_total?: number | null
          installments?: number | null
          is_fixed?: boolean | null
          is_personal?: boolean | null
          is_recurring?: boolean
          payment_method?: string | null
          recurrence_group_id?: string | null
          recurrence_interval?: string | null
          source_id?: string | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      issued_invoices: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          id: string
          issue_date: string
          notes: string | null
          number: string | null
          pdf_url: string | null
          provider_id: string | null
          recipient_document: string | null
          recipient_name: string | null
          series: string | null
          status: string
          type: string
          updated_at: string
          xml_url: string | null
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string | null
          pdf_url?: string | null
          provider_id?: string | null
          recipient_document?: string | null
          recipient_name?: string | null
          series?: string | null
          status?: string
          type: string
          updated_at?: string
          xml_url?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string | null
          pdf_url?: string | null
          provider_id?: string | null
          recipient_document?: string | null
          recipient_name?: string | null
          series?: string | null
          status?: string
          type?: string
          updated_at?: string
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issued_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string
          fgts_amount: number
          gross_salary: number
          id: string
          inss_amount: number
          irrf_amount: number
          net_salary: number
          notes: string | null
          other_additions: number
          other_deductions: number
          payment_date: string | null
          reference_month: string
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id: string
          fgts_amount?: number
          gross_salary: number
          id?: string
          inss_amount?: number
          irrf_amount?: number
          net_salary: number
          notes?: string | null
          other_additions?: number
          other_deductions?: number
          payment_date?: string | null
          reference_month: string
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string
          fgts_amount?: number
          gross_salary?: number
          id?: string
          inss_amount?: number
          irrf_amount?: number
          net_salary?: number
          notes?: string | null
          other_additions?: number
          other_deductions?: number
          payment_date?: string | null
          reference_month?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_components: {
        Row: {
          config_id: string
          id: string
          kind: string
          label: string
          order_index: number
          value: number
          value_type: string
        }
        Insert: {
          config_id: string
          id?: string
          kind: string
          label: string
          order_index?: number
          value?: number
          value_type: string
        }
        Update: {
          config_id?: string
          id?: string
          kind?: string
          label?: string
          order_index?: number
          value?: number
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_components_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "pricing_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_configs: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          product_id: string
          target_margin_percent: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          product_id: string
          target_margin_percent?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          product_id?: string
          target_margin_percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_configs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_labore: {
        Row: {
          amount: number
          company_id: string
          cpf: string | null
          created_at: string
          id: string
          inss_amount: number
          irrf_amount: number
          member_name: string
          net_amount: number
          notes: string | null
          payment_date: string | null
          reference_month: string
          status: string
        }
        Insert: {
          amount: number
          company_id: string
          cpf?: string | null
          created_at?: string
          id?: string
          inss_amount?: number
          irrf_amount?: number
          member_name: string
          net_amount: number
          notes?: string | null
          payment_date?: string | null
          reference_month: string
          status?: string
        }
        Update: {
          amount?: number
          company_id?: string
          cpf?: string | null
          created_at?: string
          id?: string
          inss_amount?: number
          irrf_amount?: number
          member_name?: string
          net_amount?: number
          notes?: string | null
          payment_date?: string | null
          reference_month?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_labore_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          company_id: string
          cost_price: number
          created_at: string
          current_stock: number
          description: string | null
          id: string
          is_active: boolean
          min_stock: number
          name: string
          sale_price: number
          sku: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          cost_price?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number
          name: string
          sale_price?: number
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          cost_price?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number
          name?: string
          sale_price?: number
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          product_id: string | null
          quantity: number
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          product_id?: string | null
          quantity?: number
          total_cost?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          product_id?: string | null
          quantity?: number
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          company_id: string
          created_at: string
          due_date: string | null
          freight_amount: number
          id: string
          invoice_number: string | null
          issue_date: string
          notes: string | null
          other_costs: number
          payment_date: string | null
          quotation_id: string | null
          status: string
          supplier_id: string | null
          taxes_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          due_date?: string | null
          freight_amount?: number
          id?: string
          invoice_number?: string | null
          issue_date?: string
          notes?: string | null
          other_costs?: number
          payment_date?: string | null
          quotation_id?: string | null
          status?: string
          supplier_id?: string | null
          taxes_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          due_date?: string | null
          freight_amount?: number
          id?: string
          invoice_number?: string | null
          issue_date?: string
          notes?: string | null
          other_costs?: number
          payment_date?: string | null
          quotation_id?: string | null
          status?: string
          supplier_id?: string | null
          taxes_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          created_at: string
          description: string
          id: string
          product_id: string | null
          quantity: number
          quotation_id: string
          target_price: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          product_id?: string | null
          quantity?: number
          quotation_id: string
          target_price?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          product_id?: string | null
          quantity?: number
          quotation_id?: string
          target_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_supplier_items: {
        Row: {
          id: string
          quotation_item_id: string
          quotation_supplier_id: string
          total: number
          unit_price: number
        }
        Insert: {
          id?: string
          quotation_item_id: string
          quotation_supplier_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          id?: string
          quotation_item_id?: string
          quotation_supplier_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_supplier_items_quotation_item_id_fkey"
            columns: ["quotation_item_id"]
            isOneToOne: false
            referencedRelation: "quotation_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_supplier_items_quotation_supplier_id_fkey"
            columns: ["quotation_supplier_id"]
            isOneToOne: false
            referencedRelation: "quotation_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_suppliers: {
        Row: {
          created_at: string
          delivery_days: number | null
          id: string
          is_selected: boolean
          notes: string | null
          payment_terms: string | null
          quotation_id: string
          supplier_id: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          delivery_days?: number | null
          id?: string
          is_selected?: boolean
          notes?: string | null
          payment_terms?: string | null
          quotation_id: string
          supplier_id: string
          total_amount?: number
        }
        Update: {
          created_at?: string
          delivery_days?: number | null
          id?: string
          is_selected?: boolean
          notes?: string | null
          payment_terms?: string | null
          quotation_id?: string
          supplier_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_suppliers_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          code: string | null
          company_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          code?: string | null
          company_id: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          code?: string | null
          company_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      revenues: {
        Row: {
          client: string | null
          company_id: string
          created_at: string
          date: string
          description: string
          fee_amount: number
          gross_amount: number
          id: string
          is_recurring: boolean
          net_amount: number
          payment_method: string | null
          recurrence_group_id: string | null
          recurrence_interval: string | null
          status: string
        }
        Insert: {
          client?: string | null
          company_id: string
          created_at?: string
          date: string
          description: string
          fee_amount?: number
          gross_amount?: number
          id?: string
          is_recurring?: boolean
          net_amount?: number
          payment_method?: string | null
          recurrence_group_id?: string | null
          recurrence_interval?: string | null
          status?: string
        }
        Update: {
          client?: string | null
          company_id?: string
          created_at?: string
          date?: string
          description?: string
          fee_amount?: number
          gross_amount?: number
          id?: string
          is_recurring?: boolean
          net_amount?: number
          payment_method?: string | null
          recurrence_group_id?: string | null
          recurrence_interval?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenues_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          company_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          type: string
          unit_cost: number
        }
        Insert: {
          company_id: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          type: string
          unit_cost?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_payments: {
        Row: {
          company_id: string
          created_at: string
          due_date: string
          estimated_amount: number
          id: string
          paid_amount: number | null
          paid_date: string | null
          reference_month: string
          status: string
          tax_type: string
        }
        Insert: {
          company_id: string
          created_at?: string
          due_date: string
          estimated_amount?: number
          id?: string
          paid_amount?: number | null
          paid_date?: string | null
          reference_month: string
          status?: string
          tax_type?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          due_date?: string
          estimated_amount?: number
          id?: string
          paid_amount?: number | null
          paid_date?: string | null
          reference_month?: string
          status?: string
          tax_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_settings: {
        Row: {
          company_id: string
          created_at: string
          due_day: number
          fixed_amount: number
          id: string
          tax_mode: string
          tax_percentage: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          due_day?: number
          fixed_amount?: number
          id?: string
          tax_mode?: string
          tax_percentage?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          due_day?: number
          fixed_amount?: number
          id?: string
          tax_mode?: string
          tax_percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "accountant" | "company_owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "accountant", "company_owner"],
    },
  },
} as const
