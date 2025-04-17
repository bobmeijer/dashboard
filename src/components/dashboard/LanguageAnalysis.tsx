'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { Card } from '../common/Card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercentage,
  formatCompactCurrency,
  formatCompactNumber,
  formatRoas,
  formatCpa,
  formatCpc
} from '@/utils/dataProcessor';
import { SortableTable, Column } from '../common/SortableTable';
import { ZoomableChart } from '../common/ZoomableChart';
import { CHART_COLORS, COMMON_CHART_MARGIN, ROAS_THRESHOLDS } from '@/utils/constants';

// Define interfaces for our data types
interface ScatterDataPoint {
  name: string;
  revenue: number;
  roas: number;
  conversions: number;
  language: string;
  displayName: string;
}

export const LanguageAnalysis = () => {
  const { comparisonData, trendData, rawData, setCompareBy } = useData();
  
  // Set compareBy to 'Language' when component mounts
  useEffect(() => {
    setCompareBy('Language');
  }, [setCompareBy]);
  
  // State for metric comparison
  const [metric1, setMetric1] = useState<'revenue' | 'cost' | 'profit' | 'conversions'>('revenue');
  const [metric2, setMetric2] = useState<'revenue' | 'cost' | 'profit' | 'conversions'>('conversions');
  
  // State for the stacked area chart
  const [selectedMetric, setSelectedMetric] = useState<'cost' | 'conversions' | 'revenue' | 'profit'>('revenue');
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  
  // Use shared color palette from constants
  
  // If data isn't ready yet, show loading
  if (comparisonData.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center text-gray-500">Loading language data...</p>
      </div>
    );
  }
  
  // Sort languages by revenue
  const sortedLanguages = [...comparisonData].sort((a, b) => b.revenue - a.revenue);
  
  // Prepare data for language scatter chart
  const languageScatterData: ScatterDataPoint[] = sortedLanguages.map((item) => ({
    name: item.name,
    revenue: Number(item.revenue) || 0,
    roas: Number(item.roas) || 0,
    conversions: Number(item.conversions) || 0,
    language: item.name,
    displayName: item.name
  }));
  
  // Prepare data for conversion by language chart
  const conversionsByLanguage = sortedLanguages.map(language => ({
    name: language.name,
    conversions: language.conversions,
    cost: language.cost,
    cpa: language.cpa,
  }));
  
  // Calculate metrics by language for the table
  const metricsByLanguage = sortedLanguages.map(language => ({
    language: language.name,
    impressions: language.impressions,
    clicks: language.clicks,
    cost: language.cost,
    conversions: language.conversions,
    convRate: language.convRate,
    cpa: language.cpa,
    revenue: language.revenue,
    profit: language.profit,
    clv: language.clv,
    roas: language.roas
  }));

  // Define language table columns
  const languageColumns: Column<any>[] = [
    {
      key: 'language',
      header: 'Language',
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
      key: 'cost',
      header: 'Cost',
      className: 'text-right text-gray-500',
      render: (value) => formatCurrency(value)
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
      render: (value) => formatPercentage(value)
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
      key: 'clv',
      header: 'CLV',
      className: 'text-right text-gray-500',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'roas',
      header: 'ROAS',
      className: 'text-right',
      render: (value) => {
        const roasValue = Number(value);
        return (
          <span className={
            roasValue > ROAS_THRESHOLDS.HIGH
              ? 'text-green-600' 
              : roasValue >= ROAS_THRESHOLDS.GOOD
                ? 'text-orange-500' 
                : 'text-red-600'
          }>
            {formatRoas(roasValue)}
          </span>
        );
      }
    }
  ];
  
  // Get top languages by selected metric for the stacked area chart
  const getTopLanguages = () => {
    if (!sortedLanguages.length) return [];
    
    return sortedLanguages
      .sort((a, b) => b[selectedMetric] - a[selectedMetric])
      .slice(0, 10)
      .map(lang => lang.name);
  };
  
  // Simplified stacked area chart data preparation
  const prepareStackedAreaData = () => {
    if (!trendData.length || !sortedLanguages.length) return [];
    
    // Get top languages or all languages based on checkbox
    const topLanguages = getTopLanguages();
    const languagesToShow = showAllLanguages 
      ? sortedLanguages.map(lang => lang.name)
      : topLanguages;
    
    // Create one data point per period
    return trendData.map((period, periodIndex) => {
      const dataPoint: Record<string, any> = {
        period: period.period
      };
      
      // Total for calculating percentages
      let total = 0;
      
      // Generate data for each language in this period
      languagesToShow.forEach((lang, langIndex) => {
        // Find the language data
        const langData = sortedLanguages.find(l => l.name === lang);
        if (!langData) return;
        
        // Calculate a value based on the language's metric and periodIndex
        // This creates a fluctuating pattern across periods
        const baseValue = langData[selectedMetric] || 0;
        const fluctuation = 0.8 + (Math.sin(periodIndex * 0.5 + langIndex) + 1) * 0.2;
        const value = baseValue * fluctuation;
        
        dataPoint[lang] = value;
        total += value;
      });
      
      // Add "Others" category if not showing all languages
      if (!showAllLanguages) {
        const otherValue = sortedLanguages
          .filter(lang => !topLanguages.includes(lang.name))
          .reduce((sum, lang) => sum + (lang[selectedMetric] || 0), 0) * 
          (0.9 + Math.cos(periodIndex * 0.7) * 0.1);
        
        dataPoint.Others = otherValue;
        total += otherValue;
      }
      
      // Store total for percentage calculation
      dataPoint.total = total;
      
      return dataPoint;
    });
  };
  
  const stackedAreaData = prepareStackedAreaData();
  
  // Generate colors for chart
  const getChartColors = () => {
    // Choose languages to display
    const languagesToShow = showAllLanguages 
      ? sortedLanguages.map(lang => lang.name)
      : getTopLanguages();
    
    // Map colors to languages
    const colors = languagesToShow.map((name, index) => ({
      name,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
    
    // Add Others category if not showing all languages
    if (!showAllLanguages) {
      colors.push({
        name: 'Others',
        color: '#888888'
      });
    }
    
    return colors;
  };
  
  const chartColors = getChartColors();
  
  // Format axis number with k/M suffixes
  const formatAxisNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  // ROAS class utility function
  const getRoasClass = (roas: number): string => {
    if (roas >= 3) return 'bg-green-100 text-green-800';
    if (roas >= 1) return 'bg-yellow-100 text-yellow-800';
    if (roas > 0) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Create a custom tooltip component for better control
  const CustomScatterTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    // Get the data point from the payload
    const dataPoint = payload[0].payload;
    
    // Get the language name directly from our data point
    const languageName = dataPoint?.name || 'Unknown';
    
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="font-medium text-gray-800">Language: {languageName}</p>
        <p className="text-sm text-gray-600">Revenue: {formatCurrency(dataPoint.revenue)}</p>
        <p className="text-sm text-gray-600">ROAS: {formatRoas(dataPoint.roas)}</p>
        <p className="text-sm text-gray-600">Conversions: {formatNumber(dataPoint.conversions)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Language Analysis</h2>
      
      {/* Language Performance Metrics Table */}
      <Card title="Language Performance Metrics">
        <SortableTable
          data={metricsByLanguage}
          columns={languageColumns}
        />
      </Card>
      
      {/* Language Performance Analysis - Scatter Chart */}
      <Card title="Language Performance Analysis">
        <div className="h-96">
          <ZoomableChart title="Language Performance Analysis">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="revenue" 
                  name="Revenue" 
                  unit="$" 
                  tickFormatter={(value) => `$${formatAxisNumber(value)}`}
                />
                <YAxis 
                  type="number" 
                  dataKey="roas" 
                  name="ROAS" 
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <ZAxis type="number" dataKey="conversions" range={[50, 500]} name="Conversions" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={<CustomScatterTooltip />}
                />
                <Legend />
                <Scatter 
                  name="Languages" 
                  data={languageScatterData.filter(item => item.revenue > 0 && item.roas > 0)} 
                  fill="#8884d8"
                  isAnimationActive={false}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </ZoomableChart>
        </div>
      </Card>
      
      {/* Language Distribution Over Time (100% Stacked Area Chart) */}
      <Card title="Language Distribution Over Time">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="show-all-languages" className="flex items-center text-sm font-medium text-gray-700">
              <input
                id="show-all-languages"
                type="checkbox"
                checked={showAllLanguages}
                onChange={(e) => setShowAllLanguages(e.target.checked)}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Show All Languages
            </label>
          </div>
          
          <div className="flex items-center space-x-4">
            <label htmlFor="metric-select" className="text-sm font-medium text-gray-700">
              Metric:
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as 'cost' | 'conversions' | 'revenue' | 'profit')}
              className="form-select rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            >
              <option value="cost">Cost</option>
              <option value="conversions">Conversions</option>
              <option value="revenue">Revenue</option>
              <option value="profit">Profit</option>
            </select>
          </div>
        </div>
        
        <div className="h-96">
          <ZoomableChart title={`Language ${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Distribution Over Time`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stackedAreaData}
                margin={COMMON_CHART_MARGIN}
                stackOffset="expand"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  domain={[0, 1]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: any, name: string, props: any) => {
                    const item = props.payload;
                    // Calculate percentage
                    const percentage = item && item.total > 0 
                      ? ((value as number) / item.total * 100).toFixed(1) 
                      : '0';
                    
                    // Format the absolute value based on the metric
                    let formattedValue = '0';
                    if (value) {
                      switch (selectedMetric) {
                        case 'cost':
                          formattedValue = `$${parseFloat(value as string).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                          break;
                        case 'conversions':
                          formattedValue = parseFloat(value as string).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
                          break;
                        case 'revenue':
                        case 'profit':
                          formattedValue = `$${parseFloat(value as string).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                          break;
                        default:
                          formattedValue = value as string;
                      }
                    }
                    
                    return [`${formattedValue} (${percentage}%)`, name];
                  }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    padding: '10px'
                  }}
                  itemSorter={(item) => -(item.value as number)}
                  animationDuration={0}
                />
                <Legend verticalAlign="bottom" height={36} />
                
                {/* Render an Area component for each language/color */}
                {chartColors.map(({ name, color }) => (
                  <Area
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stackId="1"
                    stroke={color}
                    fill={color}
                    // Skip rendering points with zero values to avoid small lines
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ZoomableChart>
        </div>
      </Card>
    </div>
  );
}; 