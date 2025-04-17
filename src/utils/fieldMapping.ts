/**
 * Field Mapping Utility
 * 
 * Maps column names from Google Sheets to the expected field names in the application.
 * This allows the dashboard to work with different CSV formats.
 */

import { AdData } from '@/types/data';
import { DataSourceType } from './constants';
import { parseNumericValue } from './dataProcessor';

// Define the expected source field names from Google Ads CSV
export interface GoogleAdsFields {
  'Date': string;
  'Account Name': string;
  'Language': string;
  'Domain': string;
  'Campaign Name': string;
  'Status': string;
  'Channel Type': string;
  'Impressions': string;
  'Clicks': string;
  'Cost': string;
  'Conversions': string;
  'Conv. Value': string;
  'CTR': string;
  'CPC': string;
  'CPA': string;
  'Conv. Rate': string;
  'ROAS': string;
  'CLV': string;
  'Profit': string;
  [key: string]: string; // Allow for additional fields
}

// Define the expected source field names from Microsoft Ads CSV
export interface MicrosoftAdsFields {
  'Date': string;
  'Account': string;
  'Campaign': string;
  'Campaign Status': string;
  'Campaign type': string;
  'Impressions': string;
  'Clicks': string;
  'Spend': string;
  'Conversions': string;
  'Revenue': string;
  'CTR': string;
  'Average Cost-per-Click (CPC)': string;
  'Cost per acquisition (CPA)': string;
  'Conversion Rate': string;
  'ROAS': string;
  'Revenue Per Conversion': string;
  [key: string]: string; // Allow for additional fields
}

// Map from Google Ads fields to AdData fields
const googleAdsFieldMap: Record<string, keyof AdData | null> = {
  'Campaign Name': 'Campaign',
  'Domain': 'Domain name',
  'Account Name': 'Account name',
  'Language': 'Language',
  'Channel Type': 'Campaign type',
  'Impressions': 'Impr.',
  'Clicks': 'Clicks',
  'Cost': 'Cost',
  'Conversions': 'Conversions',
  'Conv. Value': 'Revenue',
  'Status': 'Status',
  'Date': 'Date',
  // Fields we don't need to map (optional fields or unused fields)
  // Ignore pre-calculated metrics, we'll calculate them ourselves
  'CTR': null,
  'CPC': null, 
  'CPA': null,
  'Conv. Rate': null,
  'ROAS': null,
  'Profit': null,
  'CLV': null
};

// Map from Microsoft Ads fields to AdData fields
const microsoftAdsFieldMap: Record<string, keyof AdData | null> = {
  'Campaign': 'Campaign',
  // Domain name will be extracted from Account
  // Account name will be extracted from Account
  // Language will be extracted from Account
  'Campaign type': 'Campaign type',
  'Impressions': 'Impr.',
  'Clicks': 'Clicks',
  'Spend': 'Cost',
  'Conversions': 'Conversions',
  'Revenue': 'Revenue',
  'Campaign Status': 'Status',
  'Date': 'Date',
  'Account': null, // We'll handle this separately for Domain and Language extraction
  // Ignore pre-calculated metrics, we'll calculate them ourselves
  'CTR': null,
  'Average Cost-per-Click (CPC)': null, 
  'Cost per acquisition (CPA)': null,
  'Conversion Rate': null,
  'ROAS': null,
  'Revenue Per Conversion': null
};

// Helper to clean field names from Microsoft Ads (handles extra whitespace and casing issues)
export const normalizeMicrosoftAdsFieldName = (fieldName: string): string => {
  // Trim whitespace and normalize case-sensitive field names
  const trimmed = fieldName.trim();
  
  // Map of common field name variations to normalized names
  const fieldNameMap: Record<string, string> = {
    'campaign': 'Campaign',
    'campaign type': 'Campaign type',
    'campaign status': 'Campaign Status',
    'average cost-per-click (cpc)': 'Average Cost-per-Click (CPC)',
    'cost per acquisition (cpa)': 'Cost per acquisition (CPA)',
    'conversion rate': 'Conversion Rate',
    'revenue per conversion': 'Revenue Per Conversion',
    'impressions': 'Impressions',
    'clicks': 'Clicks',
    'spend': 'Spend',
    'conversions': 'Conversions',
    'revenue': 'Revenue',
    'ctr': 'CTR',
    'roas': 'ROAS',
    'account': 'Account',
    'date': 'Date'
  };
  
  // Look for an exact match in our map (case-insensitive)
  const normalizedName = fieldNameMap[trimmed.toLowerCase()];
  return normalizedName || trimmed; // Return the normalized name or the original if not found
};

/**
 * Extract domain name from Microsoft Ads account name
 * 
 * @param accountName - The account name to extract domain from
 * @returns The extracted domain name
 */
export const extractDomainFromMicrosoftAccount = (accountName: string): string => {
  // Extract account name without the code in parentheses
  const accountWithoutCode = accountName.split(' (')[0].trim();
  
  // Extract domain based on the specified rules
  if (accountWithoutCode.includes('CVwizard')) {
    return 'CVwizard.com';
  } else if (accountWithoutCode.includes('Jobseeker')) {
    return 'Jobseeker.com';
  } else if (accountWithoutCode.match(/^CV\.[a-z]{2}$/)) {
    return accountWithoutCode; // Return as is for CV.fr, CV.nl, CV.se, CV.fi
  }
  
  // Default fallback
  return accountWithoutCode;
};

/**
 * Extract language from Microsoft Ads account name
 * 
 * @param accountName - The account name to extract language from
 * @returns The extracted language code
 */
export const extractLanguageFromMicrosoftAccount = (accountName: string): string => {
  // Extract account name without the code in parentheses
  const accountWithoutCode = accountName.split(' (')[0].trim();
  
  // For CVwizard and Jobseeker, extract language after the first dash
  if (accountWithoutCode.includes('CVwizard') || accountWithoutCode.includes('Jobseeker')) {
    const parts = accountWithoutCode.split(' - ');
    if (parts.length > 1) {
      return parts[1].trim();
    }
  }
  
  // For CV.[country], extract language from the domain
  const domainMatch = accountWithoutCode.match(/^CV\.([a-z]{2})$/);
  if (domainMatch && domainMatch[1]) {
    return domainMatch[1].toUpperCase();
  }
  
  // Default fallback
  return '';
};

/**
 * Truncate Microsoft Ads account name by removing the account ID in parentheses
 * 
 * @param accountName - The full account name with ID in parentheses
 * @returns The truncated account name
 */
export const truncateMicrosoftAccountName = (accountName: string): string => {
  // Extract account name without the code in parentheses
  const openParenIndex = accountName.indexOf(' (');
  if (openParenIndex !== -1) {
    return accountName.substring(0, openParenIndex);
  }
  
  // Return original if no parentheses found
  return accountName;
};

// Helper function to parse date strings from different formats
export const parseDate = (dateString: string, dataSource: DataSourceType): Date | null => {
  try {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }

    // Trim any whitespace
    const trimmed = dateString.trim();
    
    // Different formats based on source
    if (dataSource === DataSourceType.GOOGLE_ADS) {
      // Google Ads uses YYYY-MM-DD format
      const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const [_, year, month, day] = match;
        // Create date, then validate
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        // Ensure date is valid and within reasonable range
        if (!isNaN(date.getTime()) && 
            date.getFullYear() === parseInt(year) && 
            date.getMonth() === parseInt(month) - 1 && 
            date.getDate() === parseInt(day)) {
          return date;
        }
      }
    } else if (dataSource === DataSourceType.MICROSOFT_ADS) {
      // Microsoft Ads uses DD-MM-YYYY format
      const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (match) {
        const [_, day, month, year] = match;
        // Create date, then validate
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        // Ensure date is valid and within reasonable range
        if (!isNaN(date.getTime()) && 
            date.getFullYear() === parseInt(year) && 
            date.getMonth() === parseInt(month) - 1 && 
            date.getDate() === parseInt(day)) {
          return date;
        }
      }
    }
    
    // Try multiple fallback formats
    
    // Try to parse YYYY/MM/DD
    const slashFormatMatch = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (slashFormatMatch) {
      const [_, year, month, day] = slashFormatMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try to parse DD/MM/YYYY (European format)
    const euroSlashFormatMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (euroSlashFormatMatch) {
      const [_, day, month, year] = euroSlashFormatMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Last resort: try native JS Date parsing (will use browser's locale)
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    console.warn(`Could not parse date: ${dateString} for data source: ${dataSource}`);
    return null;
  } catch (e) {
    console.error("Error parsing date:", dateString, e);
    return null;
  }
};

// Convert European format DD-MM-YYYY to YYYY-MM-DD for standardization
export const parseEuropeanDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // Check if first part is likely a day (1-31)
    const firstPart = parseInt(parts[0]);
    if (firstPart >= 1 && firstPart <= 31) {
      // Reorder from DD-MM-YYYY to YYYY-MM-DD
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  
  // If not in European format, return as is
  return dateStr;
};

// Format a date as YYYY-MM-DD for consistent storage
export const formatDateYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Map a row from Google Sheet to AdData format
 * 
 * @param row - The raw row data from the Google Sheet
 * @param dataSource - The data source type (Google Ads or Microsoft Ads)
 * @returns The mapped AdData object
 */
export const mapGoogleSheetRow = (
  row: Record<string, string>, 
  dataSource: DataSourceType
): AdData => {
  // Initialize the mapped row with empty strings for required fields
  const mappedRow: Record<string, string> = {
    'Campaign': '',
    'Domain name': '',
    'Account name': '',
    'Language': '',
    'Campaign type': '',
    'Impr.': '',
    'Clicks': '',
    'Cost': '',
    'Conversions': '',
    'Revenue': '',
    'Profit': '',
    'CLV': '',
    'Status': '',
    'Click share': '0%', // Default values for optional fields
    'Search impr. share': '0%',
    'Impr. (Abs. Top) %': '0%',
    'Impr. (Top) %': '0%',
    'Date': '' // Make sure Date is included
  };
  
  // Process fields based on data source
  if (dataSource === DataSourceType.GOOGLE_ADS) {
    // Map fields from Google Ads format
    Object.keys(row).forEach(key => {
      const mappedKey = googleAdsFieldMap[key];
      if (mappedKey) {
        mappedRow[mappedKey] = row[key];
      }
    });
    
    // Handle profit calculation if not provided
    if (!mappedRow['Profit'] && mappedRow['Revenue'] && mappedRow['Cost']) {
      const revenue = parseNumericValue(mappedRow['Revenue']);
      const cost = parseNumericValue(mappedRow['Cost']);
      mappedRow['Profit'] = (revenue - cost).toString();
    }
  } else if (dataSource === DataSourceType.MICROSOFT_ADS) {
    // Map fields from Microsoft Ads format
    Object.keys(row).forEach(key => {
      // Normalize the field name first
      const normalizedKey = normalizeMicrosoftAdsFieldName(key);
      const mappedKey = microsoftAdsFieldMap[normalizedKey];
      if (mappedKey) {
        mappedRow[mappedKey] = row[key];
      }
    });
    
    // Extract domain and language from Account field
    if (row['Account']) {
      mappedRow['Domain name'] = extractDomainFromMicrosoftAccount(row['Account']);
      mappedRow['Account name'] = truncateMicrosoftAccountName(row['Account']);
      mappedRow['Language'] = extractLanguageFromMicrosoftAccount(row['Account']);
    }
    
    // Handle profit calculation
    if (mappedRow['Revenue'] && mappedRow['Cost']) {
      const revenue = parseNumericValue(mappedRow['Revenue']);
      const cost = parseNumericValue(mappedRow['Cost']);
      mappedRow['Profit'] = (revenue - cost).toString();
    }
  }
  
  // Ensure the Date field is consistently formatted
  if (dataSource === DataSourceType.MICROSOFT_ADS && mappedRow['Date']) {
    mappedRow['Date'] = parseEuropeanDate(mappedRow['Date']);
  }
  
  // Parse the date into a Date object for internal use
  const processedDate = parseDate(mappedRow['Date'], dataSource);
  
  return {
    ...mappedRow,
    processedDate: processedDate || undefined
  } as AdData;
};

/**
 * Process data from Google Sheets
 * 
 * @param rows - Raw rows from Google Sheets CSV
 * @param dataSource - The data source type (Google Ads or Microsoft Ads)
 * @returns Processed AdData array
 */
export const processGoogleSheetData = (
  rows: Record<string, string>[], 
  dataSource: DataSourceType
): AdData[] => {
  console.log(`Processing ${rows.length} rows from ${dataSource}`);
  
  // For debugging: show date examples from the data
  const dateExamples = rows.slice(0, 5).map(row => row.Date || '');
  console.log(`Date examples from data source: ${JSON.stringify(dateExamples)}`);
  
  const processedData = rows
    .map(row => {
      // Map each row to our expected format
      const mappedRow = mapGoogleSheetRow(row, dataSource);
      
      // Add processedDate
      if (mappedRow.Date) {
        try {
          // If Microsoft Ads, ensure we standardize European format to YYYY-MM-DD
          if (dataSource === DataSourceType.MICROSOFT_ADS) {
            mappedRow.Date = parseEuropeanDate(mappedRow.Date);
          }
          
          // Now parse the date to a Date object
          const processedDate = parseDate(mappedRow.Date, dataSource);
          if (processedDate) {
            return { ...mappedRow, processedDate };
          } else {
            console.warn(`Failed to parse date: ${mappedRow.Date} from source: ${dataSource}`);
          }
        } catch (e) {
          console.error(`Error parsing date for row:`, mappedRow, e);
        }
      }
      
      // Return without processedDate if we couldn't parse it
      return mappedRow;
    })
    .filter(row => {
      // Check for required fields
      const valid = row.Campaign && row.Date;
      if (!valid) {
        console.warn('Filtering out invalid row', row);
      }
      return valid; // Ensure we at least have a campaign name and date
    });
  
  // Log how many rows had valid dates
  const rowsWithDates = processedData.filter(row => row.processedDate).length;
  console.log(`Processed ${processedData.length} rows, ${rowsWithDates} with valid dates`);
  
  return processedData;
}; 