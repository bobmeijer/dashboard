'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { Card } from '../common/Card';
import { StatCard } from '../common/StatCard';
import { 
  FiDollarSign, 
  FiEye, 
  FiMousePointer, 
  FiShoppingCart,
  FiTrendingUp,
  FiBarChart2
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
  generateComparisonData, 
  filterData, 
  formatRoas, 
  formatClv,
  filterByDateRange,
  calculateKpiSummary
} from '@/utils/dataProcessor';
import { SortableTable, Column } from '../common/SortableTable';
import { CHART_COLORS, ROAS_THRESHOLDS, COMMON_CHART_MARGIN } from '@/utils/constants';
import { KpiSummary } from '@/types/data';
import { ExecutiveSummary } from './ExecutiveSummary';

export const ExecutiveDashboard = () => {
  const { 
    kpiSummary, 
    comparisonData, 
    trendData, 
    completeTrendData,
    compareBy, 
    setCompareBy, 
    rawData, 
    selectedFilters,
    filterOptions,
    timeUnit,
    dateRange
  } = useData();
  
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'cost' | 'profit' | 'roas' | 'clv'>('revenue');
  const [showMoreRows, setShowMoreRows] = useState(false);
  const [selectedTrendMetrics, setSelectedTrendMetrics] = useState<{
    revenue: boolean;
    cost: boolean;
    conversions: boolean;
    profit: boolean;
  }>({
    revenue: true,
    cost: true,
    conversions: true,
    profit: true
  });
  
  // Metric options for the trend chart
  const trendMetricOptions = [
    { key: 'revenue', label: 'Revenue', color: '#0088FE' },
    { key: 'cost', label: 'Cost', color: '#FF8042' },
    { key: 'profit', label: 'Profit', color: '#00C49F' },
    { key: 'conversions', label: 'Conversions', color: '#FFBB28' }
  ];
  
  // Toggle selected trend metrics
  const toggleTrendMetric = (metric: keyof typeof selectedTrendMetrics) => {
    setSelectedTrendMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };
  
  // Check if any metric is selected
  const hasSelectedMetrics = Object.values(selectedTrendMetrics).some(value => value);
  
  // Memoize campaign type data to avoid recalculating on each render
  const campaignTypeData = useMemo(() => {
    if (rawData.length === 0) return [];
    
    // Apply the same filters as in the main data context
    const filteredData = filterData(rawData, selectedFilters);
    
    // Generate comparison data specifically for campaign types, using the filtered data
    const campaignTypes = generateComparisonData(filteredData, 'Campaign type');
    return campaignTypes.filter(item => item.name !== '');
  }, [rawData, selectedFilters, timeUnit]); // Dependencies to ensure the table updates when filters change
  
  // Memoize the filtered data sets to avoid recalculating them for each metric
  const filteredDataSets = useMemo(() => {
    // Make sure we have valid data and date range
    if (!rawData.length || !dateRange.startDate || !dateRange.endDate) {
      return { currentPeriodData: null, previousPeriodData: null };
    }
    
    try {
      // Parse the selected date range
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      
      // Calculate the date range duration in days
      const rangeDurationMs = end.getTime() - start.getTime();
      const rangeDurationDays = Math.ceil(rangeDurationMs / (1000 * 60 * 60 * 24)) + 1; // +1 to include the end date
      
      // Calculate the previous period date range
      const previousEnd = new Date(start);
      previousEnd.setDate(previousEnd.getDate() - 1);
      
      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - rangeDurationDays + 1);
      
      // Format dates to string format (YYYY-MM-DD)
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };
      
      const previousStartStr = formatDate(previousStart);
      const previousEndStr = formatDate(previousEnd);
      
      // Filter the data only once for current period
      const currentRawData = filterByDateRange(
        filterData(rawData, selectedFilters),
        { startDate: dateRange.startDate, endDate: dateRange.endDate }
      );
      const currentPeriodData = calculateKpiSummary(currentRawData);
      
      // Filter the data only once for previous period
      const previousRawData = filterByDateRange(
        filterData(rawData, selectedFilters),
        { startDate: previousStartStr, endDate: previousEndStr }
      );
      const previousPeriodData = calculateKpiSummary(previousRawData);
      
      return { currentPeriodData, previousPeriodData };
    } catch (error) {
      console.error("Error calculating filtered data sets:", error);
      return { currentPeriodData: null, previousPeriodData: null };
    }
  }, [rawData, selectedFilters, dateRange]);
  
  // Simplified getTrendChange function that uses the memoized filtered data
  const getTrendChange = useCallback((metric: keyof KpiSummary): number => {
    if (!filteredDataSets.currentPeriodData || !filteredDataSets.previousPeriodData) {
      return 0;
    }
    
    // Get the metric values
    const current = filteredDataSets.currentPeriodData[metric];
    const previous = filteredDataSets.previousPeriodData[metric];
    
    // Calculate the change
    return previous ? (current - previous) : 0;
  }, [filteredDataSets]);
  
  // Memoize trend changes to avoid recalculating them for each StatCard
  const trendChanges = useMemo(() => {
    if (!kpiSummary || !filteredDataSets.currentPeriodData || !filteredDataSets.previousPeriodData) {
      return {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        roas: 0,
        convRate: 0
      };
    }
    
    // Calculate all metrics at once instead of calling getTrendChange multiple times
    return {
      impressions: getTrendChange('impressions'),
      clicks: getTrendChange('clicks'),
      conversions: getTrendChange('conversions'),
      revenue: getTrendChange('revenue'),
      cost: getTrendChange('cost'),
      profit: getTrendChange('profit'),
      roas: getTrendChange('roas'),
      convRate: getTrendChange('convRate')
    };
  }, [kpiSummary, getTrendChange]);
  
  // Memoize the comparison data entities to avoid recreating arrays on each render
  const { topEntities, bottomEntities } = useMemo(() => {
    if (!comparisonData.length) {
      return { topEntities: [], bottomEntities: [] };
    }
    
    const top = [...comparisonData]
      .sort((a, b) => b[selectedMetric] - a[selectedMetric])
      .slice(0, showMoreRows ? 10 : 5);
    
    const bottom = [...comparisonData]
      .sort((a, b) => a[selectedMetric] - b[selectedMetric])
      .slice(0, showMoreRows ? 10 : 5);
      
    return { topEntities: top, bottomEntities: bottom };
  }, [comparisonData, selectedMetric, showMoreRows]);
  
  // Memoize recent trends data
  const recentTrends = useMemo(() => {
    return trendData; // Use all available trend data instead of limiting to 12 periods
  }, [trendData]);
  
  // Column definitions for the campaign type table - memoize to avoid recreating on each render
  const campaignTypeColumns: Column<any>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Campaign Type',
      className: 'text-left font-medium text-gray-900'
    },
    {
      key: 'cost',
      header: 'Cost',
      className: 'text-right text-gray-500',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'revenue',
      header: 'Revenue',
      className: 'text-right text-gray-500',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'roas',
      header: 'ROAS',
      className: 'text-right',
      render: (value) => {
        const roasValue = parseFloat(value);
        return (
          <span className={
            roasValue >= ROAS_THRESHOLDS.HIGH 
              ? 'text-green-600' 
              : roasValue >= ROAS_THRESHOLDS.GOOD 
                ? 'text-blue-600' 
                : 'text-red-600'
          }>
            {formatRoas(roasValue)}
          </span>
        );
      }
    },
    {
      key: 'conversions',
      header: 'Conversions',
      className: 'text-right text-gray-500',
      render: (value) => formatNumber(value)
    },
    {
      key: 'convRate',
      header: 'Conv. Rate',
      className: 'text-right text-gray-500',
      render: (value) => formatPercentage(value, 2)
    }
  ], []);
  
  if (!kpiSummary || comparisonData.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center text-gray-500">Loading data...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <ExecutiveSummary 
        currentPeriod={filteredDataSets.currentPeriodData}
        previousPeriod={filteredDataSets.previousPeriodData}
        dateRange={dateRange}
        kpiSummary={kpiSummary}
        trendChanges={trendChanges}
      />
      
      {/* Performance Trends */}
      <Card title="Performance Trends" className="mt-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {trendMetricOptions.map(metric => (
            <button
              key={metric.key}
              onClick={() => toggleTrendMetric(metric.key as keyof typeof selectedTrendMetrics)}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                selectedTrendMetrics[metric.key as keyof typeof selectedTrendMetrics]
                  ? 'text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={{
                backgroundColor: selectedTrendMetrics[metric.key as keyof typeof selectedTrendMetrics] 
                  ? metric.color 
                  : undefined
              }}
            >
              {metric.label}
            </button>
          ))}
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={recentTrends}
              margin={COMMON_CHART_MARGIN}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                angle={-45} 
                textAnchor="end" 
                tick={{ fontSize: 12 }}
                height={70}
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (['revenue', 'cost', 'profit'].includes(name as string)) {
                    return [formatCurrency(value as number), name];
                  } else if (name === 'roas') {
                    return [formatRoas(value as number), name];
                  } else if (['ctr', 'convRate'].includes(name as string)) {
                    return [formatPercentage(value as number, 2), name];
                  }
                  return [formatNumber(value as number), name];
                }}
              />
              <Legend />
              {selectedTrendMetrics.revenue && (
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {selectedTrendMetrics.cost && (
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="cost" 
                  name="Cost" 
                  stroke="#FF8042" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {selectedTrendMetrics.profit && (
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="profit" 
                  name="Profit" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {selectedTrendMetrics.conversions && (
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="conversions" 
                  name="Conversions" 
                  stroke="#FFBB28" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      {/* Comparison Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Metric Selector */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-800">Performance by {compareBy.replace('_', ' ')}</h3>
            </div>
            <div className="flex space-x-2">
              <select 
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                value={compareBy}
                onChange={(e) => setCompareBy(e.target.value as any)}
              >
                <option value="Account name">Account</option>
                <option value="Language">Language</option>
                <option value="Campaign type">Campaign Type</option>
                <option value="Domain name">Domain</option>
              </select>
              
              <select 
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
              >
                <option value="revenue">Revenue</option>
                <option value="cost">Cost</option>
                <option value="profit">Profit</option>
                <option value="clv">CLV</option>
                <option value="roas">ROAS</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Top Performers */}
        <Card title={`Top Performers by ${selectedMetric.toUpperCase()}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {compareBy.replace('_', ' ')}
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedMetric.toUpperCase()}
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topEntities.map((entity) => {
                  const total = comparisonData.reduce((sum, item) => sum + item[selectedMetric], 0);
                  const percentage = (entity[selectedMetric] / total) * 100;
                  
                  return (
                    <tr key={entity.name}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entity.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                        {selectedMetric === 'roas' 
                          ? formatRoas(entity[selectedMetric])
                          : selectedMetric === 'clv'
                            ? formatClv(entity[selectedMetric])
                            : formatCurrency(entity[selectedMetric])
                        }
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatPercentage(percentage / 100, 1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-3 text-center">
              <button 
                onClick={() => setShowMoreRows(!showMoreRows)} 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showMoreRows ? "Show Less" : "Show More"}
              </button>
            </div>
          </div>
        </Card>
        
        {/* Bottom Performers */}
        <Card title={`Bottom Performers by ${selectedMetric.toUpperCase()}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {compareBy.replace('_', ' ')}
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedMetric.toUpperCase()}
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bottomEntities.map((entity) => {
                  const total = comparisonData.reduce((sum, item) => sum + item[selectedMetric], 0);
                  const percentage = (entity[selectedMetric] / total) * 100;
                  
                  return (
                    <tr key={entity.name}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entity.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                        {selectedMetric === 'roas' 
                          ? formatRoas(entity[selectedMetric])
                          : selectedMetric === 'clv'
                            ? formatClv(entity[selectedMetric])
                            : formatCurrency(entity[selectedMetric])
                        }
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatPercentage(percentage / 100, 1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-3 text-center">
              <button 
                onClick={() => setShowMoreRows(!showMoreRows)} 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showMoreRows ? "Show Less" : "Show More"}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}; 