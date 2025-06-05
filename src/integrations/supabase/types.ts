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
      appointments: {
        Row: {
          address: string | null
          appointment_date: string | null
          appointment_time: string | null
          appointment_type:
            | Database["public"]["Enums"]["appointment_type_enum"]
            | null
          center: Database["public"]["Enums"]["center_enum"] | null
          department: Database["public"]["Enums"]["department"] | null
          departments: string[] | null
          full_name: string | null
          hn: string | null
          note: string | null
          patient_id: string
          phone_number: string | null
          status: Database["public"]["Enums"]["status_enum"] | null
          table_number: number | null
          time_period: Database["public"]["Enums"]["time_period_enum"] | null
        }
        Insert: {
          address?: string | null
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?:
            | Database["public"]["Enums"]["appointment_type_enum"]
            | null
          center?: Database["public"]["Enums"]["center_enum"] | null
          department?: Database["public"]["Enums"]["department"] | null
          departments?: string[] | null
          full_name?: string | null
          hn?: string | null
          note?: string | null
          patient_id?: string
          phone_number?: string | null
          status?: Database["public"]["Enums"]["status_enum"] | null
          table_number?: number | null
          time_period?: Database["public"]["Enums"]["time_period_enum"] | null
        }
        Update: {
          address?: string | null
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?:
            | Database["public"]["Enums"]["appointment_type_enum"]
            | null
          center?: Database["public"]["Enums"]["center_enum"] | null
          department?: Database["public"]["Enums"]["department"] | null
          departments?: string[] | null
          full_name?: string | null
          hn?: string | null
          note?: string | null
          patient_id?: string
          phone_number?: string | null
          status?: Database["public"]["Enums"]["status_enum"] | null
          table_number?: number | null
          time_period?: Database["public"]["Enums"]["time_period_enum"] | null
        }
        Relationships: []
      }
      equipment_dispensing: {
        Row: {
          dispensed_at: string | null
          dispensed_by: string | null
          equipment_type: string
          id: string
          patient_id: string
          quantity: number | null
          size: string | null
        }
        Insert: {
          dispensed_at?: string | null
          dispensed_by?: string | null
          equipment_type: string
          id?: string
          patient_id: string
          quantity?: number | null
          size?: string | null
        }
        Update: {
          dispensed_at?: string | null
          dispensed_by?: string | null
          equipment_type?: string
          id?: string
          patient_id?: string
          quantity?: number | null
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_dispensing_dispensed_by_fkey"
            columns: ["dispensed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_dispensing_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      home_visits: {
        Row: {
          address: string
          adl: number
          cc: string | null
          created_at: string | null
          full_name: string
          gps: Json
          hn: string
          note: string | null
          patient_id: string
          patient_type: string
          photo: string | null
          updated_at: string | null
          visit_count: number
          visit_id: string
          visitor_id: string
        }
        Insert: {
          address: string
          adl: number
          cc?: string | null
          created_at?: string | null
          full_name: string
          gps: Json
          hn: string
          note?: string | null
          patient_id: string
          patient_type: string
          photo?: string | null
          updated_at?: string | null
          visit_count: number
          visit_id?: string
          visitor_id: string
        }
        Update: {
          address?: string
          adl?: number
          cc?: string | null
          created_at?: string | null
          full_name?: string
          gps?: Json
          hn?: string
          note?: string | null
          patient_id?: string
          patient_type?: string
          photo?: string | null
          updated_at?: string | null
          visit_count?: number
          visit_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_visitor_id"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          amphoe: string | null
          cid: string | null
          full_address: string | null
          full_name: string | null
          hn: string | null
          house_number: string | null
          id: string
          moo: string | null
          phone_number: string | null
          province: string | null
          pttype_code: string | null
          pttype_name: string | null
          tambon: string | null
        }
        Insert: {
          amphoe?: string | null
          cid?: string | null
          full_address?: string | null
          full_name?: string | null
          hn?: string | null
          house_number?: string | null
          id?: string
          moo?: string | null
          phone_number?: string | null
          province?: string | null
          pttype_code?: string | null
          pttype_name?: string | null
          tambon?: string | null
        }
        Update: {
          amphoe?: string | null
          cid?: string | null
          full_address?: string | null
          full_name?: string | null
          hn?: string | null
          house_number?: string | null
          id?: string
          moo?: string | null
          phone_number?: string | null
          province?: string | null
          pttype_code?: string | null
          pttype_name?: string | null
          tambon?: string | null
        }
        Relationships: []
      }
      public_holidays: {
        Row: {
          date: string
          id: number
          title: string
        }
        Insert: {
          date: string
          id?: number
          title: string
        }
        Update: {
          date?: string
          id?: number
          title?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: number
          max_cases_per_day: number
        }
        Insert: {
          id?: number
          max_cases_per_day: number
        }
        Update: {
          id?: number
          max_cases_per_day?: number
        }
        Relationships: []
      }
      unavailable_days: {
        Row: {
          center: string | null
          date: string
          id: number
          note: string | null
        }
        Insert: {
          center?: string | null
          date: string
          id?: number
          note?: string | null
        }
        Update: {
          center?: string | null
          date?: string
          id?: number
          note?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          center: string | null
          full_name: string
          id: string
          password: string
          role: string
          table_number: number | null
          username: string
          visit_type: string | null
        }
        Insert: {
          center?: string | null
          full_name: string
          id?: string
          password: string
          role: string
          table_number?: number | null
          username: string
          visit_type?: string | null
        }
        Update: {
          center?: string | null
          full_name?: string
          id?: string
          password?: string
          role?: string
          table_number?: number | null
          username?: string
          visit_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      appointment_type_enum: "in" | "out"
      AppointmentStatus:
        | "SCHEDULED"
        | "CONFIRMED"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW"
      center_enum: "รพ.สต.ต้า" | "รพ.สต.พระเนตร" | "ทต.ป่าตาล"
      department: "กายภาพบำบัด" | "แผนไทย" | "แผนจีน"
      status_enum: "new" | "processing" | "done"
      time_period_enum: "ในเวลาราชการ" | "นอกเวลาราชการ"
      UserRole: "DOCTOR" | "NURSE" | "ADMIN" | "STAFF"
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
    Enums: {
      appointment_type_enum: ["in", "out"],
      AppointmentStatus: [
        "SCHEDULED",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      center_enum: ["รพ.สต.ต้า", "รพ.สต.พระเนตร", "ทต.ป่าตาล"],
      department: ["กายภาพบำบัด", "แผนไทย", "แผนจีน"],
      status_enum: ["new", "processing", "done"],
      time_period_enum: ["ในเวลาราชการ", "นอกเวลาราชการ"],
      UserRole: ["DOCTOR", "NURSE", "ADMIN", "STAFF"],
    },
  },
} as const
