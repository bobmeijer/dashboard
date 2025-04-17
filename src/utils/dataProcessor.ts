import { AdData, FilterOptions, KpiSummary, TrendData, ComparisonData, DateRange, TimeUnit } from '../types/data';

// Convert string values with commas and currency symbols to numbers
export const parseNumericValue = (value: string): number => {
  if (!value) return 0;
  
  // Remove currency symbol and commas
  const cleanValue = value.replace(/[€$,]/g, '');
  
  // Parse as float
  const numValue = parseFloat(cleanValue);
  
  // Return 0 if not a number
  return isNaN(numValue) ? 0 : numValue;
};

// Parse percentage values (e.g., "10.50%")
export const parsePercentage = (value: string): number => {
  if (!value || value === '--') return 0;
  
  // Remove % sign
  const cleanValue = value.replace(/%/g, '');
  
  // Parse as float
  const numValue = parseFloat(cleanValue);
  
  // Return 0 if not a number, otherwise return as decimal (e.g., 10.5% becomes 0.105)
  return isNaN(numValue) ? 0 : numValue / 100;
};

// Calculate derived metrics for each row
export const calculateMetrics = (data: AdData[]): AdData[] => {
  return data.map(row => {
    const impressions = parseNumericValue(row['Impr.']);
    const clicks = parseNumericValue(row.Clicks);
    const cost = parseNumericValue(row.Cost);
    const conversions = parseNumericValue(row.Conversions);
    const revenue = parseNumericValue(row.Revenue);
    
    // Always calculate metrics from raw data, ignoring any pre-calculated values
    
    // Calculate CTR (Click-Through Rate)
    const ctr = impressions > 0 ? clicks / impressions : 0;
    
    // Calculate CPC (Cost Per Click)
    const cpc = clicks > 0 ? cost / clicks : 0;
    
    // Calculate CPA (Cost Per Acquisition)
    const cpa = conversions > 0 ? cost / conversions : 0;
    
    // Calculate Conversion Rate
    const convRate = clicks > 0 ? conversions / clicks : 0;
    
    // Calculate ROAS (Return on Ad Spend)
    const roas = cost > 0 ? revenue / cost : 0;
    
    // Calculate Profit
    const profit = revenue - cost;
    
    // Calculate CLV (Customer Lifetime Value)
    const clv = conversions > 0 ? revenue / conversions : 0;
    
    return {
      ...row,
      CTR: ctr,
      CPC: cpc,
      CPA: cpa,
      'Conv. rate': convRate,
      ROAS: roas,
      Profit: profit.toString(),
      CLV: clv.toString()
    };
  });
};

// Filter data based on selected filters
export const filterData = (data: AdData[], filters: FilterOptions): AdData[] => {
  return data.filter(row => {
    // If filter arrays are empty, don't filter that category
    const accountMatch = filters.accounts.length === 0 || filters.accounts.includes(row['Account name']);
    const languageMatch = filters.languages.length === 0 || filters.languages.includes(row.Language);
    const campaignTypeMatch = filters.campaignTypes.length === 0 || filters.campaignTypes.includes(row['Campaign type']);
    const domainMatch = filters.domains.length === 0 || filters.domains.includes(row['Domain name']);
    
    // Date range filtering is handled separately in filterByDateRange
    
    return accountMatch && languageMatch && campaignTypeMatch && domainMatch;
  });
};

// Extract filter options from data
export const extractFilterOptions = (data: AdData[]): FilterOptions => {
  const accounts = [...new Set(data.map(row => row['Account name']))];
  const languages = [...new Set(data.map(row => row.Language))];
  const campaignTypes = [...new Set(data.map(row => row['Campaign type']))];
  const domains = [...new Set(data.map(row => row['Domain name']))];
  
  return {
    accounts,
    languages,
    campaignTypes,
    domains
  };
};

// Calculate KPI summary for the filtered data
export const calculateKpiSummary = (data: AdData[]): KpiSummary => {
  const initialSummary = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    revenue: 0,
    profit: 0,
    ctr: 0,
    cpc: 0,
    cpa: 0,
    convRate: 0,
    roas: 0,
    clv: 0
  };
  
  const summary = data.reduce((acc, row) => {
    // Sum the raw metrics
    acc.impressions += parseNumericValue(row['Impr.']);
    acc.clicks += parseNumericValue(row.Clicks);
    acc.cost += parseNumericValue(row.Cost);
    acc.conversions += parseNumericValue(row.Conversions);
    acc.revenue += parseNumericValue(row.Revenue);
    
    // For profit, calculate directly from revenue and cost instead of using the Profit field
    // This ensures profit is calculated correctly even if the Profit field is not set
    const rowRevenue = parseNumericValue(row.Revenue);
    const rowCost = parseNumericValue(row.Cost);
    acc.profit += (rowRevenue - rowCost);
    
    return acc;
  }, { ...initialSummary });
  
  // Calculate aggregate rates
  summary.ctr = summary.impressions > 0 ? summary.clicks / summary.impressions : 0;
  summary.cpc = summary.clicks > 0 ? summary.cost / summary.clicks : 0;
  summary.cpa = summary.conversions > 0 ? summary.cost / summary.conversions : 0;
  summary.convRate = summary.clicks > 0 ? summary.conversions / summary.clicks : 0;
  summary.roas = summary.cost > 0 ? summary.revenue / summary.cost : 0;
  summary.clv = summary.conversions > 0 ? summary.revenue / summary.conversions : 0;
  
  return summary;
};

/**
 * Calculate ISO week number according to ISO-8601 standard
 * - Weeks start on Monday (1) and end on Sunday (7)
 * - Week 1 is the week containing the first Thursday of the year
 * - Some years have 52 weeks, others have 53
 */
export const getISOWeek = (date: Date): { year: number, week: number } => {
  // Create a copy of the date to avoid modifying the original
  const target = new Date(date.getTime());
  
  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  // Convert to ISO format where 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
  const dayOfWeek = date.getDay() || 7;
  
  // Adjust the date to the nearest Thursday (ISO 8601 standard)
  target.setDate(target.getDate() + (4 - dayOfWeek));
  
  // Get the first day of the year for the Thursday's year
  const firstDayOfYear = new Date(target.getFullYear(), 0, 1);
  
  // Calculate the ISO week number
  // Week 1 is the first week with a Thursday in it, 
  // which means week 1 is the week containing January 4th
  const weekNumber = Math.ceil((((target.getTime() - firstDayOfYear.getTime()) / 86400000) + 1) / 7);
  
  // Determine the year the ISO week belongs to
  // The week can belong to the previous or next year depending on which year the first Thursday falls in
  let isoYear = target.getFullYear();
  
  // Handle edge cases for year boundaries
  if (weekNumber > 52) {
    // Check if this is truly a week 53, or if it's week 1 of next year
    const dec31 = new Date(isoYear, 11, 31);
    const dec31Week = Math.ceil((((new Date(isoYear, 11, 31).getTime() - firstDayOfYear.getTime()) / 86400000) + 1) / 7);
    
    // If the last day of the year is not in week 53, then our date must be in week 1 of next year
    if (dec31Week < 53) {
      return { year: isoYear + 1, week: 1 };
    }
  }
  
  // Handle week 0 (should be last week of previous year)
  if (weekNumber === 0) {
    const prevYear = isoYear - 1;
    const lastDayOfPrevYear = new Date(prevYear, 11, 31);
    const prevYearResult = getISOWeek(lastDayOfPrevYear);
    return { year: prevYear, week: prevYearResult.week };
  }
  
  // Additional validation to ensure dates in March/April aren't incorrectly placed in next year
  // If we're in Q1 (Jan-Mar), but the ISO week year is for next year, something's wrong
  if (date.getMonth() < 3 && isoYear > date.getFullYear()) {
    // Force the ISO year to match the date's year
    isoYear = date.getFullYear();
  }
  
  return { year: isoYear, week: weekNumber };
};

// Group data by time periods based on the processed dates
export const generateTrendData = (data: AdData[], timeUnit: TimeUnit): TrendData[] => {
  // First, ensure all data has a processedDate
  const dataWithProcessedDates = data.map(row => {
    if (row.processedDate) {
      return row;
    }
    // If no processedDate, try to parse the Date field
    try {
      const date = new Date(row.Date);
      if (!isNaN(date.getTime())) {
        return { ...row, processedDate: date };
      }
    } catch (e) {
      console.error("Error parsing date:", row.Date, e);
    }
    return row;
  });

  // Group by the selected time unit
  const groupedData: { [key: string]: AdData[] } = {};
  
  dataWithProcessedDates.forEach(row => {
    // Skip rows without a date
    if (!row.processedDate) {
      console.warn("Row missing processedDate:", row);
      return;
    }

    const date = row.processedDate;
    let periodKey: string;
    
    if (timeUnit === 'Day') {
      // For days, use YYYY-MM-DD format
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 0-indexed to 1-indexed
      const day = date.getDate();
      periodKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    } else if (timeUnit === 'Week') {
      // For weeks, use ISO-8601 week format (YYYY-WXX)
      const { year, week } = getISOWeek(date);
      periodKey = `${year}-${week}`;
    } else if (timeUnit === 'Month') {
      // For months, use YYYY-MM format
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 0-indexed to 1-indexed
      periodKey = `${year}-${month}`;
    } else if (timeUnit === 'Quarter') {
      // For quarters, use YYYY-QX format
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      periodKey = `${year}-Q${quarter}`;
    } else {
      // For years, just use YYYY
      periodKey = `${date.getFullYear()}`;
    }
    
    if (!groupedData[periodKey]) {
      groupedData[periodKey] = [];
    }
    
    groupedData[periodKey].push(row);
  });
  
  // Helper to compare periods chronologically
  const comparePeriods = (a: string, b: string): number => {
    // Different comparison logic based on timeUnit
    if (timeUnit === 'Day') {
      // For days, use direct string comparison (YYYY-MM-DD format)
      return a.localeCompare(b);
    } else if (timeUnit === 'Week') {
      // Parse YYYY-WW format (ISO week)
      const [aYear, aWeek] = a.split('-').map(Number);
      const [bYear, bWeek] = b.split('-').map(Number);
      
      // Compare years first
      if (aYear !== bYear) {
        return aYear - bYear;
      }
      // Then compare weeks
      return aWeek - bWeek;
    } else if (timeUnit === 'Month') {
      // Parse YYYY-MM format
      const [aYear, aMonth] = a.split('-').map(Number);
      const [bYear, bMonth] = b.split('-').map(Number);
      
      // Compare years first
      if (aYear !== bYear) {
        return aYear - bYear;
      }
      // Then compare months
      return aMonth - bMonth;
    } else if (timeUnit === 'Quarter') {
      // Parse YYYY-QX format
      const [aYear, aQuarter] = a.split('-');
      const [bYear, bQuarter] = b.split('-');
      
      // Compare years first
      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }
      // Extract quarter numbers (Q1, Q2, etc.)
      const aQNum = parseInt(aQuarter.substring(1));
      const bQNum = parseInt(bQuarter.substring(1));
      
      // Compare quarters
      return aQNum - bQNum;
    }
    
    // For years, simple numerical comparison
    return parseInt(a) - parseInt(b);
  };
  
  // Convert grouped data to trend data
  const trendData: TrendData[] = Object.keys(groupedData)
    .sort(comparePeriods)
    .map(period => {
      const periodData = groupedData[period];
      const kpiSummary = calculateKpiSummary(periodData);
      
      // For display purposes, format the period nicely
      let displayPeriod = period;
      
      return {
        period: displayPeriod,
        ...kpiSummary
      };
    });
  
  return trendData;
};

// Generate comparison data for accounts, languages, or campaign types
export const generateComparisonData = (
  data: AdData[], 
  compareBy: 'Account name' | 'Language' | 'Campaign type' | 'Domain name'
): ComparisonData[] => {
  // Group by the selected comparison dimension
  const groupedData: { [key: string]: AdData[] } = {};
  
  data.forEach(row => {
    const key = row[compareBy];
    
    if (!groupedData[key]) {
      groupedData[key] = [];
    }
    
    groupedData[key].push(row);
  });
  
  // Convert grouped data to comparison data
  const comparisonData: ComparisonData[] = Object.keys(groupedData)
    .map(name => {
      const groupData = groupedData[name];
      const kpiSummary = calculateKpiSummary(groupData);
      
      return {
        name,
        ...kpiSummary
      };
    });
  
  return comparisonData;
};

// Format a numeric value for display
export const formatNumber = (value: number, decimals: number = 0): string => {
  return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
};

// Format a currency value for display
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Format a percentage value for display
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatRoas = (value: number): string => {
  // Format ROAS as a percentage (multiply by 100)
  // ROAS of 1 should be 100%, 2 should be 200%, etc.
  return new Intl.NumberFormat('nl-NL', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatCpc = (value: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatCpa = (value: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatClv = (value: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatCompactCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `€${Math.round(value / 1000000)}M`;
  } else if (Math.abs(value) >= 1000) {
    return `€${Math.round(value / 1000)}K`;
  } else {
    return `€${value.toFixed(2)}`;
  }
};

export const formatCompactNumber = (value: number, decimals = 1) => {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`;
  } else if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`;
  } else {
    return value.toFixed(decimals);
  }
};

// Filter data based on date range
export const filterByDateRange = (data: AdData[], dateRange: DateRange): AdData[] => {
  console.log('Filtering by date range:', dateRange);
  
  if (!dateRange.startDate && !dateRange.endDate) {
    console.log('No date range filtering applied');
    return data; // No date range filtering applied
  }
  
  // Ensure all data has a processed date
  const dataWithDates = data.map(row => {
    if (row.processedDate) {
      return row;
    }
    
    // Try to parse the Date field
    try {
      const date = new Date(row.Date);
      if (!isNaN(date.getTime())) {
        return { ...row, processedDate: date };
      }
    } catch (e) {
      console.error("Error parsing date:", row.Date, e);
    }
    
    return row;
  });

  // Parse start and end dates from the filter
  const normalizeDate = (dateStr: string, isEndDate: boolean = false): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Create date and set to beginning/end of day to ensure inclusive comparison
    const date = new Date(year, month - 1, day);
    
    if (isEndDate) {
      // Set to end of day (23:59:59.999) for inclusive end date
      date.setHours(23, 59, 59, 999);
    } else {
      // Set to beginning of day (00:00:00.000) for inclusive start date
      date.setHours(0, 0, 0, 0);
    }
    
    return date;
  };

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (dateRange.startDate) {
    startDate = normalizeDate(dateRange.startDate, false);
    console.log('Using start date:', startDate);
  }

  if (dateRange.endDate) {
    endDate = normalizeDate(dateRange.endDate, true);
    console.log('Using end date:', endDate);
  }

  const filteredData = dataWithDates.filter(row => {
    // Skip rows without a valid date
    if (!row.processedDate) {
      console.warn("Skipping row with no date:", row);
      return false;
    }

    const rowDate = row.processedDate;

    // Apply date range filtering
    if (startDate && endDate) {
      return rowDate >= startDate && rowDate <= endDate;
    } else if (startDate) {
      return rowDate >= startDate;
    } else if (endDate) {
      return rowDate <= endDate;
    }

    // Default if somehow both are null (shouldn't happen)
    return true;
  });
  
  console.log(`Filtered ${data.length} rows to ${filteredData.length} rows`);
  return filteredData;
};

// Identify opportunities based on performance metrics
export const identifyOpportunities = (data: AdData[]): { 
  highRoas: AdData[];
  lowCpa: AdData[];
  highClickShare: AdData[];
  potentialScaling: AdData[];
} => {
  const processedData = calculateMetrics(data);
  
  // Define thresholds
  const roasThreshold = 3.0;  // ROAS > 3
  const cpaThreshold = (values: number[]) => {
    // Calculate lower quartile of CPA
    const sortedCpas = [...values].sort((a, b) => a - b);
    const lowerQuartileIndex = Math.floor(sortedCpas.length * 0.25);
    return sortedCpas[lowerQuartileIndex] || 0;
  };
  
  const clickShareThreshold = 0.3;  // Click share > 30%
  
  // Extract CPA values for threshold calculation
  const cpaValues = processedData
    .map(row => row.CPA || 0)
    .filter(cpa => cpa > 0);
  
  const lowerCpaThreshold = cpaThreshold(cpaValues);
  
  // Identify opportunities
  const highRoas = processedData.filter(row => (row.ROAS || 0) > roasThreshold);
  const lowCpa = processedData.filter(row => (row.CPA || 0) > 0 && (row.CPA || 0) < lowerCpaThreshold);
  const highClickShare = processedData.filter(row => parsePercentage(row['Click share']) > clickShareThreshold);
  
  // Identify potential scaling opportunities (high ROAS but low click share)
  const potentialScaling = processedData.filter(row => 
    (row.ROAS || 0) > roasThreshold && 
    parsePercentage(row['Click share']) < 0.25 &&
    parsePercentage(row['Click share']) > 0
  );
  
  return {
    highRoas,
    lowCpa,
    highClickShare,
    potentialScaling
  };
}; 