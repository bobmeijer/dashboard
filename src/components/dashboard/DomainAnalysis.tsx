'use client';

import { useEffect } from 'react';
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
  ComposedChart,
  Line
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
import { CHART_COLORS_SHORT, COMMON_CHART_MARGIN, ROAS_THRESHOLDS } from '@/utils/constants';

export const DomainAnalysis = () => {
  const { comparisonData, setCompareBy } = useData();
  
  // Set compareBy to 'Domain name' when component mounts
  useEffect(() => {
    setCompareBy('Domain name');
  }, [setCompareBy]);
  
  // Use shared color palette from constants
  
  // If data isn't ready yet, show loading
  if (comparisonData.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center text-gray-500">Loading domain data...</p>
      </div>
    );
  }
  
  // Sort domains by revenue
  const sortedDomains = [...comparisonData].sort((a, b) => b.revenue - a.revenue);
  
  // Define columns for the Domain Performance Metrics table
  const domainColumns: Column<any>[] = [
    {
      key: 'domain',
      header: 'Domain',
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
  
  // Calculate metrics by domain for the table
  const metricsByDomain = sortedDomains.map(domain => ({
    domain: domain.name,
    impressions: domain.impressions,
    clicks: domain.clicks,
    cost: domain.cost,
    conversions: domain.conversions,
    convRate: domain.convRate,
    cpa: domain.cpa,
    revenue: domain.revenue,
    profit: domain.profit,
    clv: domain.clv,
    roas: domain.roas
  }));
  
  // Calculate comparative metrics for the bar charts
  const comparativeMetrics = sortedDomains.map(domain => ({
    name: domain.name,
    revenue: domain.revenue,
    cost: domain.cost,
    profit: domain.profit,
    conversions: domain.conversions,
    roas: domain.roas,
    ctr: domain.ctr * 100, // Convert to percentage for better visualization
    convRate: domain.convRate * 100, // Convert to percentage for better visualization
  }));
  
  // Prepare data for the efficiency chart (ROAS + Conv Rate)
  const efficiencyData = sortedDomains.map(domain => ({
    name: domain.name,
    roas: domain.roas,
    convRate: domain.convRate * 100, // Scale for better visualization
    profit: domain.profit,
  }));
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Domain Analysis</h2>
      
      {/* Domain Performance Metrics Table */}
      <Card title="Domain Performance Metrics">
        <SortableTable
          data={metricsByDomain}
          columns={domainColumns}
        />
      </Card>
      
      {/* Domain Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Domain */}
        <Card title="Revenue by Domain">
          <div className="h-80">
            <ZoomableChart title="Revenue by Domain">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sortedDomains}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => entry.name}
                  >
                    {sortedDomains.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS_SHORT[index % CHART_COLORS_SHORT.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ZoomableChart>
          </div>
        </Card>
        
        {/* Profit by Domain */}
        <Card title="Profit by Domain">
          <div className="h-80">
            <ZoomableChart title="Profit by Domain">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparativeMetrics}
                  margin={COMMON_CHART_MARGIN}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 'auto']}
                    tickFormatter={(value) => formatCompactCurrency(value)} 
                  />
                  <Tooltip formatter={(value, name) => [formatCurrency(value as number), name]} />
                  <Legend />
                  <Bar dataKey="profit" fill="#00C49F" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </ZoomableChart>
          </div>
        </Card>
      </div>
      
      {/* Domain Performance Metrics */}
      <Card title="Domain Performance Comparison">
        <div className="h-80">
          <ZoomableChart title="Domain Performance Comparison">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={comparativeMetrics}
                margin={COMMON_CHART_MARGIN}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => formatCompactCurrency(value)}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `${formatCompactNumber(value, 0)}%`}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'revenue' || name === 'cost' || name === 'profit') {
                      return [formatCurrency(value as number), name];
                    } else if (name === 'ctr' || name === 'convRate') {
                      return [formatPercentage(value as number), name];
                    } else if (name === 'roas') {
                      return [formatRoas(value as number), name];
                    } else if (name === 'cpa') {
                      return [formatCpa(value as number), name];
                    }
                    return [formatNumber(value as number), name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#0088FE" name="Revenue" />
                <Bar yAxisId="left" dataKey="cost" fill="#FF8042" name="Cost" />
                <Line yAxisId="right" type="monotone" dataKey="roas" stroke="#8884d8" name="ROAS" />
                <Line yAxisId="right" type="monotone" dataKey="convRate" stroke="#82ca9d" name="Conv. Rate" />
              </ComposedChart>
            </ResponsiveContainer>
          </ZoomableChart>
        </div>
      </Card>
      
      {/* Efficiency Chart */}
      <Card title="Domain Efficiency (ROAS vs. Conversion Rate)">
        <div className="h-80">
          <ZoomableChart title="Domain Efficiency (ROAS vs. Conversion Rate)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={efficiencyData}
                margin={COMMON_CHART_MARGIN}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number"
                  domain={['auto', 'auto']} 
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'roas') {
                      return [formatRoas(value as number), 'ROAS'];
                    } else if (name === 'convRate') {
                      return [formatPercentage(value as number), 'Conv. Rate'];
                    } else if (name === 'profit') {
                      return [formatCurrency(value as number), 'Profit'];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="roas" fill="#8884d8" name="ROAS" />
                <Bar dataKey="convRate" fill="#82ca9d" name="Conv. Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </ZoomableChart>
        </div>
      </Card>
    </div>
  );
}; 