export interface AdData {
  Campaign: string;
  'Domain name': string;
  'Account name': string;
  Language: string;
  'Campaign type': string;
  Status: string;
  Date: string;
  processedDate?: Date;
  'Impr.': string;
  Clicks: string;
  Cost: string;
  Conversions: string;
  Revenue: string;
  Profit: string;
  CLV: string;
  'Click share': string;
  'Search impr. share': string;
  'Impr. (Abs. Top) %': string;
  'Impr. (Top) %': string;
  
  // Calculated metrics (added during processing)
  CTR?: number;
  CPC?: number;
  CPA?: number;
  'Conv. rate'?: number;
  ROAS?: number;
}

// For filtering data
export interface FilterOptions {
  accounts: string[];
  languages: string[];
  campaignTypes: string[];
  domains: string[];
  dateRange?: DateRange;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// For summary statistics
export interface KpiSummary {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  revenue: number;
  profit: number;
  ctr: number;
  cpc: number;
  cpa: number;
  convRate: number;
  roas: number;
  clv: number;
}

// For trends
export interface TrendData {
  period: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  revenue: number;
  profit: number;
  ctr: number;
  cpc: number;
  cpa: number;
  convRate: number;
  roas: number;
  clv: number;
}

// For comparison
export interface ComparisonData {
  name: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  revenue: number;
  profit: number;
  ctr: number;
  cpc: number;
  cpa: number;
  convRate: number;
  roas: number;
  clv: number;
}

// Update any references to time unit to include 'Day'
export type TimeUnit = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'; 