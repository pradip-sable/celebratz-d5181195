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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          city: string
          country: string
          id: string
          name: string
          slug: string
          sort_order: number
          state: string
        }
        Insert: {
          city?: string
          country?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          state?: string
        }
        Update: {
          city?: string
          country?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          state?: string
        }
        Relationships: []
      }
      availability: {
        Row: {
          date: string
          id: string
          listing_id: string
          state: Database["public"]["Enums"]["availability_state"]
          updated_at: string
        }
        Insert: {
          date: string
          id?: string
          listing_id: string
          state?: Database["public"]["Enums"]["availability_state"]
          updated_at?: string
        }
        Update: {
          date?: string
          id?: string
          listing_id?: string
          state?: Database["public"]["Enums"]["availability_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      category_fields: {
        Row: {
          category_id: string
          created_at: string
          field_type: string
          id: string
          is_filterable: boolean
          key: string
          label: string
          options: Json | null
          sort_order: number
          unit: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          field_type: string
          id?: string
          is_filterable?: boolean
          key: string
          label: string
          options?: Json | null
          sort_order?: number
          unit?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          field_type?: string
          id?: string
          is_filterable?: boolean
          key?: string
          label?: string
          options?: Json | null
          sort_order?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_fields_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      listing_attributes: {
        Row: {
          field_key: string
          id: string
          listing_id: string
          value: Json
        }
        Insert: {
          field_key: string
          id?: string
          listing_id: string
          value: Json
        }
        Update: {
          field_key?: string
          id?: string
          listing_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "listing_attributes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_event_types: {
        Row: {
          event_type_id: string
          id: string
          listing_id: string
        }
        Insert: {
          event_type_id: string
          id?: string
          listing_id: string
        }
        Update: {
          event_type_id?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_event_types_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_event_types_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_media: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          listing_id: string
          position: number
          storage_path: string
          type: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          listing_id: string
          position?: number
          storage_path: string
          type: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          position?: number
          storage_path?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          area_id: string | null
          availability_updated_at: string | null
          capacity_max: number | null
          capacity_min: number | null
          category_id: string
          created_at: string
          description: string | null
          id: string
          price_from: number | null
          price_unit: Database["public"]["Enums"]["price_unit"]
          rating_avg: number | null
          review_count: number
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          address?: string | null
          area_id?: string | null
          availability_updated_at?: string | null
          capacity_max?: number | null
          capacity_min?: number | null
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          price_from?: number | null
          price_unit?: Database["public"]["Enums"]["price_unit"]
          rating_avg?: number | null
          review_count?: number
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          address?: string | null
          area_id?: string | null
          availability_updated_at?: string | null
          capacity_max?: number | null
          capacity_min?: number | null
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          price_from?: number | null
          price_unit?: Database["public"]["Enums"]["price_unit"]
          rating_avg?: number | null
          review_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["app_role"]
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          phone_verified_at: string | null
          updated_at: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["app_role"]
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["app_role"]
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      request_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          request_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          request_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          consent_at: string | null
          created_at: string
          customer_id: string | null
          event_date: string | null
          guest_count: number | null
          id: string
          kind: Database["public"]["Enums"]["request_kind"]
          listing_id: string
          message: string | null
          phone_snapshot: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          vendor_id: string
          visit_date: string | null
          visit_time: string | null
        }
        Insert: {
          consent_at?: string | null
          created_at?: string
          customer_id?: string | null
          event_date?: string | null
          guest_count?: number | null
          id?: string
          kind: Database["public"]["Enums"]["request_kind"]
          listing_id: string
          message?: string | null
          phone_snapshot?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          vendor_id: string
          visit_date?: string | null
          visit_time?: string | null
        }
        Update: {
          consent_at?: string | null
          created_at?: string
          customer_id?: string | null
          event_date?: string | null
          guest_count?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["request_kind"]
          listing_id?: string
          message?: string | null
          phone_snapshot?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          vendor_id?: string
          visit_date?: string | null
          visit_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      review_media: {
        Row: {
          created_at: string
          id: string
          position: number
          review_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          review_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          review_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          customer_id: string
          event_date: string | null
          id: string
          listing_id: string
          rating: number
          request_id: string | null
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          customer_id: string
          event_date?: string | null
          id?: string
          listing_id: string
          rating: number
          request_id?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          customer_id?: string
          event_date?: string | null
          id?: string
          listing_id?: string
          rating?: number
          request_id?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
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
      vendors: {
        Row: {
          about: string | null
          address: string | null
          area_id: string | null
          business_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          owner_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["vendor_status"]
          updated_at: string
        }
        Insert: {
          about?: string | null
          address?: string | null
          area_id?: string | null
          business_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          owner_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
        }
        Update: {
          about?: string | null
          address?: string | null
          area_id?: string | null
          business_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          listing_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          listing_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
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
      update_listing_rating: {
        Args: { _listing_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "vendor" | "admin"
      availability_state: "available" | "tentative" | "booked"
      listing_status: "draft" | "pending" | "live" | "paused" | "rejected"
      price_unit: "per_day" | "per_plate" | "per_event" | "per_hour"
      request_kind: "booking_request" | "enquiry"
      request_status: "new" | "accepted" | "declined" | "closed"
      review_status: "pending" | "approved" | "rejected"
      vendor_status: "pending" | "approved" | "rejected"
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
      app_role: ["customer", "vendor", "admin"],
      availability_state: ["available", "tentative", "booked"],
      listing_status: ["draft", "pending", "live", "paused", "rejected"],
      price_unit: ["per_day", "per_plate", "per_event", "per_hour"],
      request_kind: ["booking_request", "enquiry"],
      request_status: ["new", "accepted", "declined", "closed"],
      review_status: ["pending", "approved", "rejected"],
      vendor_status: ["pending", "approved", "rejected"],
    },
  },
} as const
