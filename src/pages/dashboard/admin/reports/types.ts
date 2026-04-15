export interface ReportStats {
  totalUsers: number;
  clientCount: number;
  professionalCount: number;
  adminCount: number;
  totalProfiles: number;
  approvedProfiles: number;
  pendingProfiles: number;
  rejectedProfiles: number;
  totalLeads: number;
  totalSubs: number;
  activeSubs: number;
  canceledSubs: number;
  gmv: number;
  totalConversions: number;
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  approvedCommissions: number;
  recentUsers: { id: string; full_name: string | null; email: string; role: string; created_at: string }[];
}

export interface AccessAnalytics {
  visits_24h: number;
  visits_7d: number;
  visits_30d: number;
  unique_sessions_24h: number;
  unique_sessions_7d: number;
  unique_sessions_30d: number;
  bot_count_24h: number;
  bot_count_7d: number;
  daily_visits: { day: string; visits: number; unique_sessions: number }[];
  top_pages: { page_path: string; hits: number }[];
  device_distribution: { device: string; visits: number }[];
  top_referrers: { referrer: string; visits: number }[];
  top_utm_sources: { utm_source: string; visits: number }[];
  top_countries: { country: string; visits: number }[];
  top_cities: { city: string; visits: number }[];
  suspicious_ips: { ip_hash: string; hits: number; last_seen: string; unique_pages: number; is_known_bot: boolean; country_code: string; city_name: string; user_agent_sample: string | null }[];
  suspicious_sessions: { session_id: string; pageviews: number; started: string; last_seen: string; unique_pages: number }[];
  recent_bots: { ip_hash: string; user_agent: string; page_path: string; created_at: string; country_code: string; city_name: string }[];
  bot_by_agent: { user_agent: string; hits: number; unique_ips: number; unique_pages: number; first_seen: string; last_seen: string; pages_visited: string[] }[];
  authenticated_visits_24h: number;
  authenticated_visits_7d: number;
  anonymous_visits_24h: number;
  bounce_rate_7d: number | null;
  avg_session_depth_7d: number | null;
  hourly_distribution: { hour: number; visits: number; bot_visits: number; auth_visits: number }[];
  top_authenticated_users: { user_id: string; display_name: string; role: string; visits: number; sessions: number; unique_pages: number; last_seen: string }[];
  top_utm_campaigns: { utm_campaign: string; utm_source: string; utm_medium: string; visits: number; unique_sessions: number }[];
}

export type DatePreset = "7d" | "30d" | "90d" | "all" | "custom";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
