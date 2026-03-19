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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          notes: string | null
          target_profile_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          notes?: string | null
          target_profile_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          target_profile_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "eligible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          source: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "eligible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period"]
          created_at: string
          features_json: Json
          id: string
          is_active: boolean
          name: string
          price: number
        }
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period"]
          created_at?: string
          features_json?: Json
          id?: string
          is_active?: boolean
          name: string
          price: number
        }
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period"]
          created_at?: string
          features_json?: Json
          id?: string
          is_active?: boolean
          name?: string
          price?: number
        }
        Relationships: []
      }
      profile_images: {
        Row: {
          created_at: string
          id: string
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          profile_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          profile_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          profile_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_images_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "eligible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_images_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          bio: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          featured_until: string | null
          id: string
          is_featured: boolean
          languages: string[] | null
          pricing_from: number | null
          slug: string | null
          status: Database["public"]["Enums"]["profile_status"]
          telegram: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean
          languages?: string[] | null
          pricing_from?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          telegram?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean
          languages?: string[] | null
          pricing_from?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          telegram?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          landing_page: string | null
          referral_code: string
          referrer_user_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          referral_code: string
          referrer_user_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          referral_code?: string
          referrer_user_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_conversions: {
        Row: {
          commission_amount: number
          commission_rate: number
          conversion_type: string
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
          status: Database["public"]["Enums"]["referral_conversion_status"]
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          conversion_type: string
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
          status?: Database["public"]["Enums"]["referral_conversion_status"]
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          conversion_type?: string
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_user_id?: string
          status?: Database["public"]["Enums"]["referral_conversion_status"]
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          google_auth_enabled: boolean
          id: string
          phone: string | null
          referral_code: string | null
          referral_link: string | null
          referred_by_user_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          google_auth_enabled?: boolean
          id: string
          phone?: string | null
          referral_code?: string | null
          referral_link?: string | null
          referred_by_user_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          google_auth_enabled?: boolean
          id?: string
          phone?: string | null
          referral_code?: string | null
          referral_link?: string | null
          referred_by_user_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_referred_by_user_id_fkey"
            columns: ["referred_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      eligible_profiles: {
        Row: {
          age: number | null
          bio: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          featured_until: string | null
          id: string | null
          is_featured: boolean | null
          languages: string[] | null
          pricing_from: number | null
          slug: string | null
          telegram: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          featured_until?: string | null
          id?: string | null
          is_featured?: boolean | null
          languages?: string[] | null
          pricing_from?: number | null
          slug?: string | null
          telegram?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          featured_until?: string | null
          id?: string | null
          is_featured?: boolean | null
          languages?: string[] | null
          pricing_from?: number | null
          slug?: string | null
          telegram?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_admin_sanity_checks: { Args: never; Returns: Json }
      get_referrer_id_by_code: { Args: { _code: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "professional" | "admin"
      billing_period: "monthly" | "quarterly"
      moderation_status: "pending" | "approved" | "rejected"
      profile_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "paused"
      referral_conversion_status: "pending" | "approved" | "paid" | "rejected"
      subscription_status:
        | "pending"
        | "active"
        | "past_due"
        | "canceled"
        | "expired"
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
      app_role: ["client", "professional", "admin"],
      billing_period: ["monthly", "quarterly"],
      moderation_status: ["pending", "approved", "rejected"],
      profile_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "paused",
      ],
      referral_conversion_status: ["pending", "approved", "paid", "rejected"],
      subscription_status: [
        "pending",
        "active",
        "past_due",
        "canceled",
        "expired",
      ],
    },
  },
} as const
