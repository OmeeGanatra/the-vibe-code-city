export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          github_id: number;
          github_login: string;
          name: string | null;
          avatar_url: string | null;
          bio: string | null;
          email: string | null;
          followers: number;
          following: number;
          public_repos: number;
          total_stars: number;
          total_contributions: number;
          primary_language: string | null;
          github_created_at: string | null;
          claimed: boolean;
          claimed_at: string | null;
          stripe_customer_id: string | null;
          referral_code: string | null;
          referred_by: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
          for_hire: boolean;
          hire_headline: string | null;
          hire_rate_usd_hourly: number | null;
          hire_availability: string | null;
          hire_contact_url: string | null;
          hire_skills: string[];
          hire_bio: string | null;
        };
        Insert: {
          id?: string;
          github_id: number;
          github_login: string;
          name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          email?: string | null;
          followers?: number;
          following?: number;
          public_repos?: number;
          total_stars?: number;
          total_contributions?: number;
          primary_language?: string | null;
          github_created_at?: string | null;
          claimed?: boolean;
          claimed_at?: string | null;
          stripe_customer_id?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
          for_hire?: boolean;
          hire_headline?: string | null;
          hire_rate_usd_hourly?: number | null;
          hire_availability?: string | null;
          hire_contact_url?: string | null;
          hire_skills?: string[];
          hire_bio?: string | null;
        };
        Update: {
          id?: string;
          github_id?: number;
          github_login?: string;
          name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          email?: string | null;
          followers?: number;
          following?: number;
          public_repos?: number;
          total_stars?: number;
          total_contributions?: number;
          primary_language?: string | null;
          github_created_at?: string | null;
          claimed?: boolean;
          claimed_at?: string | null;
          stripe_customer_id?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
          for_hire?: boolean;
          hire_headline?: string | null;
          hire_rate_usd_hourly?: number | null;
          hire_availability?: string | null;
          hire_contact_url?: string | null;
          hire_skills?: string[];
          hire_bio?: string | null;
        };
        Relationships: [];
      };
      repositories: {
        Row: {
          id: string;
          user_id: string;
          github_repo_id: number;
          name: string;
          full_name: string;
          description: string | null;
          language: string | null;
          stars: number;
          forks: number;
          is_fork: boolean;
          url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          github_repo_id: number;
          name: string;
          full_name: string;
          description?: string | null;
          language?: string | null;
          stars?: number;
          forks?: number;
          is_fork?: boolean;
          url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          github_repo_id?: number;
          name?: string;
          full_name?: string;
          description?: string | null;
          language?: string | null;
          stars?: number;
          forks?: number;
          is_fork?: boolean;
          url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contributions: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          week: number;
          count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: number;
          week: number;
          count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          year?: number;
          week?: number;
          count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      stars: {
        Row: {
          id: string;
          user_id: string;
          repo_id: string;
          starred_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          repo_id: string;
          starred_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          repo_id?: string;
          starred_at?: string;
        };
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          category: string;
          threshold: number;
          rarity: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          icon: string;
          category?: string;
          threshold?: number;
          rarity?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          category?: string;
          threshold?: number;
          rarity?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          earned_at?: string;
        };
        Relationships: [];
      };
      kudos: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          referred_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          item_type: string;
          rarity: string;
          price_cents: number;
          preview_data: Record<string, unknown>;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          item_type: string;
          rarity?: string;
          price_cents?: number;
          preview_data?: Record<string, unknown>;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          item_type?: string;
          rarity?: string;
          price_cents?: number;
          preview_data?: Record<string, unknown>;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      inventories: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          acquired_at: string;
          acquired_via: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          acquired_at?: string;
          acquired_via?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          acquired_at?: string;
          acquired_via?: string;
        };
        Relationships: [];
      };
      equipped_items: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          slot: string;
          equipped_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          slot: string;
          equipped_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          slot?: string;
          equipped_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          stripe_session_id: string | null;
          stripe_payment_intent: string | null;
          status: string;
          total_cents: number;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          status?: string;
          total_cents: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          status?: string;
          total_cents?: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          item_id: string;
          price_cents: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          item_id: string;
          price_cents: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          item_id?: string;
          price_cents?: number;
        };
        Relationships: [];
      };
      ad_campaigns: {
        Row: {
          id: string;
          advertiser_id: string;
          name: string;
          headline: string;
          body: string | null;
          cta_text: string;
          cta_url: string;
          image_url: string | null;
          target_category: string | null;
          budget_cents: number;
          spent_cents: number;
          cpc_cents: number;
          status: string;
          stripe_payment_intent: string | null;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          name: string;
          headline: string;
          body?: string | null;
          cta_text?: string;
          cta_url: string;
          image_url?: string | null;
          target_category?: string | null;
          budget_cents?: number;
          spent_cents?: number;
          cpc_cents?: number;
          status?: string;
          stripe_payment_intent?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          name?: string;
          headline?: string;
          body?: string | null;
          cta_text?: string;
          cta_url?: string;
          image_url?: string | null;
          target_category?: string | null;
          budget_cents?: number;
          spent_cents?: number;
          cpc_cents?: number;
          status?: string;
          stripe_payment_intent?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ad_clicks: {
        Row: {
          id: string;
          campaign_id: string;
          user_id: string | null;
          building_id: string | null;
          clicked_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          user_id?: string | null;
          building_id?: string | null;
          clicked_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          user_id?: string | null;
          building_id?: string | null;
          clicked_at?: string;
        };
        Relationships: [];
      };
      ad_impressions: {
        Row: {
          id: string;
          campaign_id: string;
          user_id: string | null;
          building_id: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          user_id?: string | null;
          building_id?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          user_id?: string | null;
          building_id?: string | null;
          viewed_at?: string;
        };
        Relationships: [];
      };
      github_cache: {
        Row: {
          cache_key: string;
          data: unknown;
          etag: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          cache_key: string;
          data: unknown;
          expires_at: string;
          etag?: string | null;
          created_at?: string;
        };
        Update: {
          cache_key?: string;
          data?: unknown;
          etag?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

// Convenience type aliases
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Repository = Database["public"]["Tables"]["repositories"]["Row"];
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
export type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];
export type Kudos = Database["public"]["Tables"]["kudos"]["Row"];
export type Item = Database["public"]["Tables"]["items"]["Row"];
export type Inventory = Database["public"]["Tables"]["inventories"]["Row"];
export type EquippedItem = Database["public"]["Tables"]["equipped_items"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type AdCampaign = Database["public"]["Tables"]["ad_campaigns"]["Row"];
export type ActivityEvent = Database["public"]["Tables"]["activity_events"]["Row"];
