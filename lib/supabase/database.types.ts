Need to install the following packages:
supabase@2.22.12
Ok to proceed? (y) 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      balance_sheet_statements: {
        Row: {
          accepted_date: string
          account_payables: number | null
          accumulated_other_comprehensive_income_loss: number | null
          calendar_year: number
          capital_lease_obligations: number | null
          cash_and_cash_equivalents: number | null
          cash_and_short_term_investments: number | null
          cik: string | null
          common_stock: number | null
          date: string
          deferred_revenue: number | null
          deferred_revenue_non_current: number | null
          deferred_tax_liabilities_non_current: number | null
          filling_date: string
          final_link: string | null
          goodwill: number | null
          goodwill_and_intangible_assets: number | null
          id: string
          intangible_assets: number | null
          inventory: number | null
          link: string | null
          long_term_debt: number | null
          long_term_investments: number | null
          minority_interest: number | null
          modified_at: string
          net_debt: number | null
          net_receivables: number | null
          other_assets: number | null
          other_current_assets: number | null
          other_current_liabilities: number | null
          other_liabilities: number | null
          other_non_current_assets: number | null
          other_non_current_liabilities: number | null
          othertotal_stockholders_equity: number | null
          period: string
          preferred_stock: number | null
          property_plant_equipment_net: number | null
          reported_currency: string
          retained_earnings: number | null
          short_term_debt: number | null
          short_term_investments: number | null
          symbol: string
          tax_assets: number | null
          tax_payables: number | null
          total_assets: number | null
          total_current_assets: number | null
          total_current_liabilities: number | null
          total_debt: number | null
          total_equity: number | null
          total_investments: number | null
          total_liabilities: number | null
          total_liabilities_and_stockholders_equity: number | null
          total_liabilities_and_total_equity: number | null
          total_non_current_assets: number | null
          total_non_current_liabilities: number | null
          total_stockholders_equity: number | null
        }
        Insert: {
          accepted_date: string
          account_payables?: number | null
          accumulated_other_comprehensive_income_loss?: number | null
          calendar_year: number
          capital_lease_obligations?: number | null
          cash_and_cash_equivalents?: number | null
          cash_and_short_term_investments?: number | null
          cik?: string | null
          common_stock?: number | null
          date: string
          deferred_revenue?: number | null
          deferred_revenue_non_current?: number | null
          deferred_tax_liabilities_non_current?: number | null
          filling_date: string
          final_link?: string | null
          goodwill?: number | null
          goodwill_and_intangible_assets?: number | null
          id?: string
          intangible_assets?: number | null
          inventory?: number | null
          link?: string | null
          long_term_debt?: number | null
          long_term_investments?: number | null
          minority_interest?: number | null
          modified_at?: string
          net_debt?: number | null
          net_receivables?: number | null
          other_assets?: number | null
          other_current_assets?: number | null
          other_current_liabilities?: number | null
          other_liabilities?: number | null
          other_non_current_assets?: number | null
          other_non_current_liabilities?: number | null
          othertotal_stockholders_equity?: number | null
          period: string
          preferred_stock?: number | null
          property_plant_equipment_net?: number | null
          reported_currency: string
          retained_earnings?: number | null
          short_term_debt?: number | null
          short_term_investments?: number | null
          symbol: string
          tax_assets?: number | null
          tax_payables?: number | null
          total_assets?: number | null
          total_current_assets?: number | null
          total_current_liabilities?: number | null
          total_debt?: number | null
          total_equity?: number | null
          total_investments?: number | null
          total_liabilities?: number | null
          total_liabilities_and_stockholders_equity?: number | null
          total_liabilities_and_total_equity?: number | null
          total_non_current_assets?: number | null
          total_non_current_liabilities?: number | null
          total_stockholders_equity?: number | null
        }
        Update: {
          accepted_date?: string
          account_payables?: number | null
          accumulated_other_comprehensive_income_loss?: number | null
          calendar_year?: number
          capital_lease_obligations?: number | null
          cash_and_cash_equivalents?: number | null
          cash_and_short_term_investments?: number | null
          cik?: string | null
          common_stock?: number | null
          date?: string
          deferred_revenue?: number | null
          deferred_revenue_non_current?: number | null
          deferred_tax_liabilities_non_current?: number | null
          filling_date?: string
          final_link?: string | null
          goodwill?: number | null
          goodwill_and_intangible_assets?: number | null
          id?: string
          intangible_assets?: number | null
          inventory?: number | null
          link?: string | null
          long_term_debt?: number | null
          long_term_investments?: number | null
          minority_interest?: number | null
          modified_at?: string
          net_debt?: number | null
          net_receivables?: number | null
          other_assets?: number | null
          other_current_assets?: number | null
          other_current_liabilities?: number | null
          other_liabilities?: number | null
          other_non_current_assets?: number | null
          other_non_current_liabilities?: number | null
          othertotal_stockholders_equity?: number | null
          period?: string
          preferred_stock?: number | null
          property_plant_equipment_net?: number | null
          reported_currency?: string
          retained_earnings?: number | null
          short_term_debt?: number | null
          short_term_investments?: number | null
          symbol?: string
          tax_assets?: number | null
          tax_payables?: number | null
          total_assets?: number | null
          total_current_assets?: number | null
          total_current_liabilities?: number | null
          total_debt?: number | null
          total_equity?: number | null
          total_investments?: number | null
          total_liabilities?: number | null
          total_liabilities_and_stockholders_equity?: number | null
          total_liabilities_and_total_equity?: number | null
          total_non_current_assets?: number | null
          total_non_current_liabilities?: number | null
          total_stockholders_equity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_balance_sheet_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profile_symbols"
            referencedColumns: ["symbol"]
          },
          {
            foreignKeyName: "fk_balance_sheet_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["symbol"]
          },
        ]
      }
      cash_flow_statements: {
        Row: {
          accepted_date: string
          accounts_payables: number | null
          accounts_receivables: number | null
          acquisitions_net: number | null
          calendar_year: number
          capital_expenditure: number | null
          cash_at_beginning_of_period: number | null
          cash_at_end_of_period: number | null
          change_in_working_capital: number | null
          cik: string | null
          common_stock_issued: number | null
          common_stock_repurchased: number | null
          date: string
          debt_repayment: number | null
          deferred_income_tax: number | null
          depreciation_and_amortization: number | null
          dividends_paid: number | null
          effect_of_forex_changes_on_cash: number | null
          filling_date: string
          final_link: string | null
          free_cash_flow: number | null
          id: string
          inventory: number | null
          investments_in_property_plant_and_equipment: number | null
          link: string | null
          modified_at: string
          net_cash_provided_by_operating_activities: number | null
          net_cash_used_for_investing_activites: number | null
          net_cash_used_provided_by_financing_activities: number | null
          net_change_in_cash: number | null
          net_income: number | null
          operating_cash_flow: number | null
          other_financing_activites: number | null
          other_investing_activites: number | null
          other_non_cash_items: number | null
          other_working_capital: number | null
          period: string
          purchases_of_investments: number | null
          reported_currency: string
          sales_maturities_of_investments: number | null
          stock_based_compensation: number | null
          symbol: string
        }
        Insert: {
          accepted_date: string
          accounts_payables?: number | null
          accounts_receivables?: number | null
          acquisitions_net?: number | null
          calendar_year: number
          capital_expenditure?: number | null
          cash_at_beginning_of_period?: number | null
          cash_at_end_of_period?: number | null
          change_in_working_capital?: number | null
          cik?: string | null
          common_stock_issued?: number | null
          common_stock_repurchased?: number | null
          date: string
          debt_repayment?: number | null
          deferred_income_tax?: number | null
          depreciation_and_amortization?: number | null
          dividends_paid?: number | null
          effect_of_forex_changes_on_cash?: number | null
          filling_date: string
          final_link?: string | null
          free_cash_flow?: number | null
          id?: string
          inventory?: number | null
          investments_in_property_plant_and_equipment?: number | null
          link?: string | null
          modified_at?: string
          net_cash_provided_by_operating_activities?: number | null
          net_cash_used_for_investing_activites?: number | null
          net_cash_used_provided_by_financing_activities?: number | null
          net_change_in_cash?: number | null
          net_income?: number | null
          operating_cash_flow?: number | null
          other_financing_activites?: number | null
          other_investing_activites?: number | null
          other_non_cash_items?: number | null
          other_working_capital?: number | null
          period: string
          purchases_of_investments?: number | null
          reported_currency: string
          sales_maturities_of_investments?: number | null
          stock_based_compensation?: number | null
          symbol: string
        }
        Update: {
          accepted_date?: string
          accounts_payables?: number | null
          accounts_receivables?: number | null
          acquisitions_net?: number | null
          calendar_year?: number
          capital_expenditure?: number | null
          cash_at_beginning_of_period?: number | null
          cash_at_end_of_period?: number | null
          change_in_working_capital?: number | null
          cik?: string | null
          common_stock_issued?: number | null
          common_stock_repurchased?: number | null
          date?: string
          debt_repayment?: number | null
          deferred_income_tax?: number | null
          depreciation_and_amortization?: number | null
          dividends_paid?: number | null
          effect_of_forex_changes_on_cash?: number | null
          filling_date?: string
          final_link?: string | null
          free_cash_flow?: number | null
          id?: string
          inventory?: number | null
          investments_in_property_plant_and_equipment?: number | null
          link?: string | null
          modified_at?: string
          net_cash_provided_by_operating_activities?: number | null
          net_cash_used_for_investing_activites?: number | null
          net_cash_used_provided_by_financing_activities?: number | null
          net_change_in_cash?: number | null
          net_income?: number | null
          operating_cash_flow?: number | null
          other_financing_activites?: number | null
          other_investing_activites?: number | null
          other_non_cash_items?: number | null
          other_working_capital?: number | null
          period?: string
          purchases_of_investments?: number | null
          reported_currency?: string
          sales_maturities_of_investments?: number | null
          stock_based_compensation?: number | null
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cash_flow_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profile_symbols"
            referencedColumns: ["symbol"]
          },
          {
            foreignKeyName: "fk_cash_flow_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["symbol"]
          },
        ]
      }
      earnings_calendar: {
        Row: {
          date: string
          eps_actual: number | null
          eps_estimated: number | null
          id: string
          last_updated: string | null
          modified_at: string
          revenue_actual: number | null
          revenue_estimated: number | null
          symbol: string
        }
        Insert: {
          date: string
          eps_actual?: number | null
          eps_estimated?: number | null
          id?: string
          last_updated?: string | null
          modified_at?: string
          revenue_actual?: number | null
          revenue_estimated?: number | null
          symbol: string
        }
        Update: {
          date?: string
          eps_actual?: number | null
          eps_estimated?: number | null
          id?: string
          last_updated?: string | null
          modified_at?: string
          revenue_actual?: number | null
          revenue_estimated?: number | null
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_earnings_calendar_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profile_symbols"
            referencedColumns: ["symbol"]
          },
          {
            foreignKeyName: "fk_earnings_calendar_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["symbol"]
          },
        ]
      }
      grades_consensus: {
        Row: {
          buy: number | null
          consensus: string | null
          date: string
          hold: number | null
          id: string
          modified_at: string
          sell: number | null
          strong_buy: number | null
          strong_sell: number | null
          symbol: string
        }
        Insert: {
          buy?: number | null
          consensus?: string | null
          date: string
          hold?: number | null
          id?: string
          modified_at?: string
          sell?: number | null
          strong_buy?: number | null
          strong_sell?: number | null
          symbol: string
        }
        Update: {
          buy?: number | null
          consensus?: string | null
          date?: string
          hold?: number | null
          id?: string
          modified_at?: string
          sell?: number | null
          strong_buy?: number | null
          strong_sell?: number | null
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_grades_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profile_symbols"
            referencedColumns: ["symbol"]
          },
          {
            foreignKeyName: "fk_grades_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["symbol"]
          },
        ]
      }
      historical_prices: {
        Row: {
          adj_close: number | null
          change: number | null
          change_over_time: number | null
          change_percent: number | null
          close: number | null
          date: string
          high: number | null
          id: string
          label: string | null
          low: number | null
          modified_at: string
          open: number | null
          symbol: string
          unadjusted_volume: number | null
          volume: number | null
          vwap: number | null
        }
        Insert: {
          adj_close?: number | null
          change?: number | null
          change_over_time?: number | null
          change_percent?: number | null
          close?: number | null
          date: string
          high?: number | null
          id?: string
          label?: string | null
          low?: number | null
          modified_at?: string
          open?: number | null
          symbol: string
          unadjusted_volume?: number | null
          volume?: number | null
          vwap?: number | null
        }
        Update: {
          adj_close?: number | null
          change?: number | null
          change_over_time?: number | null
          change_percent?: number | null
          close?: number | null
          date?: string
          high?: number | null
          id?: string
          label?: string | null
          low?: number | null
          modified_at?: string
          open?: number | null
          symbol?: string
          unadjusted_volume?: number | null
          volume?: number | null
          vwap?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_historical_price_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profile_symbols"
            referencedColumns: ["symbol"]
          },
          {
            foreignKeyName: "fk_historical_price_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["symbol"]
          },
        ]
      }
      income_statements: {
        Row: {
          accepted_date: string
          calendar_year: number
          cik: string | null
          cost_and_expenses: number | null
          cost_of_revenue: number | null
          date: string
          depreciation_and_amortization: number | null
          ebitda: number | null
          ebitdaratio: number | null
          eps: number | null
          epsdiluted: number | null
          filling_date: string
          final_link: string | null
          general_and_administrative_expenses: number | null
          gross_profit: number | null
          gross_profit_ratio: number | null
          id: string
          income_before_tax: number | null
          income_before_tax_ratio: number | null
          income_tax_expense: number | null
          interest_expense: number | null
          interest_income: number | null
          link: string | null
          modified_at: string
          net_income: number | null
          net_income_ratio: number | null
          operating_expenses: number | null
          operating_income: number | null
          operating_income_ratio: number | null
          other_expenses: number | null
          period: string
          reported_currency: string
          research_and_development_expenses: number | null
          revenue: number | null
          selling_and_marketing_expenses: number | null
          selling_general_and_administrative_expenses: number | null
          symbol: string
          total_other_income_expenses_net: number | null
          weighted_average_shs_out: number | null
          weighted_average_shs_out_dil: number | null
        }
        Insert: {
          accepted_date: string
          calendar_year: number
          cik?: string | null
          cost_and_expenses?: number | null
          cost_of_revenue?: number | null
          date: string
          depreciation_and_amortization?: number | null
          ebitda?: number | null
          ebitdaratio?: number | null
          eps?: number | null
          epsdiluted?: number | null
          filling_date: string
          final_link?: string | null
          general_and_administrative_expenses?: number | null
          gross_profit?: number | null
          gross_profit_ratio?: number | null
          id?: string
          income_before_tax?: number | null
          income_before_tax_ratio?: number | null
          income_tax_expense?: number | null
          interest_expense?: number | null
          interest_income?: number | null
          link?: string | null
          modified_at?: string
          net_income?: number | null
          net_income_ratio?: number | null
          operating_expenses?: number | null
          operating_income?: number | null
          operating_income_ratio?: number | null
          other_expenses?: number | null
          period: string
          reported_currency: string
          research_and_development_expenses?: number | null
          revenue?: number | null
          selling_and_marketing_expenses?: number | null
          selling_general_and_administrative_expenses?: number | null
          symbol: string
          total_other_income_expenses_net?: number | null
          weighted_average_shs_out?: number | null
          weighted_average_shs_out_dil?: number | null
        }
        Update: {
          accepted_date?: string
          calendar_year?: number
          cik?: string | null
          cost_and_expenses?: number | null
          cost_of_revenue?: number | null
          date?: string
          depreciation_and_amortization?: number | null
          ebitda?: number | null
          ebitdaratio?: number | null
          eps?: number | null
          epsdiluted?: number | null
          filling_date?: string
          final_link?: string | null
          general_and_administrative_expenses?: number | null
          gross_profit?: number | null
          gross_profit_ratio?: number | null
          id?: string
          income_before_tax?: number | null
          income_before_tax_ratio?: number | null
          income_tax_expense?: number | null
          interest_expense?: number | null
          interest_income?: number | null
          link?: string | null
          modified_at?: string
          net_income?: number | null
          net_income_ratio?: number | null
          operating_expenses?: number | null
          operating_income?: number | null
          operating_income_ratio?: number | null
          other_expenses?: number | null
          period?: string
          reported_currency?: string
          research_and_development_expenses?: number | null
          revenue?: number | null
          selling_and_marketing_expenses?: number | null
          selling_general_and_administrative_expenses?: number | null
          symbol?: string
          total_other_income_expenses_net?: number | null
          weighted_average_shs_out?: number | null
          weighted_average_shs_out_dil?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_income_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profile_symbols"
            referencedColumns: ["symbol"]
          },
          {
            foreignKeyName: "fk_income_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["symbol"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          average_volume: number | null
          beta: number | null
          ceo: string | null
          change: number | null
          change_percentage: number | null
          cik: string | null
          city: string | null
          company_name: string | null
          country: string | null
          currency: string | null
          cusip: string | null
          default_image: boolean | null
          description: string | null
          exchange: string | null
          exchange_full_name: string | null
          full_time_employees: number | null
          id: string
          image: string | null
          industry: string | null
          ipo_date: string | null
          is_actively_trading: boolean | null
          is_adr: boolean | null
          is_etf: boolean | null
          is_fund: boolean | null
          isin: string | null
          last_dividend: number | null
          market_cap: number | null
          modified_at: string
          phone: string | null
          price: number | null
          range: string | null
          sector: string | null
          state: string | null
          symbol: string
          volume: number | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          average_volume?: number | null
          beta?: number | null
          ceo?: string | null
          change?: number | null
          change_percentage?: number | null
          cik?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          currency?: string | null
          cusip?: string | null
          default_image?: boolean | null
          description?: string | null
          exchange?: string | null
          exchange_full_name?: string | null
          full_time_employees?: number | null
          id?: string
          image?: string | null
          industry?: string | null
          ipo_date?: string | null
          is_actively_trading?: boolean | null
          is_adr?: boolean | null
          is_etf?: boolean | null
          is_fund?: boolean | null
          isin?: string | null
          last_dividend?: number | null
          market_cap?: number | null
          modified_at?: string
          phone?: string | null
          price?: number | null
          range?: string | null
          sector?: string | null
          state?: string | null
          symbol: string
          volume?: number | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          average_volume?: number | null
          beta?: number | null
          ceo?: string | null
          change?: number | null
          change_percentage?: number | null
          cik?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          currency?: string | null
          cusip?: string | null
          default_image?: boolean | null
          description?: string | null
          exchange?: string | null
          exchange_full_name?: string | null
          full_time_employees?: number | null
          id?: string
          image?: string | null
          industry?: string | null
          ipo_date?: string | null
          is_actively_trading?: boolean | null
          is_adr?: boolean | null
          is_etf?: boolean | null
          is_fund?: boolean | null
          isin?: string | null
          last_dividend?: number | null
          market_cap?: number | null
          modified_at?: string
          phone?: string | null
          price?: number | null
          range?: string | null
          sector?: string | null
          state?: string | null
          symbol?: string
          volume?: number | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      signals: {
        Row: {
          confidence: number | null
          created_at: string
          details: Json | null
          id: string
          signal_category: string
          signal_code: string
          signal_date: string
          signal_type: string
          symbol: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          details?: Json | null
          id?: string
          signal_category: string
          signal_code: string
          signal_date: string
          signal_type: string
          symbol: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          details?: Json | null
          id?: string
          signal_category?: string
          signal_code?: string
          signal_date?: string
          signal_type?: string
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_signals_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profile_symbols"
            referencedColumns: ["symbol"]
          },
          {
            foreignKeyName: "fk_signals_symbol"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["symbol"]
          },
        ]
      }
      stock_screener: {
        Row: {
          beta: number | null
          company_name: string | null
          country: string | null
          exchange: string | null
          exchange_short_name: string | null
          id: string
          industry: string | null
          is_actively_trading: boolean | null
          is_etf: boolean | null
          is_fund: boolean | null
          last_annual_dividend: number | null
          market_cap: number | null
          modified_at: string
          price: number | null
          sector: string | null
          symbol: string
          volume: number | null
        }
        Insert: {
          beta?: number | null
          company_name?: string | null
          country?: string | null
          exchange?: string | null
          exchange_short_name?: string | null
          id?: string
          industry?: string | null
          is_actively_trading?: boolean | null
          is_etf?: boolean | null
          is_fund?: boolean | null
          last_annual_dividend?: number | null
          market_cap?: number | null
          modified_at?: string
          price?: number | null
          sector?: string | null
          symbol: string
          volume?: number | null
        }
        Update: {
          beta?: number | null
          company_name?: string | null
          country?: string | null
          exchange?: string | null
          exchange_short_name?: string | null
          id?: string
          industry?: string | null
          is_actively_trading?: boolean | null
          is_etf?: boolean | null
          is_fund?: boolean | null
          last_annual_dividend?: number | null
          market_cap?: number | null
          modified_at?: string
          price?: number | null
          sector?: string | null
          symbol?: string
          volume?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      profile_symbols: {
        Row: {
          symbol: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
