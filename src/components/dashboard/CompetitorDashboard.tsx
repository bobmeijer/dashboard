'use client';

import { useEffect, useState } from 'react';
import { ZoomableChart } from '../common/ZoomableChart';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DataSourceType } from '@/utils/constants';
import { toast } from 'react-hot-toast';
import { TimeUnit } from '@/types/data';
import { useData } from '@/context/DataContext';
import { CompetitorFilterPanel } from '../filters/CompetitorFilterPanel';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CompetitorData {
  account: string;
  year: string;
  quarter: string;
  month: string;
  week: string;
  day: string;
  display_url_domain: string;
  impression_share: number | string;
  overlap_rate: number | string;
  position_above_rate: number | string;
  top_of_page_rate: number | string;
  abs_top_of_page_rate: number | string;
  outranking_share: number | string;
}

export const CompetitorDashboard = () => {
  const { activeDataSource, timeUnit, dateRange } = useData();
  const [data, setData] = useState<CompetitorData[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('CV.nl');
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);

  useEffect(() => {
    if (activeDataSource === DataSourceType.MICROSOFT_ADS) {
      toast.error('Competitor data only available for Google Ads');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(DataSourceType.COMPETITOR_DATA_URL);
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        setData(parsedData);
        
        // Extract unique accounts from the data
        const accounts = [...new Set(parsedData.map(item => item.account))];
        setAvailableAccounts(accounts.sort());
      } catch (error) {
        console.error('Error fetching competitor data:', error);
        toast.error('Failed to load competitor data');
      }
    };

    fetchData();
  }, [activeDataSource]);

  const parseCSV = (csv: string): CompetitorData[] => {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        account: values[0],
        year: values[1],
        quarter: values[2],
        month: values[3],
        week: values[4],
        day: values[5],
        display_url_domain: values[6],
        impression_share: values[7],
        overlap_rate: values[8],
        position_above_rate: values[9],
        top_of_page_rate: values[10],
        abs_top_of_page_rate: values[11],
        outranking_share: values[12],
      };
    });
  };

  const parseMetricValue = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (value === '< 10%' || value.includes('<')) return 0;
    return parseFloat(value) || 0;
  };

  const getTimeValue = (item: CompetitorData) => {
    switch (timeUnit) {
      case 'Day':
        return item.day;
      case 'Week':
        return item.week;
      case 'Month':
        return item.month;
      case 'Quarter':
        return item.quarter;
      case 'Year':
        return item.year;
    }
  };

  // Helper to standardize date format for proper sorting
  const getDateForSorting = (timeValue: string, unit: TimeUnit): Date => {
    try {
      switch (unit) {
        case 'Day':
          return new Date(timeValue); // Assuming YYYY-MM-DD format
        case 'Week':
          // Parse something like "2025-01-22" (week of Jan 22, 2025)
          return new Date(timeValue);
        case 'Month':
          // Parse something like "January 2025"
          const [month, year] = timeValue.split(' ');
          const monthIndex = new Date(Date.parse(`${month} 1, ${year}`)).getMonth();
          return new Date(parseInt(year), monthIndex, 1);
        case 'Quarter':
          // Parse something like "Q1 2025"
          const [quarter, qYear] = timeValue.split(' ');
          const quarterNumber = parseInt(quarter.slice(1)) - 1; // Q1 -> 0, Q2 -> 1, etc.
          return new Date(parseInt(qYear), quarterNumber * 3, 1);
        case 'Year':
          // Parse something like "2025"
          return new Date(parseInt(timeValue), 0, 1);
        default:
          return new Date(timeValue);
      }
    } catch (error) {
      console.error(`Error parsing date ${timeValue} for unit ${unit}:`, error);
      return new Date(0); // Default to epoch if parsing fails
    }
  };

  const filterDataByDateRange = (data: CompetitorData[]): CompetitorData[] => {
    if (!dateRange.startDate && !dateRange.endDate) return data;

    return data.filter(item => {
      const itemDate = new Date(item.day);
      const start = dateRange.startDate ? new Date(dateRange.startDate) : new Date(0);
      const end = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
      
      // Ensure dates are compared properly by setting time to noon
      itemDate.setHours(12, 0, 0, 0);
      start.setHours(12, 0, 0, 0);
      end.setHours(12, 0, 0, 0);
      
      return itemDate >= start && itemDate <= end;
    });
  };

  const createChartData = (metric: keyof CompetitorData) => {
    // First filter by date range
    let filteredData = filterDataByDateRange(data);

    // Then filter by selected account
    filteredData = filteredData.filter(item => item.account === selectedAccount);

    // Group by display_url_domain
    const domains = [...new Set(filteredData.map(item => item.display_url_domain))];
    
    // For specific charts, exclude the "you" domain if present
    const shouldExcludeYou = metric === 'overlap_rate' || 
                             metric === 'position_above_rate' || 
                             metric === 'outranking_share';
    
    const filteredDomains = shouldExcludeYou 
      ? domains.filter(domain => !domain.toLowerCase().includes('you'))
      : domains;
    
    // Collect all possible time keys to ensure consistent order
    const allTimeKeys = new Set<string>();
    filteredData.forEach(item => {
      const timeKey = getTimeValue(item);
      if (timeKey) {
        allTimeKeys.add(timeKey);
      }
    });
    
    // Sort all time keys chronologically
    const sortedTimeKeys = Array.from(allTimeKeys)
      .map(key => ({
        original: key,
        date: getDateForSorting(key, timeUnit)
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(item => item.original);

    // Create a consistent time keys index map for ordering
    const timeKeysOrder: { [key: string]: number } = {};
    sortedTimeKeys.forEach((key, index) => {
      timeKeysOrder[key] = index;
    });
    
    // For each domain, create a dataset
    const datasets = filteredDomains.map((domain, index) => {
      const domainData = filteredData.filter(item => item.display_url_domain === domain);
      
      // Group by time unit and calculate average for each time period
      const timeGroups = new Map<string, { sum: number; count: number }>();
      
      domainData.forEach(item => {
        const timeKey = getTimeValue(item);
        if (!timeKey) return; // Skip if time key is missing
        
        const value = parseMetricValue(item[metric]);
        
        if (!timeGroups.has(timeKey)) {
          timeGroups.set(timeKey, { sum: value, count: 1 });
        } else {
          const group = timeGroups.get(timeKey)!;
          group.sum += value;
          group.count += 1;
        }
      });

      // Convert grouped data to chart points
      let timePoints = sortedTimeKeys
        .filter(timeKey => timeGroups.has(timeKey)) // Only include keys present for this domain
        .map(timeKey => {
          const { sum, count } = timeGroups.get(timeKey)!;
          return {
            x: timeKey,
            y: sum / count
          };
        });

      return {
        label: domain,
        data: timePoints,
        borderColor: `hsl(${(index * 360) / filteredDomains.length}, 70%, 50%)`,
        fill: false,
        tension: 0.1, // Add slight curve to the line for better visibility
      };
    });

    return {
      labels: sortedTimeKeys, // Supply sorted labels array to ensure consistent ordering
      datasets,
    };
  };

  // Calculate dynamic Y axis range based on data
  const calculateYAxisRange = (metric: keyof CompetitorData) => {
    // Get the filtered and processed data
    const chartData = createChartData(metric);
    
    // If no data, use default range
    if (!chartData.datasets || chartData.datasets.length === 0) {
      return { min: 0, max: 1 };
    }
    
    // Extract all Y values
    const allYValues: number[] = [];
    chartData.datasets.forEach(dataset => {
      dataset.data.forEach((point: any) => {
        allYValues.push(point.y);
      });
    });
    
    // If no values, use default range
    if (allYValues.length === 0) {
      return { min: 0, max: 1 };
    }
    
    // Find min and max values
    const minValue = Math.min(...allYValues);
    const maxValue = Math.max(...allYValues);
    
    // Add 10% padding
    const range = maxValue - minValue;
    const padding = Math.max(range * 0.1, 0.05); // At least 5% padding
    
    // Ensure min is never below 0 for percentage data
    const min = Math.max(minValue - padding, 0);
    const max = maxValue + padding;
    
    return { min, max };
  };

  const getChartOptions = (title: string, metric: keyof CompetitorData) => {
    // Get dynamic Y axis range
    const yAxisRange = calculateYAxisRange(metric);
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false as const, // Disable automatic data parsing
      normalized: true as const, // Normalize data
      scales: {
        x: {
          type: 'category' as const,
          title: {
            display: true,
            text: timeUnit,
          },
          ticks: {
            autoSkip: true,
            maxRotation: 90,
            minRotation: 45
          }
        },
        y: {
          type: 'linear' as const,
          beginAtZero: true,
          min: yAxisRange.min,
          max: yAxisRange.max,
          title: {
            display: true,
            text: 'Rate',
          },
          ticks: {
            callback: function(tickValue: number | string) {
              const value = Number(tickValue);
              return `${(value * 100).toFixed(0)}%`;
            }
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 16,
            weight: 'bold' as const
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        legend: {
          position: 'bottom' as const,
        },
        tooltip: {
          callbacks: {
            label: function(tooltipItem: any) {
              const value = tooltipItem.parsed.y;
              return `${tooltipItem.dataset.label}: ${(value * 100).toFixed(1)}%`;
            },
          },
        },
      },
    }
  };

  const metrics = [
    { key: 'impression_share', title: 'Impression Share' },
    { key: 'overlap_rate', title: 'Overlap Rate' },
    { key: 'position_above_rate', title: 'Position Above Rate' },
    { key: 'top_of_page_rate', title: 'Top of Page Rate' },
    { key: 'abs_top_of_page_rate', title: 'Absolute Top of Page Rate' },
    { key: 'outranking_share', title: 'Outranking Share' },
  ];

  return (
    <div className="space-y-4">
      {/* Custom Filter Panel */}
      <CompetitorFilterPanel 
        selectedAccount={selectedAccount}
        availableAccounts={availableAccounts}
        onAccountChange={setSelectedAccount}
      />

      {/* Charts Grid - 2x3 layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map(({ key, title }) => (
          <div key={key} className="bg-white rounded-lg shadow-md p-4 h-[400px]">
            <ZoomableChart title={title}>
              <Line
                data={createChartData(key as keyof CompetitorData)}
                options={getChartOptions(title, key as keyof CompetitorData)}
              />
            </ZoomableChart>
          </div>
        ))}
      </div>
    </div>
  );
}; 