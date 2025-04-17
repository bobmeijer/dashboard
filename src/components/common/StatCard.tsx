'use client';

import { ReactNode } from 'react';
import { Card } from './Card';
import { formatNumber, formatCurrency, formatPercentage, formatRoas } from '@/utils/dataProcessor';

interface StatCardProps {
  title: string;
  value: number;
  icon?: ReactNode;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percentage' | 'roas';
  decimals?: number;
  currency?: string;
  className?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  icon, 
  previousValue, 
  format = 'number',
  decimals = 0,
  currency = '€',
  className = ''
}: StatCardProps) => {
  // Calculate percentage change
  const percentChange = previousValue 
    ? ((value - previousValue) / previousValue) * 100 
    : 0;
  
  // Format the value based on type
  let formattedValue;
  if (format === 'currency') {
    formattedValue = formatCurrency(value);
  } else if (format === 'percentage') {
    formattedValue = formatPercentage(value, decimals);
  } else if (format === 'roas') {
    formattedValue = formatRoas(value);
  } else {
    formattedValue = formatNumber(value, decimals);
  }
    
  // Determine if change is positive or negative
  const isPositive = percentChange > 0;
  const isNegative = percentChange < 0;
  
  return (
    <Card className={`${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-800">{formattedValue}</p>
        </div>
        {icon && <div className="p-2 bg-blue-50 rounded-full text-blue-500">{icon}</div>}
      </div>
      
      {previousValue !== undefined && (
        <div className="mt-3">
          <span 
            className={`text-sm font-medium ${
              isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            {isPositive && '+'}{formatNumber(percentChange, 1)}%
          </span>
          <span className="text-sm text-gray-500 ml-1">vs previous period</span>
        </div>
      )}
    </Card>
  );
}; 