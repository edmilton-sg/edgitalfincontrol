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
