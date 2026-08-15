export type Foundation = {
  id: number;
  name: string;
  description?: string;
  logo?: string | null;
  cover_photo?: string | null;
  category?: string | null;
  city_municipality?: string | null;
  province?: string | null;
  status?: string;
  total_campaigns?: number;
  active_campaigns?: number;
  completed_campaigns?: number;
  followers_count?: number;
  likes_count?: number;
  is_followed?: boolean;
  is_liked?: boolean;
  initials?: string;
};

export type CampaignPhoto = {
  id: number;
  photo_path: string;
  caption?: string;
};

export type CampaignUpdate = {
  id: number;
  campaign_id: number;
  title: string;
  content?: string;
  photos?: string[];
  posted_at: string;
  total_reactions: number;
  my_reaction: boolean;
};

export type Campaign = {
  id: number;
  title: string;
  description?: string;
  cover_photo?: string | null;
  type: 'monetary' | 'item' | 'both';
  goal_amount: number;
  current_amount: number;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled' | 'draft';
  pause_reason?: string | null;
  percent: number;
  accepted_delivery_methods?: string[];
  accepted_payment_methods?: {
    payment_method_id: number;
    name: string;
    icon?: string;
    account_name?: string;
    account_number?: string;
  }[];
  photos?: CampaignPhoto[];
  updates?: CampaignUpdate[];
  foundation: {
    id: number;
    name: string;
    category?: string | null;
    logo?: string | null;
    street?: string | null;
    barangay?: string | null;
    city_municipality?: string | null;
    province?: string | null;
  };
};

export type Donation = {
  id: number;
  type: 'monetary' | 'item';
  status: 'pending' | 'received' | 'cancelled';
  amount?: number | null;
  item_name?: string | null;
  item_quantity?: number | null;
  donated_at: string;
  campaign: {
    id: number;
    title: string;
    type: string;
  };
};

export type DashboardData = {
  donor: {
    id: number;
    first_name: string;
    last_name: string;
  };
  total_donated: number;
  total_items: number;
  campaigns_supported: number;
  recent_donations: Donation[];
  featured_campaigns: Campaign[];
};

export type FoundationDetail = {
  id: number;
  name: string;
  description?: string;
  logo?: string | null;
  cover_photo?: string | null;
  category?: string | null;
  full_address?: string;
  status: string;
  member_since: string;
  total_campaigns: number;
  active_campaigns: number;
  completed_campaigns: number;
  total_raised: number;
  followers_count: number;
  likes_count: number;
  is_followed: boolean;
  is_liked: boolean;
  initials: string;
  campaigns: Campaign[];
};