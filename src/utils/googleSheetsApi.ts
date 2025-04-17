/**
 * Google Sheets API Utility
 * 
 * This file contains functions for fetching data from Google Sheets
 * using the published CSV URL approach for better security and performance.
 */

import { DataSourceType } from './constants';

/**
 * Fetch data from a Google Sheet published as CSV
 * 
 * @param url - The published Google Sheet URL with output=csv parameter
 * @param dataSource - The type of data source (needed to handle different header structures)
 * @returns The CSV data as a string, preprocessed if necessary
 */
export const fetchGoogleSheetData = async (
  url: string, 
  dataSource: DataSourceType
): Promise<string> => {
  try {
    // Adding a cache busting parameter to prevent caching issues
    const cacheBuster = `cacheBust=${new Date().getTime()}`;
    const urlWithCacheBuster = url.includes('?') 
      ? `${url}&${cacheBuster}` 
      : `${url}?${cacheBuster}`;
    
    const response = await fetch(urlWithCacheBuster);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet data: ${response.status} ${response.statusText}`);
    }
    
    let csvText = await response.text();
    
    // For Microsoft Ads, handle the case where headers are in the second row
    if (dataSource === DataSourceType.MICROSOFT_ADS) {
      // Split by lines
      const lines = csvText.split('\n');
      
      // Check if we have at least 2 rows
      if (lines.length >= 2) {
        // Take the second row as headers (index 1) and swap with the first row
        const headerRow = lines[1];
        // Remove the first row (which isn't headers) and put the real headers first
        lines.splice(0, 2, headerRow);
        // Join back into a CSV string
        csvText = lines.join('\n');
      }
    }
    
    return csvText;
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    throw error;
  }
};

/**
 * Generate an obfuscated URL for the Google Sheet
 * 
 * This helps protect against scraping by making the URL slightly harder to discover.
 * Note: This is security through obscurity and not a strong protection measure.
 * 
 * @param baseUrl - The base Google Sheet URL to obfuscate
 * @returns An obfuscated URL that still works but is not directly visible
 */
export const obfuscateGoogleSheetUrl = (baseUrl: string): string => {
  // Simple obfuscation by encoding parts of the URL
  // This is a very basic approach and not truly secure
  const parts = baseUrl.split('/');
  
  // Encode the document ID part
  if (parts.length >= 6) {
    parts[5] = encodeURIComponent(parts[5]);
  }
  
  return parts.join('/');
}; 