'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Papa from 'papaparse';
import { AdData, FilterOptions, KpiSummary, TrendData, ComparisonData, DateRange, TimeUnit } from '@/types/data';
import { 
  calculateMetrics, 
  filterData, 
  extractFilterOptions, 
  calculateKpiSummary,
  generateTrendData,
  generateComparisonData,
  identifyOpportunities,
  filterByDateRange
} from '@/utils/dataProcessor';
import { fetchGoogleSheetData } from '@/utils/googleSheetsApi';
import { processGoogleSheetData } from '@/utils/fieldMapping';
import { DATA_SOURCES, DataSourceType, DATA_SOURCE_LABELS, FEATURES } from '@/utils/constants';

interface DataContextProps {
  rawData: AdData[];
  processedData: AdData[];
  loading: boolean;
  error: string | null;
  filterOptions: FilterOptions;
  selectedFilters: FilterOptions;
  timeUnit: TimeUnit;
  compareBy: 'Account name' | 'Language' | 'Campaign type' | 'Domain name';
  kpiSummary: KpiSummary | null;
  trendData: TrendData[];
  completeTrendData: TrendData[];
  comparisonData: ComparisonData[];
  dateRange: DateRange;
  opportunities: {
    highRoas: AdData[];
    lowCpa: AdData[];
    highClickShare: AdData[];
    potentialScaling: AdData[];
  } | null;
  activeDataSource: DataSourceType;
  setSelectedFilters: (filters: FilterOptions) => void;
  setTimeUnit: (unit: TimeUnit) => void;
  setCompareBy: (dimension: 'Account name' | 'Language' | 'Campaign type' | 'Domain name') => void;
  setDateRange: (range: DateRange) => void;
  refreshData: () => void;
  switchDataSource: (dataSource: DataSourceType) => void;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rawData, setRawData] = useState<AdData[]>([]);
  const [processedData, setProcessedData] = useState<AdData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    accounts: [],
    languages: [],
    campaignTypes: [],
    domains: []
  });
  const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({
    accounts: [],
    languages: [],
    campaignTypes: [],
    domains: []
  });
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('Month');
  const [compareBy, setCompareBy] = useState<'Account name' | 'Language' | 'Campaign type' | 'Domain name'>('Account name');
  const [kpiSummary, setKpiSummary] = useState<KpiSummary | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [completeTrendData, setCompleteTrendData] = useState<TrendData[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ 
    startDate: new Date().toISOString().split('T')[0], 
    endDate: new Date().toISOString().split('T')[0] 
  });
  const [opportunities, setOpportunities] = useState<{
    highRoas: AdData[];
    lowCpa: AdData[];
    highClickShare: AdData[];
    potentialScaling: AdData[];
  } | null>(null);

  // Track the currently active data source
  const [activeDataSource, setActiveDataSource] = useState<DataSourceType>(DATA_SOURCES.CURRENT_DATA_SOURCE);

  // Helper function to fetch the appropriate URL based on data source
  const getDataSourceUrl = (dataSource: DataSourceType): string => {
    switch (dataSource) {
      case DataSourceType.GOOGLE_ADS:
        return DATA_SOURCES.GOOGLE_ADS_URL;
      case DataSourceType.MICROSOFT_ADS:
        return DATA_SOURCES.MICROSOFT_ADS_URL;
      default:
        return DATA_SOURCES.GOOGLE_ADS_URL;
    }
  };

  // Load and parse CSV data
  const fetchData = async (dataSource: DataSourceType) => {
    try {
      setLoading(true);
      
      // Fetch from the appropriate Google Sheet
      const url = getDataSourceUrl(dataSource);
      const csvText = await fetchGoogleSheetData(url, dataSource);
      
      // Debug log - preview the CSV data
      console.log(`${dataSource} CSV (first 200 chars):`, csvText.substring(0, 200));
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Debug log - show parsed header row
          console.log(`${dataSource} parsed headers:`, results.meta.fields);
          console.log(`${dataSource} row count:`, results.data.length);
          
          // Map the fields from Google Sheets format to our expected format
          const parsedData = results.data as Record<string, string>[];
          const mappedData = processGoogleSheetData(parsedData, dataSource);
          setRawData(mappedData);
          
          // For metrics that are already calculated in the CSV,
          // we can use them directly instead of recalculating
          // Still call calculateMetrics to ensure any missing metrics are filled in
          const dataWithMetrics = calculateMetrics(mappedData);
          setProcessedData(dataWithMetrics);
          
          // Extract filter options
          const options = extractFilterOptions(mappedData);
          setFilterOptions(options);
          
          setLoading(false);
        },
        error: (error: Error) => {
          console.error(`Error parsing ${dataSource} CSV:`, error);
          setError(`Error parsing CSV: ${error.message}`);
          setLoading(false);
        }
      });
    } catch (err) {
      console.error(`Error loading ${dataSource} data:`, err);
      setError(`Error loading data from ${DATA_SOURCE_LABELS[dataSource]}: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  // Initial load of data
  useEffect(() => {
    fetchData(activeDataSource);
    
    // Set up periodic refresh if enabled
    if (FEATURES.REFRESH_INTERVAL > 0) {
      const refreshInterval = setInterval(() => {
        fetchData(activeDataSource);
      }, FEATURES.REFRESH_INTERVAL);
      
      // Clean up interval on component unmount
      return () => clearInterval(refreshInterval);
    }
  }, [activeDataSource]);

  // Process data when raw data, time unit, or comparison dimension changes
  useEffect(() => {
    if (rawData.length === 0) return;
    
    try {
      // First apply all metrics calculations
      const calculatedData = calculateMetrics(rawData);
      
      // Then filter by selected filters
      let filteredData = filterData(calculatedData, selectedFilters);
      
      // Generate complete trend data based on selected time unit (before date filtering)
      // This will contain all periods including previous years
      const allTrends = generateTrendData(filteredData, timeUnit);
      setCompleteTrendData(allTrends);
      
      // Apply date range filtering
      filteredData = filterByDateRange(filteredData, dateRange);
      
      // Save processed data
      setProcessedData(filteredData);
      
      // Calculate summary KPIs for filtered data
      const summary = calculateKpiSummary(filteredData);
      setKpiSummary(summary);
      
      // Generate trend data based on selected time unit (filtered by date)
      const trends = generateTrendData(filteredData, timeUnit);
      setTrendData(trends);
      
      // Generate comparison data based on selected dimension
      const comparisons = generateComparisonData(filteredData, compareBy);
      setComparisonData(comparisons);
      
      // Detect opportunities based on performance metrics
      const detected = identifyOpportunities(filteredData);
      setOpportunities(detected);
      
      setError(null);
    } catch (err) {
      console.error('Error processing data:', err);
      setError('Error processing data. Please check the console for details.');
    }
  }, [rawData, selectedFilters, timeUnit, compareBy, dateRange]);

  // Switch data source function
  const switchDataSource = (dataSource: DataSourceType) => {
    if (dataSource !== activeDataSource) {
      setActiveDataSource(dataSource);
      
      // Reset filters when switching data sources
      setSelectedFilters({
        accounts: [],
        languages: [],
        campaignTypes: [],
        domains: []
      });
    }
  };

  // Refresh data function - force a refresh from the current data source
  const refreshData = async () => {
    await fetchData(activeDataSource);
  };

  const contextValue: DataContextProps = {
    rawData,
    processedData,
    loading,
    error,
    filterOptions,
    selectedFilters,
    timeUnit,
    compareBy,
    kpiSummary,
    trendData,
    completeTrendData,
    comparisonData,
    dateRange,
    opportunities,
    activeDataSource,
    setSelectedFilters,
    setTimeUnit,
    setCompareBy,
    setDateRange,
    refreshData,
    switchDataSource
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextProps => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 