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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_predictions: {
        Row: {
          confidence: number
          created_at: string | null
          features: Json | null
          id: string
          model_version: string | null
          predicted_at: string | null
          predicted_value: number | null
          prediction_horizon: string
          prediction_type: string
          risk_score: number | null
          supporting_factors: string[] | null
          symbol: string
          timeframe: string
          valid_until: string
        }
        Insert: {
          confidence: number
          created_at?: string | null
          features?: Json | null
          id?: string
          model_version?: string | null
          predicted_at?: string | null
          predicted_value?: number | null
          prediction_horizon: string
          prediction_type: string
          risk_score?: number | null
          supporting_factors?: string[] | null
          symbol: string
          timeframe?: string
          valid_until: string
        }
        Update: {
          confidence?: number
          created_at?: string | null
          features?: Json | null
          id?: string
          model_version?: string | null
          predicted_at?: string | null
          predicted_value?: number | null
          prediction_horizon?: string
          prediction_type?: string
          risk_score?: number | null
          supporting_factors?: string[] | null
          symbol?: string
          timeframe?: string
          valid_until?: string
        }
        Relationships: []
      }
      ai_watchlist: {
        Row: {
          created_at: string | null
          id: number
          reason: string | null
          symbol: string
          upside_potential: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          reason?: string | null
          symbol: string
          upside_potential?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          reason?: string | null
          symbol?: string
          upside_potential?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      binance_symbols: {
        Row: {
          base_asset: string
          binance_symbol: string
          created_at: string
          id: string
          is_trading_allowed: boolean
          last_price: number | null
          price_change_percent_24h: number | null
          quote_volume_24h: number | null
          status: string
          updated_at: string
        }
        Insert: {
          base_asset: string
          binance_symbol: string
          created_at?: string
          id?: string
          is_trading_allowed?: boolean
          last_price?: number | null
          price_change_percent_24h?: number | null
          quote_volume_24h?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          base_asset?: string
          binance_symbol?: string
          created_at?: string
          id?: string
          is_trading_allowed?: boolean
          last_price?: number | null
          price_change_percent_24h?: number | null
          quote_volume_24h?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      cached_crypto_logos: {
        Row: {
          cached_at: string | null
          last_accessed: string | null
          source_url: string
          storage_path: string
          symbol: string
        }
        Insert: {
          cached_at?: string | null
          last_accessed?: string | null
          source_url: string
          storage_path: string
          symbol: string
        }
        Update: {
          cached_at?: string | null
          last_accessed?: string | null
          source_url?: string
          storage_path?: string
          symbol?: string
        }
        Relationships: []
      }
      crypto_historical_data: {
        Row: {
          close: number | null
          date: string
          high: number | null
          low: number | null
          market_cap: number | null
          open: number | null
          price: number | null
          price_change_24h: number | null
          symbol: string
          volume: number | null
        }
        Insert: {
          close?: number | null
          date: string
          high?: number | null
          low?: number | null
          market_cap?: number | null
          open?: number | null
          price?: number | null
          price_change_24h?: number | null
          symbol: string
          volume?: number | null
        }
        Update: {
          close?: number | null
          date?: string
          high?: number | null
          low?: number | null
          market_cap?: number | null
          open?: number | null
          price?: number | null
          price_change_24h?: number | null
          symbol?: string
          volume?: number | null
        }
        Relationships: []
      }
      crypto_price_action_signals: {
        Row: {
          accumulation_strength: number | null
          distribution_strength: number | null
          explosive_potential: string | null
          factors: string[] | null
          is_accelerating: boolean | null
          is_accumulation: boolean | null
          is_breakout: boolean | null
          is_distribution: boolean | null
          is_expansion: boolean | null
          last_updated: string
          smart_money_sentiment: string | null
          symbol: string
          whale_activity: number | null
        }
        Insert: {
          accumulation_strength?: number | null
          distribution_strength?: number | null
          explosive_potential?: string | null
          factors?: string[] | null
          is_accelerating?: boolean | null
          is_accumulation?: boolean | null
          is_breakout?: boolean | null
          is_distribution?: boolean | null
          is_expansion?: boolean | null
          last_updated?: string
          smart_money_sentiment?: string | null
          symbol: string
          whale_activity?: number | null
        }
        Update: {
          accumulation_strength?: number | null
          distribution_strength?: number | null
          explosive_potential?: string | null
          factors?: string[] | null
          is_accelerating?: boolean | null
          is_accumulation?: boolean | null
          is_breakout?: boolean | null
          is_distribution?: boolean | null
          is_expansion?: boolean | null
          last_updated?: string
          smart_money_sentiment?: string | null
          symbol?: string
          whale_activity?: number | null
        }
        Relationships: []
      }
      crypto_price_history: {
        Row: {
          close: number
          high: number
          low: number
          open: number
          symbol: string
          timestamp: string
          volume: number
        }
        Insert: {
          close: number
          high: number
          low: number
          open: number
          symbol: string
          timestamp: string
          volume: number
        }
        Update: {
          close?: number
          high?: number
          low?: number
          open?: number
          symbol?: string
          timestamp?: string
          volume?: number
        }
        Relationships: []
      }
      cryptocurrencies: {
        Row: {
          ath: number | null
          ath_change_percentage: number | null
          ath_date: string | null
          atl: number | null
          atl_change_percentage: number | null
          atl_date: string | null
          circulating_supply: number | null
          created_at: string | null
          current_price: number | null
          high_24h: number | null
          id: string
          last_updated: string | null
          low_24h: number | null
          market_cap: number | null
          market_cap_change_24h: number | null
          market_cap_change_percentage_24h: number | null
          market_cap_rank: number | null
          name: string
          price_change_24h: number | null
          price_change_percentage_24h: number | null
          symbol: string
          total_supply: number | null
          total_volume: number | null
          volume_24h: number | null
        }
        Insert: {
          ath?: number | null
          ath_change_percentage?: number | null
          ath_date?: string | null
          atl?: number | null
          atl_change_percentage?: number | null
          atl_date?: string | null
          circulating_supply?: number | null
          created_at?: string | null
          current_price?: number | null
          high_24h?: number | null
          id: string
          last_updated?: string | null
          low_24h?: number | null
          market_cap?: number | null
          market_cap_change_24h?: number | null
          market_cap_change_percentage_24h?: number | null
          market_cap_rank?: number | null
          name: string
          price_change_24h?: number | null
          price_change_percentage_24h?: number | null
          symbol: string
          total_supply?: number | null
          total_volume?: number | null
          volume_24h?: number | null
        }
        Update: {
          ath?: number | null
          ath_change_percentage?: number | null
          ath_date?: string | null
          atl?: number | null
          atl_change_percentage?: number | null
          atl_date?: string | null
          circulating_supply?: number | null
          created_at?: string | null
          current_price?: number | null
          high_24h?: number | null
          id?: string
          last_updated?: string | null
          low_24h?: number | null
          market_cap?: number | null
          market_cap_change_24h?: number | null
          market_cap_change_percentage_24h?: number | null
          market_cap_rank?: number | null
          name?: string
          price_change_24h?: number | null
          price_change_percentage_24h?: number | null
          symbol?: string
          total_supply?: number | null
          total_volume?: number | null
          volume_24h?: number | null
        }
        Relationships: []
      }
      predictive_signals: {
        Row: {
          confidence: number | null
          created_at: string
          factors: string[] | null
          id: string
          phase: string | null
          risk_level: string | null
          rsi_divergence: boolean | null
          signal_type: string
          smart_money_flow: string | null
          strength: number | null
          support_level: number | null
          symbol: string
          target_gain: number | null
          timeframe: string | null
          updated_at: string
          volume_anomaly: boolean | null
          volume_profile: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          factors?: string[] | null
          id?: string
          phase?: string | null
          risk_level?: string | null
          rsi_divergence?: boolean | null
          signal_type: string
          smart_money_flow?: string | null
          strength?: number | null
          support_level?: number | null
          symbol: string
          target_gain?: number | null
          timeframe?: string | null
          updated_at?: string
          volume_anomaly?: boolean | null
          volume_profile?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          factors?: string[] | null
          id?: string
          phase?: string | null
          risk_level?: string | null
          rsi_divergence?: boolean | null
          signal_type?: string
          smart_money_flow?: string | null
          strength?: number | null
          support_level?: number | null
          symbol?: string
          target_gain?: number | null
          timeframe?: string | null
          updated_at?: string
          volume_anomaly?: boolean | null
          volume_profile?: string | null
        }
        Relationships: []
      }
      sentiment_data: {
        Row: {
          analyzed_at: string | null
          confidence: number | null
          created_at: string | null
          id: string
          key_topics: string[] | null
          sentiment_label: string
          sentiment_score: number
          source: string
          symbol: string
          volume: number | null
        }
        Insert: {
          analyzed_at?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          key_topics?: string[] | null
          sentiment_label: string
          sentiment_score: number
          source: string
          symbol: string
          volume?: number | null
        }
        Update: {
          analyzed_at?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          key_topics?: string[] | null
          sentiment_label?: string
          sentiment_score?: number
          source?: string
          symbol?: string
          volume?: number | null
        }
        Relationships: []
      }
      token_contracts: {
        Row: {
          chain: string
          contract_address: string
          id: string
          symbol: string
        }
        Insert: {
          chain?: string
          contract_address: string
          id?: string
          symbol: string
        }
        Update: {
          chain?: string
          contract_address?: string
          id?: string
          symbol?: string
        }
        Relationships: []
      }
      tradingview_symbol_map: {
        Row: {
          coingecko_id: string
          tradingview_symbol: string
        }
        Insert: {
          coingecko_id: string
          tradingview_symbol: string
        }
        Update: {
          coingecko_id?: string
          tradingview_symbol?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits: number
          flows_limit: number
          flows_used: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          flows_limit?: number
          flows_used?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          flows_limit?: number
          flows_used?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          symbol: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          symbol?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          symbol?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          enable_notifications: boolean | null
          id: string
          investment_horizon: string
          max_position_size: number | null
          notification_frequency: string | null
          preferred_assets: string[] | null
          preferred_categories: string[] | null
          risk_profile: string
          stop_loss_percentage: number | null
          take_profit_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enable_notifications?: boolean | null
          id?: string
          investment_horizon?: string
          max_position_size?: number | null
          notification_frequency?: string | null
          preferred_assets?: string[] | null
          preferred_categories?: string[] | null
          risk_profile?: string
          stop_loss_percentage?: number | null
          take_profit_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enable_notifications?: boolean | null
          id?: string
          investment_horizon?: string
          max_position_size?: number | null
          notification_frequency?: string | null
          preferred_assets?: string[] | null
          preferred_categories?: string[] | null
          risk_profile?: string
          stop_loss_percentage?: number | null
          take_profit_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_price_history: {
        Args: { p_end_time: string; p_start_time: string; p_symbol: string }
        Returns: {
          close: number
          high: number
          low: number
          open: number
          symbol: string
          timestamp: string
          volume: number
        }[]
        SetofOptions: {
          from: "*"
          to: "crypto_price_history"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _action: string
          _new_values?: Json
          _old_values?: Json
          _record_id?: string
          _table_name?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
