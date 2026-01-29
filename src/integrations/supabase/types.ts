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
      categories: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_column_values: {
        Row: {
          column_id: string
          created_at: string | null
          id: string
          item_id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          column_id: string
          created_at?: string | null
          id?: string
          item_id: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          column_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_column_values_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "custom_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_column_values_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_columns: {
        Row: {
          category_id: string
          column_order: number | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category_id: string
          column_order?: number | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category_id?: string
          column_order?: number | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_columns_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          category_id: string
          created_at: string | null
          created_by: string
          current_stock: number | null
          expiry_date: string | null
          id: string
          last_count_date: string | null
          last_counted_by: string | null
          min_stock: number | null
          name: string
          supplier_id: string | null
          unit: string
          units_per_package: number
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          created_by: string
          current_stock?: number | null
          expiry_date?: string | null
          id?: string
          last_count_date?: string | null
          last_counted_by?: string | null
          min_stock?: number | null
          name: string
          supplier_id?: string | null
          unit?: string
          units_per_package?: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          created_by?: string
          current_stock?: number | null
          expiry_date?: string | null
          id?: string
          last_count_date?: string | null
          last_counted_by?: string | null
          min_stock?: number | null
          name?: string
          supplier_id?: string | null
          unit?: string
          units_per_package?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          dish_id: string | null
          dish_name: string
          id: string
          notes: string | null
          order_id: string
          quantity: number
          sent_at: string | null
          status: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          dish_id?: string | null
          dish_name: string
          id?: string
          notes?: string | null
          order_id: string
          quantity?: number
          sent_at?: string | null
          status?: string
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          dish_id?: string | null
          dish_name?: string
          id?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          sent_at?: string | null
          status?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          closed_at: string | null
          created_at: string | null
          customer_name: string | null
          guest_count: number | null
          id: string
          opened_at: string | null
          status: string
          table_id: string | null
          total: number | null
          updated_at: string | null
          waiter_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          guest_count?: number | null
          id?: string
          opened_at?: string | null
          status?: string
          table_id?: string | null
          total?: number | null
          updated_at?: string | null
          waiter_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          guest_count?: number | null
          id?: string
          opened_at?: string | null
          status?: string
          table_id?: string | null
          total?: number | null
          updated_at?: string | null
          waiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      restaurant_tables: {
        Row: {
          capacity: number
          created_at: string | null
          current_order_id: string | null
          id: string
          status: string
          table_number: number
          updated_at: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          current_order_id?: string | null
          id?: string
          status?: string
          table_number: number
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          current_order_id?: string | null
          id?: string
          status?: string
          table_number?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_history: {
        Row: {
          changed_by: string
          created_at: string | null
          id: string
          item_id: string
          movement_type: string
          new_expiry: string | null
          new_stock: number
          previous_expiry: string | null
          previous_stock: number | null
          reason: string | null
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          id?: string
          item_id: string
          movement_type?: string
          new_expiry?: string | null
          new_stock: number
          previous_expiry?: string | null
          previous_stock?: number | null
          reason?: string | null
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          id?: string
          item_id?: string
          movement_type?: string
          new_expiry?: string | null
          new_stock?: number
          previous_expiry?: string | null
          previous_stock?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          name: string
          updated_at: string | null
          whatsapp: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          updated_at?: string | null
          whatsapp: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          updated_at?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      technical_sheets: {
        Row: {
          created_at: string | null
          dish_id: string
          id: string
          item_id: string
          quantity_per_sale: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dish_id: string
          id?: string
          item_id: string
          quantity_per_sale?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dish_id?: string
          id?: string
          item_id?: string
          quantity_per_sale?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_sheets_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_sheets_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
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
      can_manage_user: {
        Args: { _manager_id: string; _target_id: string }
        Returns: boolean
      }
      get_role_level: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_host: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "host"
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
      app_role: ["admin", "staff", "host"],
    },
  },
} as const
