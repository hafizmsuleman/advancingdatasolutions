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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      availability_windows: {
        Row: {
          active: boolean
          end_time: string
          id: string
          start_time: string
          weekday: Database["public"]["Enums"]["weekday"]
        }
        Insert: {
          active?: boolean
          end_time: string
          id?: string
          start_time: string
          weekday: Database["public"]["Enums"]["weekday"]
        }
        Update: {
          active?: boolean
          end_time?: string
          id?: string
          start_time?: string
          weekday?: Database["public"]["Enums"]["weekday"]
        }
        Relationships: []
      }
      blocked_senders: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          value?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          attendance_confirmed_at: string | null
          blocked_until_utc: string
          calendar_sync_status: Database["public"]["Enums"]["calendar_sync"]
          cancel_reason: string | null
          cancelled_at: string | null
          client_tz: string
          code: string
          created_at: string
          email: string
          end_utc: string
          google_event_id: string | null
          id: string
          is_demo: boolean
          lead_id: string
          length_min: number
          manage_token: string
          meet_link: string | null
          released_at: string | null
          rescheduled_from_id: string | null
          session_type: Database["public"]["Enums"]["session_type"]
          start_utc: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          verify_expires_at: string | null
          visitor_hash: string | null
        }
        Insert: {
          attendance_confirmed_at?: string | null
          blocked_until_utc: string
          calendar_sync_status?: Database["public"]["Enums"]["calendar_sync"]
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_tz: string
          code: string
          created_at?: string
          email: string
          end_utc: string
          google_event_id?: string | null
          id?: string
          is_demo?: boolean
          lead_id: string
          length_min: number
          manage_token?: string
          meet_link?: string | null
          released_at?: string | null
          rescheduled_from_id?: string | null
          session_type: Database["public"]["Enums"]["session_type"]
          start_utc: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          verify_expires_at?: string | null
          visitor_hash?: string | null
        }
        Update: {
          attendance_confirmed_at?: string | null
          blocked_until_utc?: string
          calendar_sync_status?: Database["public"]["Enums"]["calendar_sync"]
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_tz?: string
          code?: string
          created_at?: string
          email?: string
          end_utc?: string
          google_event_id?: string | null
          id?: string
          is_demo?: boolean
          lead_id?: string
          length_min?: number
          manage_token?: string
          meet_link?: string | null
          released_at?: string | null
          rescheduled_from_id?: string | null
          session_type?: Database["public"]["Enums"]["session_type"]
          start_utc?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          verify_expires_at?: string | null
          visitor_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_rescheduled_from_id_fkey"
            columns: ["rescheduled_from_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verifications: {
        Row: {
          attempts: number
          booking_id: string
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          last_sent_at: string
          resend_count: number
          verified_at: string | null
          visitor_hash: string | null
        }
        Insert: {
          attempts?: number
          booking_id: string
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          last_sent_at?: string
          resend_count?: number
          verified_at?: string | null
          visitor_hash?: string | null
        }
        Update: {
          attempts?: number
          booking_id?: string
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          last_sent_at?: string
          resend_count?: number
          verified_at?: string | null
          visitor_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_verifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_reply_draft: string | null
          ai_summary: string | null
          booking_token: string
          budget_range: Database["public"]["Enums"]["budget_range"] | null
          client_tz: string | null
          company: string | null
          consent_at: string | null
          created_at: string
          email: string | null
          email_verified_at: string | null
          full_name: string | null
          id: string
          is_demo: boolean
          last_nudged_at: string | null
          need: Database["public"]["Enums"]["need_type"] | null
          notes: string | null
          nudge_count: number
          platform: Database["public"]["Enums"]["platform_type"] | null
          project_area: Database["public"]["Enums"]["project_area"] | null
          raw_message: string | null
          role: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          timeline: string | null
          updated_at: string
          visitor_hash: string | null
        }
        Insert: {
          ai_reply_draft?: string | null
          ai_summary?: string | null
          booking_token?: string
          budget_range?: Database["public"]["Enums"]["budget_range"] | null
          client_tz?: string | null
          company?: string | null
          consent_at?: string | null
          created_at?: string
          email?: string | null
          email_verified_at?: string | null
          full_name?: string | null
          id?: string
          is_demo?: boolean
          last_nudged_at?: string | null
          need?: Database["public"]["Enums"]["need_type"] | null
          notes?: string | null
          nudge_count?: number
          platform?: Database["public"]["Enums"]["platform_type"] | null
          project_area?: Database["public"]["Enums"]["project_area"] | null
          raw_message?: string | null
          role?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          timeline?: string | null
          updated_at?: string
          visitor_hash?: string | null
        }
        Update: {
          ai_reply_draft?: string | null
          ai_summary?: string | null
          booking_token?: string
          budget_range?: Database["public"]["Enums"]["budget_range"] | null
          client_tz?: string | null
          company?: string | null
          consent_at?: string | null
          created_at?: string
          email?: string | null
          email_verified_at?: string | null
          full_name?: string | null
          id?: string
          is_demo?: boolean
          last_nudged_at?: string | null
          need?: Database["public"]["Enums"]["need_type"] | null
          notes?: string | null
          nudge_count?: number
          platform?: Database["public"]["Enums"]["platform_type"] | null
          project_area?: Database["public"]["Enums"]["project_area"] | null
          raw_message?: string | null
          role?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          timeline?: string | null
          updated_at?: string
          visitor_hash?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          booking_id: string | null
          created_at: string
          error: string | null
          id: string
          is_demo: boolean
          lead_id: string | null
          minutes_saved: number
          retry_count: number
          scheduled_utc: string
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          subject: string
          to_email: string
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          body: string
          booking_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          minutes_saved?: number
          retry_count?: number
          scheduled_utc?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject: string
          to_email: string
          type: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          body?: string
          booking_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          minutes_saved?: number
          retry_count?: number
          scheduled_utc?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string
          to_email?: string
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ndas: {
        Row: {
          booking_id: string
          id: string
          ip_address: string | null
          nda_version: string
          signed_at: string
          signer_email: string | null
          signer_name: string
          signer_title: string
        }
        Insert: {
          booking_id: string
          id?: string
          ip_address?: string | null
          nda_version?: string
          signed_at?: string
          signer_email?: string | null
          signer_name: string
          signer_title: string
        }
        Update: {
          booking_id?: string
          id?: string
          ip_address?: string | null
          nda_version?: string
          signed_at?: string
          signer_email?: string | null
          signer_name?: string
          signer_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ndas_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          attendance_flag_hours: number
          attendance_release_hours: number
          automation_last_run_at: string | null
          automation_last_summary: string | null
          automation_lock_until: string | null
          booking_horizon_days: number
          budget_threshold: Database["public"]["Enums"]["budget_range"]
          buffer_min: number
          client_day_end: string
          client_day_start: string
          daily_cap: number
          demo_mode: boolean
          fallback_meeting_link: string | null
          id: number
          min_notice_hours: number
          nudge_after_hours: number
          slot_interval_min: number
          team_timezone: string
          updated_at: string
          virtual_clock_offset_min: number
        }
        Insert: {
          attendance_flag_hours?: number
          attendance_release_hours?: number
          automation_last_run_at?: string | null
          automation_last_summary?: string | null
          automation_lock_until?: string | null
          booking_horizon_days?: number
          budget_threshold?: Database["public"]["Enums"]["budget_range"]
          buffer_min?: number
          client_day_end?: string
          client_day_start?: string
          daily_cap?: number
          demo_mode?: boolean
          fallback_meeting_link?: string | null
          id?: number
          min_notice_hours?: number
          nudge_after_hours?: number
          slot_interval_min?: number
          team_timezone?: string
          updated_at?: string
          virtual_clock_offset_min?: number
        }
        Update: {
          attendance_flag_hours?: number
          attendance_release_hours?: number
          automation_last_run_at?: string | null
          automation_last_summary?: string | null
          automation_lock_until?: string | null
          booking_horizon_days?: number
          budget_threshold?: Database["public"]["Enums"]["budget_range"]
          buffer_min?: number
          client_day_end?: string
          client_day_start?: string
          daily_cap?: number
          demo_mode?: boolean
          fallback_meeting_link?: string | null
          id?: number
          min_notice_hours?: number
          nudge_after_hours?: number
          slot_interval_min?: number
          team_timezone?: string
          updated_at?: string
          virtual_clock_offset_min?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_booking_by_token: {
        Args: { p_reason: string; p_token: string }
        Returns: string
      }
      check_job_token: {
        Args: { p_name: string; p_token: string }
        Returns: boolean
      }
      confirm_attendance: { Args: { p_token: string }; Returns: string }
      confirm_booking: {
        Args: { p_booking_id: string; p_code: string }
        Returns: string
      }
      create_booking_request: {
        Args: {
          p_client_tz: string
          p_email: string
          p_lead_id: string
          p_length: number
          p_session: Database["public"]["Enums"]["session_type"]
          p_start: string
          p_visitor: string
        }
        Returns: string
      }
      create_verification: {
        Args: {
          p_booking_id: string
          p_code: string
          p_email: string
          p_visitor: string
        }
        Returns: undefined
      }
      generate_demo_data: { Args: never; Returns: number }
      get_lead_prefill: {
        Args: { p_booking_token: string }
        Returns: {
          budget_range: Database["public"]["Enums"]["budget_range"]
          company: string
          email: string
          full_name: string
          need: Database["public"]["Enums"]["need_type"]
          platform: Database["public"]["Enums"]["platform_type"]
          project_area: Database["public"]["Enums"]["project_area"]
          role: string
        }[]
      }
      get_public_booking: {
        Args: { p_token: string }
        Returns: {
          attendance_confirmed_at: string
          client_tz: string
          code: string
          company: string
          end_utc: string
          full_name: string
          length_min: number
          manage_token: string
          meet_link: string
          nda_signed: boolean
          nda_signed_at: string
          nda_signer_name: string
          nda_signer_title: string
          session_type: Database["public"]["Enums"]["session_type"]
          start_utc: string
          status: Database["public"]["Enums"]["booking_status"]
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      reset_demo_data: { Args: never; Returns: undefined }
      sign_nda: {
        Args: { p_name: string; p_title: string; p_token: string }
        Returns: string
      }
    }
    Enums: {
      booking_status:
        | "pending_verification"
        | "confirmed"
        | "attendance_confirmed"
        | "released"
        | "rescheduled"
        | "cancelled"
        | "completed"
        | "no_show"
      budget_range: "under_5k" | "5k_20k" | "20k_50k" | "over_50k" | "not_sure"
      calendar_sync: "pending" | "synced" | "failed"
      lead_source: "form" | "email" | "linkedin" | "whatsapp" | "pasted"
      lead_status: "new" | "link_sent" | "started" | "booked" | "cold"
      message_status: "scheduled" | "sent" | "failed" | "cancelled"
      message_type:
        | "verification_code"
        | "confirmation"
        | "admin_new_booking"
        | "nda_reminder"
        | "reminder_24h"
        | "reminder_1h"
        | "release_notice"
        | "reschedule_notice"
        | "cancel_notice"
        | "nudge"
        | "admin_alert"
      need_type:
        | "data_platform"
        | "pipelines"
        | "migration"
        | "cost"
        | "governance"
        | "rag_chatbot"
        | "vector_search"
        | "llm_data_prep"
        | "ai_readiness"
        | "web_app"
        | "ai_api"
        | "app_modernization"
        | "microservices"
        | "other"
      platform_type:
        | "aws"
        | "azure"
        | "fabric"
        | "databricks"
        | "snowflake"
        | "not_decided"
        | "other"
      project_area: "data" | "ai" | "web"
      session_type: "free_consultation"
      weekday: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      booking_status: [
        "pending_verification",
        "confirmed",
        "attendance_confirmed",
        "released",
        "rescheduled",
        "cancelled",
        "completed",
        "no_show",
      ],
      budget_range: ["under_5k", "5k_20k", "20k_50k", "over_50k", "not_sure"],
      calendar_sync: ["pending", "synced", "failed"],
      lead_source: ["form", "email", "linkedin", "whatsapp", "pasted"],
      lead_status: ["new", "link_sent", "started", "booked", "cold"],
      message_status: ["scheduled", "sent", "failed", "cancelled"],
      message_type: [
        "verification_code",
        "confirmation",
        "admin_new_booking",
        "nda_reminder",
        "reminder_24h",
        "reminder_1h",
        "release_notice",
        "reschedule_notice",
        "cancel_notice",
        "nudge",
        "admin_alert",
      ],
      need_type: [
        "data_platform",
        "pipelines",
        "migration",
        "cost",
        "governance",
        "rag_chatbot",
        "vector_search",
        "llm_data_prep",
        "ai_readiness",
        "web_app",
        "ai_api",
        "app_modernization",
        "microservices",
        "other",
      ],
      platform_type: [
        "aws",
        "azure",
        "fabric",
        "databricks",
        "snowflake",
        "not_decided",
        "other",
      ],
      project_area: ["data", "ai", "web"],
      session_type: ["free_consultation"],
      weekday: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    },
  },
} as const
