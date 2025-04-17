import { TimeUnit } from '@/types/data';

// Chart color palettes
export const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#8884D8', '#82CA9D', '#FF6B6B', '#5A6ACF', '#F19A3E'];
export const CHART_COLORS_SHORT = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#8884D8'];

// Common chart configurations
export const COMMON_CHART_MARGIN = { top: 20, right: 30, left: 40, bottom: 50 };

// ROAS thresholds for color coding
export const ROAS_THRESHOLDS = {
  HIGH: 1.15,  // Green (good performance)
  GOOD: 1,     // Yellow/Orange (acceptable performance)
  LOW: 0       // Red (poor performance)
};

// Time unit options
export const TIME_UNITS = ['Day', 'Week', 'Month', 'Quarter', 'Year'] as const;

// Comparison dimension options
export const COMPARISON_DIMENSIONS = ['Account name', 'Language', 'Campaign type', 'Domain name'] as const;

/**
 * Data Source Identifiers
 */
export enum DataSourceType {
  GOOGLE_ADS = 'google_ads',
  MICROSOFT_ADS = 'microsoft_ads',
  COMPETITOR_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsPmf6RUOxv_gsUXbyABmCieqq_DDSQGxJcHFZJL_qRJzVyviqFjvmJb_iJnQ-jmHnyHLxYmtQ4bUn/pub?output=csv'
}

/**
 * API Configuration
 */
export const DATA_SOURCES = {
  // Google Ads sheet URL
  GOOGLE_ADS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2bBrs7g7T0r6YjZYZQLRaMHFltRZLHEoV6noQDCkboKdUIXJFvuOtYz1g_mAk6-yTbX71M9N3R1hE/pub?output=csv',
  
  // Microsoft Ads sheet URL
  MICROSOFT_ADS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZ41jk_SUOpdSfYisqZcU_ya6VkdvVTPaNfRxEk8ZQKS20c3hxvgBMhKMOq1DqExAJ9CgyvYd8xny3/pub?output=csv',
  
  // Currently active data source
  CURRENT_DATA_SOURCE: DataSourceType.GOOGLE_ADS,
};

/**
 * Feature Flags
 */
export const FEATURES = {
  // How often to refresh data (in milliseconds)
  // Default: 15 minutes
  REFRESH_INTERVAL: 15 * 60 * 1000,
};

/**
 * Dashboard Settings
 */
export const DASHBOARD_CONFIG = {
  DEFAULT_COMPARISON_METRIC: 'Account name' as 'Account name' | 'Language' | 'Campaign type' | 'Domain name',
  DEFAULT_TIME_UNIT: 'Month' as TimeUnit,
};

/**
 * Data Source Labels
 */
export const DATA_SOURCE_LABELS = {
  [DataSourceType.GOOGLE_ADS]: 'Google Ads',
  [DataSourceType.MICROSOFT_ADS]: 'Microsoft Ads',
  [DataSourceType.COMPETITOR_DATA_URL]: 'Competitor',
}; 