// Hand-written Supabase Database type, kept in sync with supabase/schema.sql.
// If you evolve the schema, run `supabase gen types typescript` instead and
// drop this file in its place.

export interface Database {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          location: string | null;
          date_range_start: string | null;
          date_range_end: string | null;
          budget: "free" | "low" | "medium" | "high";
          status: "collecting_availability" | "voting" | "finalized";
          finalized_date: string | null;
          finalized_block: "morning" | "afternoon" | "evening" | null;
          finalized_activity_id: string | null;
          finalized_activity_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          location?: string | null;
          date_range_start?: string | null;
          date_range_end?: string | null;
          budget?: "free" | "low" | "medium" | "high";
          status?: "collecting_availability" | "voting" | "finalized";
          finalized_date?: string | null;
          finalized_block?: "morning" | "afternoon" | "evening" | null;
          finalized_activity_id?: string | null;
          finalized_activity_name?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>;
        Relationships: [];
      };
      members: {
        Row: {
          id: string;
          plan_id: string;
          name: string;
          is_host: boolean;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          name: string;
          is_host?: boolean;
          responded_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "members_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      availability: {
        Row: {
          id: string;
          plan_id: string;
          member_id: string;
          slot_id: string;
          status: "available" | "busy";
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          member_id: string;
          slot_id: string;
          status: "available" | "busy";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["availability"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "availability_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "availability_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          id: string;
          plan_id: string;
          member_id: string;
          activity_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          member_id: string;
          activity_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["votes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "votes_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
