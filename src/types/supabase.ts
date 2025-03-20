export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      comments: {
        Row: {
          content: string;
          created_at: string | null;
          end_time: number | null;
          id: string;
          parent_id: string | null;
          segment_id: string | null;
          session_id: string;
          start_time: number | null;
          updated_at: string | null;
          user_id: string;
          has_audio: boolean | null;
          audio_url: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          end_time?: number | null;
          id?: string;
          parent_id?: string | null;
          segment_id?: string | null;
          session_id: string;
          start_time?: number | null;
          updated_at?: string | null;
          user_id: string;
          has_audio?: boolean | null;
          audio_url?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          end_time?: number | null;
          id?: string;
          parent_id?: string | null;
          segment_id?: string | null;
          session_id?: string;
          start_time?: number | null;
          updated_at?: string | null;
          user_id?: string;
          has_audio?: boolean | null;
          audio_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_segment_id_fkey";
            columns: ["segment_id"];
            isOneToOne: false;
            referencedRelation: "transcript_segments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          counselor_id: string;
          created_at: string | null;
          description: string | null;
          duration: number | null;
          id: string;
          recording_url: string | null;
          session_date: string;
          status: string | null;
          supervisor_id: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          counselor_id: string;
          created_at?: string | null;
          description?: string | null;
          duration?: number | null;
          id?: string;
          recording_url?: string | null;
          session_date: string;
          status?: string | null;
          supervisor_id?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          counselor_id?: string;
          created_at?: string | null;
          description?: string | null;
          duration?: number | null;
          id?: string;
          recording_url?: string | null;
          session_date?: string;
          status?: string | null;
          supervisor_id?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_counselor_id_fkey";
            columns: ["counselor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_supervisor_id_fkey";
            columns: ["supervisor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      transcript_segments: {
        Row: {
          created_at: string | null;
          end_time: number;
          id: string;
          segment_index: number;
          speaker: string | null;
          start_time: number;
          text: string;
          transcript_id: string;
        };
        Insert: {
          created_at?: string | null;
          end_time: number;
          id?: string;
          segment_index: number;
          speaker?: string | null;
          start_time: number;
          text: string;
          transcript_id: string;
        };
        Update: {
          created_at?: string | null;
          end_time?: number;
          id?: string;
          segment_index?: number;
          speaker?: string | null;
          start_time?: number;
          text?: string;
          transcript_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transcript_segments_transcript_id_fkey";
            columns: ["transcript_id"];
            isOneToOne: false;
            referencedRelation: "transcripts";
            referencedColumns: ["id"];
          },
        ];
      };
      transcripts: {
        Row: {
          created_at: string | null;
          full_text: string | null;
          id: string;
          session_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          full_text?: string | null;
          id?: string;
          session_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          full_text?: string | null;
          id?: string;
          session_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transcripts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          image: string | null;
          name: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          token_identifier: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          image?: string | null;
          name?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          token_identifier: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          image?: string | null;
          name?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          token_identifier?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_transcript: {
        Args: {
          session_id_param: string;
          full_text_param: string;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: "counselor" | "supervisor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
