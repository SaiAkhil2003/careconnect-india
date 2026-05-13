import type {
  AnalyticsMetric,
  City,
  Enquiry,
  ListingTier,
  PricingRange,
  Provider,
  ProviderAnalytics,
  ServiceType,
  StaffCountRange,
} from "@/lib/types";

export type Database = {
  public: {
    Tables: {
      providers: {
        Row: Provider;
        Insert: {
          id?: string;
          clerk_user_id?: string | null;
          provider_name: string;
          slug: string;
          service_types: ServiceType[];
          description?: string | null;
          areas_covered: string[];
          languages_spoken: string[];
          phone: string;
          email?: string | null;
          website_url?: string | null;
          address_line?: string | null;
          city?: string | null;
          pricing_range?: PricingRange | null;
          established_year?: number | null;
          staff_count_range?: StaffCountRange | null;
          is_verified?: boolean | null;
          listing_tier?: ListingTier | null;
          is_active?: boolean | null;
          logo_url?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          lead_email?: string | null;
          lead_whatsapp?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Provider>;
        Relationships: [];
      };
      cities: {
        Row: City;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          state?: string | null;
          is_active?: boolean | null;
          provider_count?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<City>;
        Relationships: [];
      };
      enquiries: {
        Row: Enquiry;
        Insert: {
          id?: string;
          provider_id?: string | null;
          family_name: string;
          family_phone: string;
          family_email?: string | null;
          message?: string | null;
          service_needed?: string | null;
          is_delivered?: boolean | null;
          delivery_method?: "email" | "whatsapp" | "both" | null;
          created_at?: string | null;
        };
        Update: Partial<Enquiry>;
        Relationships: [
          {
            foreignKeyName: "enquiries_provider_id_fkey";
            columns: ["provider_id"];
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_analytics: {
        Row: ProviderAnalytics;
        Insert: {
          id?: string;
          provider_id?: string | null;
          date: string;
          profile_views?: number | null;
          enquiry_count?: number | null;
          created_at?: string | null;
        };
        Update: Partial<ProviderAnalytics>;
        Relationships: [
          {
            foreignKeyName: "provider_analytics_provider_id_fkey";
            columns: ["provider_id"];
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_provider_analytics: {
        Args: {
          target_provider_id: string;
          metric: AnalyticsMetric;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
