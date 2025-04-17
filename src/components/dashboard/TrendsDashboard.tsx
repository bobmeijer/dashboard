'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Card } from '../common/Card';
import { 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercentage, 
  formatCompactCurrency, 
  formatCompactNumber, 
  formatRoas, 
  formatCpa, 
  formatCpc, 
  formatClv,
  getISOWeek
} from '@/utils/dataProcessor';
import { SortableTable, Column } from '../common/SortableTable';
import { ZoomableChart } from '../common/ZoomableChart';
import { TrendData, TimeUnit } from '@/types/data';
import { COMMON_CHART_MARGIN, CHART_COLORS } from '@/utils/constants';
import { FiEye, FiMousePointer, FiShoppingCart, FiDollarSign, FiTrendingUp, FiBarChart2, FiPieChart, FiUsers } from 'react-icons/fi';

// Define available metrics based on what's in TrendData
type AvailableMetric = keyof TrendData;
// Define additional metrics we want to support but might need to calculate
type ExtendedMetric = 'cpc' | 'clickShare';

// Combined metric type
type MetricType = keyof Omit<TrendData, 'period'>;

interface MetricDefinition {
  key: MetricType;
  label: string;
  color: string;
  icon: React.ReactElement;
}

interface MetricOption {
  key: MetricType;
  label: string;
  color: string;
  formatFn: (value: number) => string;
}

// Available metrics for selection
const metricOptions: MetricOption[] = [
  { key: 'impressions', label: 'Impressions', color: '#8884d8', formatFn: formatNumber },
  { key: 'clicks', label: 'Clicks', color: '#82ca9d', formatFn: formatNumber },
  { key: 'cost', label: 'Cost', color: '#ff7300', formatFn: formatCurrency },
  { key: 'conversions', label: 'Conversions', color: '#0088fe', formatFn: formatNumber },
  { key: 'revenue', label: 'Revenue', color: '#00c49f', formatFn: formatCurrency },
  { key: 'profit', label: 'Profit', color: '#ffbb28', formatFn: formatCurrency },
  { key: 'ctr', label: 'CTR', color: '#ff8042', formatFn: (value) => formatPercentage(value) },
  { key: 'cpc', label: 'CPC', color: '#8dd1e1', formatFn: formatCpc },
  { key: 'cpa', label: 'CPA', color: '#a4de6c', formatFn: formatCpa },
  { key: 'convRate', label: 'Conv. Rate', color: '#d0ed57', formatFn: (value) => formatPercentage(value) },
  { key: 'roas', label: 'ROAS', color: '#ffc658', formatFn: formatRoas },
  { key: 'clv', label: 'CLV', color: '#ba68c8', formatFn: formatClv }
];

interface ChartDataItem extends TrendData {
  isForecast?: boolean;
  [key: string]: any;
}

// Helper function to get the last ISO week of a year
const getLastISOWeekOfYear = (year: number): number => {
  // Get December 31 of the year
  const lastDay = new Date(year, 11, 31);
  const isoWeek = getISOWeek(lastDay);
  
  // If the last day belongs to week 1 of next year, get week before
  if (isoWeek.year > year) {
    // Get December 24 (which is guaranteed to be in the last week of the year)
    const dec24 = new Date(year, 11, 24);
    return getISOWeek(dec24).week;
  }
  
  return isoWeek.week;
};

export const TrendsDashboard = () => {
  const { trendData, completeTrendData, timeUnit, dateRange } = useData();
  
  const [tableMetric, setTableMetric] = useState<MetricType>('revenue');
  const [activeView, setActiveView] = useState<'graphs' | 'table' | 'comparison'>('graphs');
  
  // Filter out data that might be outside the selected year range
  const filteredTrendData = useMemo(() => {
    if (!dateRange.endDate) return trendData;
    
    // Get the end year from the date range
    const endDateYear = new Date(dateRange.endDate).getFullYear();
    
    // Filter out data from later years
    return trendData.filter(item => {
      const periodParts = item.period.split('-');
      const periodYear = parseInt(periodParts[0], 10);
      return periodYear <= endDateYear;
    });
  }, [trendData, dateRange]);
  
  if (filteredTrendData.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center text-gray-500">Loading trend data...</p>
      </div>
    );
  }
  
  // Check if metric is available in TrendData
  const isAvailableMetric = (metric: MetricType) => {
    return trendData.length > 0 && metric in trendData[0];
  };
  
  // Calculate period-over-period changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Simplified placeholder for anomaly detection
  const getMetricAnomalies = (metric: MetricType) => {
    return [] as Array<{ period: string; value: number; deviation: number }>; // Since we removed detectAnomalies, return empty array
  };
  
  // Format value based on metric type
  const formatMetricValue = (metric: MetricType, value: number): string => {
    if (['cost', 'revenue', 'profit'].includes(metric)) {
      return formatCurrency(value);
    } else if (metric === 'cpc') {
      return formatCpc(value);
    } else if (metric === 'cpa') {
      return formatCpa(value);
    } else if (['ctr', 'convRate'].includes(metric)) {
      return formatPercentage(value, 2);
    } else if (metric === 'roas') {
      return formatRoas(value);
    } else if (metric === 'clv') {
      return formatClv(value);
    } else {
      return formatNumber(value);
    }
  };

  // Format Y-axis based on metric type
  const formatYAxisMetric = (value: number, metric: MetricType) => {
    if (metric === 'cost' || metric === 'revenue' || metric === 'profit' || metric === 'clv' || 
        metric === 'cpc' || metric === 'cpa') {
      return formatCompactCurrency(value);
    } else if (metric === 'ctr' || metric === 'convRate') {
      return formatPercentage(value);
    } else if (metric === 'roas') {
      return formatPercentage(value, 2);
    } else {
      return formatCompactNumber(value, 0);
    }
  };
  
  // Function to sort periods from newest to oldest consistently
  const sortPeriodsNewestToOldest = (a: any, b: any) => {
    if (timeUnit === 'Day') {
      // For days, use reverse string comparison (YYYY-MM-DD format)
      return b.period.localeCompare(a.period);
    } else if (timeUnit === 'Week') {
      // Parse year and week for proper numerical comparison
      const [aYear, aWeek] = a.period.split('-');
      const [bYear, bWeek] = b.period.split('-');
      
      // Compare years first (descending)
      if (aYear !== bYear) {
        return parseInt(bYear) - parseInt(aYear);
      }
      
      // Then compare weeks (descending)
      return parseInt(bWeek) - parseInt(aWeek);
    } else if (timeUnit === 'Month') {
      // Parse year and month for proper numerical comparison
      const [aYear, aMonth] = a.period.split('-');
      const [bYear, bMonth] = b.period.split('-');
      
      // Compare years first (descending)
      if (aYear !== bYear) {
        return parseInt(bYear) - parseInt(aYear);
      }
      
      // Then compare months (descending)
      return parseInt(bMonth) - parseInt(aMonth);
    } else if (timeUnit === 'Quarter') {
      // Parse year and quarter for proper comparison
      const [aYear, aQuarter] = a.period.split('-');
      const [bYear, bQuarter] = b.period.split('-');
      
      // Compare years first (descending)
      if (aYear !== bYear) {
        return parseInt(bYear) - parseInt(aYear);
      }
      
      // Extract quarter numbers (Q1, Q2, etc.)
      const aQNum = parseInt(aQuarter.substring(1));
      const bQNum = parseInt(bQuarter.substring(1));
      
      // Compare quarters (descending)
      return bQNum - aQNum;
    }
    
    // For years, simple reverse numerical comparison
    return parseInt(b.period) - parseInt(a.period);
  };
  
  // Function to sort periods from oldest to newest chronologically
  const sortPeriodsOldestToNewest = (a: any, b: any) => {
    if (timeUnit === 'Day') {
      // For days, use direct string comparison (YYYY-MM-DD format)
      return a.period.localeCompare(b.period);
    } else if (timeUnit === 'Week') {
      // Parse year and week for proper numerical comparison
      const [aYear, aWeek] = a.period.split('-');
      const [bYear, bWeek] = b.period.split('-');
      
      // Compare years first (ascending)
      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }
      
      // Then compare weeks (ascending)
      return parseInt(aWeek) - parseInt(bWeek);
    } else if (timeUnit === 'Month') {
      // Parse year and month for proper numerical comparison
      const [aYear, aMonth] = a.period.split('-');
      const [bYear, bMonth] = b.period.split('-');
      
      // Compare years first (ascending)
      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }
      
      // Then compare months (ascending)
      return parseInt(aMonth) - parseInt(bMonth);
    } else if (timeUnit === 'Quarter') {
      // Parse year and quarter for proper comparison
      const [aYear, aQuarter] = a.period.split('-');
      const [bYear, bQuarter] = b.period.split('-');
      
      // Compare years first (ascending)
      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }
      
      // Extract quarter numbers (Q1, Q2, etc.)
      const aQNum = parseInt(aQuarter.substring(1));
      const bQNum = parseInt(bQuarter.substring(1));
      
      // Compare quarters (ascending)
      return aQNum - bQNum;
    }
    
    // For years, simple numerical comparison (ascending)
    return parseInt(a.period) - parseInt(b.period);
  };
  
  // Generate period-over-period comparison table for selected metric
  const generateComparisonTable = () => {
    const metric = isAvailableMetric(tableMetric) ? tableMetric : 'revenue' as AvailableMetric;
    if (filteredTrendData.length < 2) return [];
    
    // First sort trendData chronologically to ensure correct order
    const sortedTrendData = [...filteredTrendData].sort(sortPeriodsOldestToNewest);
    
    const comparisons = [];
    
    // Include all periods, not just starting from the second one
    for (let i = 0; i < sortedTrendData.length; i++) {
      const currentPeriod = sortedTrendData[i];
      
      // Get the current period details
      const currentPeriodParts = currentPeriod.period.split('-');
      const currentYear = parseInt(currentPeriodParts[0]);
      let currentSubPeriod = currentPeriodParts.length > 1 ? currentPeriodParts[1] : '';
      let previousPeriodKey = '';
      
      // Determine the previous period key based on the time unit
      if (timeUnit === 'Day') {
        // For daily data, get the previous day
        const currentDate = new Date(currentPeriod.period);
        const previousDate = new Date(currentDate);
        previousDate.setDate(previousDate.getDate() - 1);
        
        // Format as YYYY-MM-DD
        const year = previousDate.getFullYear();
        const month = (previousDate.getMonth() + 1).toString().padStart(2, '0');
        const day = previousDate.getDate().toString().padStart(2, '0');
        previousPeriodKey = `${year}-${month}-${day}`;
      } else if (timeUnit === 'Week') {
        const currentWeek = parseInt(currentSubPeriod);
        
        if (currentWeek > 1) {
          // Previous week in the same year
          previousPeriodKey = `${currentYear}-${currentWeek - 1}`;
        } else {
          // First week of year - get the last week of previous year
          const lastWeekOfPrevYear = getLastISOWeekOfYear(currentYear - 1);
          previousPeriodKey = `${currentYear - 1}-${lastWeekOfPrevYear}`;
        }
      } else if (timeUnit === 'Month') {
        const currentMonth = parseInt(currentSubPeriod);
        if (currentMonth > 1) {
          // Previous month in the same year
          previousPeriodKey = `${currentYear}-${currentMonth - 1}`;
        } else {
          // December of previous year
          previousPeriodKey = `${currentYear - 1}-12`;
        }
      } else if (timeUnit === 'Quarter') {
        if (currentSubPeriod.startsWith('Q')) {
          const currentQuarter = parseInt(currentSubPeriod.substring(1));
          if (currentQuarter > 1) {
            // Previous quarter in the same year
            previousPeriodKey = `${currentYear}-Q${currentQuarter - 1}`;
          } else {
            // Q4 of previous year
            previousPeriodKey = `${currentYear - 1}-Q4`;
          }
        }
      } else if (timeUnit === 'Year') {
        // Previous year
        previousPeriodKey = `${currentYear - 1}`;
      }
      
      // Find the previous period data
      // First look in sortedTrendData (current filtered data)
      let previousPeriod = i > 0 ? sortedTrendData[i - 1] : null;
      
      // If not found in current view or period doesn't match expected previous period,
      // look in completeTrendData to find the proper previous period
      if (!previousPeriod || previousPeriod.period !== previousPeriodKey) {
        // Look for the exact previous period key in completeTrendData
        const foundPrevPeriod = completeTrendData.find(item => 
          item.period === previousPeriodKey
        );
        
        if (foundPrevPeriod) {
          previousPeriod = foundPrevPeriod;
        } else {
          // For week 1, month 1, or Q1, we need to find the last period of previous year
          if (timeUnit === 'Week') {
            const currentWeek = parseInt(currentSubPeriod);
            if (currentWeek === 1) {
              // For first week of year, look for the last week of previous year
              const lastWeekOfPrevYear = getLastISOWeekOfYear(currentYear - 1);
              const exactWeekKey = `${currentYear - 1}-${lastWeekOfPrevYear}`;
              
              // Try to find the exact last week
              const exactWeek = completeTrendData.find(item => 
                item.period === exactWeekKey
              );
              
              if (exactWeek) {
                previousPeriod = exactWeek;
              } else {
                // Fall back to finding any week from previous year
                const prevYearWeeks = completeTrendData.filter(item => 
                  item.period.startsWith(`${currentYear - 1}-`)
                );
                
                if (prevYearWeeks.length > 0) {
                  // Sort to find the highest week number (last week of the year)
                  prevYearWeeks.sort((a, b) => {
                    const aWeek = parseInt(a.period.split('-')[1]);
                    const bWeek = parseInt(b.period.split('-')[1]);
                    return bWeek - aWeek;
                  });
                  previousPeriod = prevYearWeeks[0];
                }
              }
            }
          }
        }
      }
      
      // For year-over-year comparison, find the same period from last year if available
      let previousYearPeriod = null;
      if (timeUnit === 'Day') {
        // For daily data, create a key for the same day last year
        const currentDate = new Date(currentPeriod.period);
        const previousYearDate = new Date(currentDate);
        previousYearDate.setFullYear(currentDate.getFullYear() - 1);
        
        // Format as YYYY-MM-DD
        const year = previousYearDate.getFullYear();
        const month = (previousYearDate.getMonth() + 1).toString().padStart(2, '0');
        const day = previousYearDate.getDate().toString().padStart(2, '0');
        const previousYearPeriodKey = `${year}-${month}-${day}`;
        
        // Look for the same day from previous year
        previousYearPeriod = sortedTrendData.find(item => item.period === previousYearPeriodKey) || null;
        
        // If not found in the current filtered dataset, look in the complete trend data
        if (!previousYearPeriod && completeTrendData.length > 0) {
          const foundYoYPeriod = completeTrendData.find(item => item.period === previousYearPeriodKey);
          if (foundYoYPeriod) {
            previousYearPeriod = foundYoYPeriod;
          }
        }
      } else if (timeUnit === 'Week' || timeUnit === 'Month' || timeUnit === 'Quarter') {
        // Create a key for the previous year's equivalent period
        const previousYearPeriodKey = `${currentYear - 1}-${currentSubPeriod}`;
        
        // Look for the same subperiod (week, month or quarter) from previous year
        // First check the filtered data (current view)
        previousYearPeriod = sortedTrendData.find(item => item.period === previousYearPeriodKey) || null;
        
        // If not found in the current filtered dataset, look in the complete trend data
        if (!previousYearPeriod && completeTrendData.length > 0) {
          const foundYoYPeriod = completeTrendData.find(item => item.period === previousYearPeriodKey);
          if (foundYoYPeriod) {
            previousYearPeriod = foundYoYPeriod;
            console.log(`Found previous year period in complete data: ${previousYearPeriodKey}`);
          }
        }
      }
      
      const comparison = {
        period: currentPeriod.period,
        current: Number(currentPeriod[metric]) || 0,
        previous: previousPeriod ? Number(previousPeriod[metric]) || 0 : null,
        change: previousPeriod ? calculateChange(Number(currentPeriod[metric]) || 0, Number(previousPeriod[metric]) || 0) : null,
        previousYear: previousYearPeriod ? Number(previousYearPeriod[metric]) || 0 : null,
        yearOverYearChange: previousYearPeriod 
          ? calculateChange(Number(currentPeriod[metric]) || 0, Number(previousYearPeriod[metric]) || 0) 
          : null
      };
      
      comparisons.push(comparison);
    }
    
    // Sort by period in descending order (newest first)
    return comparisons.sort(sortPeriodsNewestToOldest);
  };
  
  const comparisonTable = generateComparisonTable();
  
  // Create a metric chart component
  const MetricChart = ({ metric, title, color = "#8884d8" }: { metric: MetricType; title: string; color?: string }) => {
    // Sort data chronologically for charts (oldest to newest)
    const chartData = [...filteredTrendData].sort(sortPeriodsOldestToNewest);
    const metricName = title || metric.charAt(0).toUpperCase() + metric.slice(1);
    
    return (
      <Card title={`${metricName} Over Time`}>
        <div className="h-80">
          <ZoomableChart title={`${metricName} Over Time`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={COMMON_CHART_MARGIN}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => formatYAxisMetric(value, metric)}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    // Use the specific formatting function based on the metric type
                    if (metric === 'cpc') {
                      return [formatCpc(value as number), metricName];
                    } else if (metric === 'cpa') {
                      return [formatCpa(value as number), metricName];
                    } else if (metric === 'clv') {
                      return [formatClv(value as number), metricName];
                    } else {
                      return [formatMetricValue(metric, value as number), metricName];
                    }
                  }}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={metric}
                  name={metricName}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ZoomableChart>
        </div>
      </Card>
    );
  };
  
  // Define the metrics to display
  const metricOptions: MetricDefinition[] = [
    { key: 'impressions', label: 'Impressions', icon: <FiEye size={16} />, color: CHART_COLORS[0] },
    { key: 'clicks', label: 'Clicks', icon: <FiMousePointer size={16} />, color: CHART_COLORS[1] },
    { key: 'conversions', label: 'Conversions', icon: <FiShoppingCart size={16} />, color: CHART_COLORS[2] },
    { key: 'cost', label: 'Cost', icon: <FiDollarSign size={16} />, color: CHART_COLORS[3] },
    { key: 'revenue', label: 'Revenue', icon: <FiDollarSign size={16} />, color: CHART_COLORS[4] },
    { key: 'profit', label: 'Profit', icon: <FiTrendingUp size={16} />, color: CHART_COLORS[5] },
    { key: 'ctr', label: 'CTR', icon: <FiBarChart2 size={16} />, color: CHART_COLORS[6] },
    { key: 'cpc', label: 'CPC', icon: <FiDollarSign size={16} />, color: CHART_COLORS[7] },
    { key: 'cpa', label: 'CPA', icon: <FiDollarSign size={16} />, color: CHART_COLORS[8] },
    { key: 'convRate', label: 'Conv. Rate', icon: <FiPieChart size={16} />, color: CHART_COLORS[9] },
    { key: 'roas', label: 'ROAS', icon: <FiTrendingUp size={16} />, color: CHART_COLORS[0] },
    { key: 'clv', label: 'CLV', icon: <FiUsers size={16} />, color: CHART_COLORS[1] }
  ];

  // Filter available metrics
  const metrics = metricOptions.filter(metric => isAvailableMetric(metric.key));
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Performance Trends</h2>
      
      {/* Views Selector - styled like the Configuration bar */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-700">Views</h3>
        </div>
        <div className="p-4">
          <div className="bg-gray-100 inline-flex rounded-lg p-1">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeView === 'graphs'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveView('graphs')}
            >
              Trend graphs
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeView === 'table'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveView('table')}
            >
              Simple table view
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeView === 'comparison'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveView('comparison')}
            >
              Period-over-period
            </button>
          </div>
        </div>
      </div>
      
      {/* Metric Charts - shown only when the Trend graphs view is active */}
      {activeView === 'graphs' && (
        <div className="space-y-6">
          {metrics.map((metric) => (
            <MetricChart 
              key={metric.key} 
              metric={metric.key} 
              title={metric.label} 
              color={metric.color} 
            />
          ))}
        </div>
      )}
      
      {/* All Metrics Table - shown in Simple table view */}
      {activeView === 'table' && (
        <Card title="All Metrics Summary">
          <div className="overflow-x-auto">
            <SortableTable
              data={[...filteredTrendData].sort(sortPeriodsNewestToOldest)}
              columns={[
                {
                  key: 'period',
                  header: 'Period',
                  className: 'text-left font-medium text-gray-900'
                },
                {
                  key: 'impressions',
                  header: 'Impressions',
                  className: 'text-right text-gray-500',
                  render: (value) => formatNumber(value)
                },
                {
                  key: 'clicks',
                  header: 'Clicks',
                  className: 'text-right text-gray-500',
                  render: (value) => formatNumber(value)
                },
                {
                  key: 'ctr',
                  header: 'CTR',
                  className: 'text-right text-gray-500',
                  render: (value) => formatPercentage(value)
                },
                {
                  key: 'cpc',
                  header: 'CPC',
                  className: 'text-right text-gray-500',
                  render: (value) => formatCpc(value)
                },
                {
                  key: 'cost',
                  header: 'Cost',
                  className: 'text-right text-gray-500',
                  render: (value) => formatCurrency(value)
                },
                {
                  key: 'conversions',
                  header: 'Conv.',
                  className: 'text-right text-gray-500',
                  render: (value) => formatNumber(value)
                },
                {
                  key: 'cpa',
                  header: 'CPA',
                  className: 'text-right text-gray-500',
                  render: (value) => formatCpa(value)
                },
                {
                  key: 'revenue',
                  header: 'Revenue',
                  className: 'text-right text-gray-500',
                  render: (value) => formatCurrency(value)
                },
                {
                  key: 'profit',
                  header: 'Profit',
                  className: 'text-right text-gray-500',
                  render: (value) => formatCurrency(value)
                },
                {
                  key: 'roas',
                  header: 'ROAS',
                  className: 'text-right text-gray-500',
                  render: (value) => formatRoas(value)
                },
                {
                  key: 'clv',
                  header: 'CLV',
                  className: 'text-right text-gray-500',
                  render: (value) => formatClv(value)
                }
              ]}
            />
          </div>
        </Card>
      )}
      
      {/* Period-over-Period Comparison Table - shown when the Period-over-period view is active */}
      {activeView === 'comparison' && (
        <Card title="Period-over-Period Analysis">
          <div className="mb-4 flex justify-end">
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={tableMetric}
              onChange={(e) => setTableMetric(e.target.value as MetricType)}
            >
              {metricOptions.map(metric => (
                <option key={metric.key} value={metric.key}>{metric.label}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <SortableTable
              data={comparisonTable}
              columns={[
                {
                  key: 'period',
                  header: 'Period',
                  className: 'text-left font-medium text-gray-900'
                },
                {
                  key: 'current',
                  header: 'Current',
                  className: 'text-right text-gray-500',
                  render: (value) => {
                    if (tableMetric === 'cpc') return formatCpc(value);
                    if (tableMetric === 'cpa') return formatCpa(value);
                    if (tableMetric === 'clv') return formatClv(value);
                    return formatMetricValue(tableMetric, value);
                  }
                },
                {
                  key: 'previous',
                  header: 'Previous Period',
                  className: 'text-right text-gray-500',
                  render: (value) => {
                    if (value === null) return 'N/A';
                    if (tableMetric === 'cpc') return formatCpc(value);
                    if (tableMetric === 'cpa') return formatCpa(value);
                    if (tableMetric === 'clv') return formatClv(value);
                    return formatMetricValue(tableMetric, value);
                  }
                },
                {
                  key: 'change',
                  header: 'Change %',
                  className: 'text-right',
                  render: (value, item) => {
                    if (value === null) return 'N/A';
                    
                    // For CPC and CPA metrics, invert the color logic (lower is better)
                    const isCostMetric = tableMetric === 'cpc' || tableMetric === 'cpa';
                    const colorClass = isCostMetric
                      ? (value < 0 ? 'text-green-600' : value > 0 ? 'text-red-600' : 'text-gray-500')
                      : (value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500');
                    
                    return (
                      <span className={colorClass}>
                        {formatPercentage(value / 100)}
                      </span>
                    );
                  }
                },
                ...(timeUnit !== 'Year' ? [
                  {
                    key: 'previousYear',
                    header: 'Previous Year',
                    className: 'text-right text-gray-500',
                    render: (value) => {
                      if (value === null) return 'N/A';
                      if (tableMetric === 'cpc') return formatCpc(value);
                      if (tableMetric === 'cpa') return formatCpa(value);
                      if (tableMetric === 'clv') return formatClv(value);
                      return formatMetricValue(tableMetric, value);
                    }
                  } as Column<any>,
                  {
                    key: 'yearOverYearChange',
                    header: 'YoY Change %',
                    className: 'text-right',
                    render: (value: number | null, item: any) => {
                      if (value === null) return 'N/A';
                      
                      // For CPC and CPA metrics, invert the color logic (lower is better)
                      const isCostMetric = tableMetric === 'cpc' || tableMetric === 'cpa';
                      const colorClass = isCostMetric
                        ? (value < 0 ? 'text-green-600' : value > 0 ? 'text-red-600' : 'text-gray-500')
                        : (value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500');
                      
                      return (
                        <span className={colorClass}>
                          {formatPercentage(value / 100)}
                        </span>
                      );
                    }
                  } as Column<any>
                ] : [])
              ]}
            />
          </div>
        </Card>
      )}
    </div>
  );
}; 