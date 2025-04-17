'use client';

import { useState } from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

export type Column<T> = {
  key: keyof T;
  header: string;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

type SortDirection = 'asc' | 'desc' | 'none';

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  emptyMessage?: string;
}

export function SortableTable<T>({ 
  data, 
  columns, 
  className = '',
  emptyMessage = 'No data available' 
}: SortableTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: SortDirection;
  } | null>(null);

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;
    
    if (direction === 'none') return 0;
    
    const valueA = a[key];
    const valueB = b[key];
    
    // Handle string comparison
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return direction === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    // Handle number comparison
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return direction === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    }
    
    // If types don't match or are not sortable, maintain original order
    return 0;
  });

  const handleSort = (key: keyof T) => {
    setSortConfig((prevSortConfig) => {
      if (!prevSortConfig || prevSortConfig.key !== key) {
        return { key, direction: 'asc' };
      }
      
      const nextDirections: Record<SortDirection, SortDirection> = {
        asc: 'desc',
        desc: 'none',
        none: 'asc'
      };
      
      return {
        key,
        direction: nextDirections[prevSortConfig.direction]
      };
    });
  };

  const getSortIcon = (key: keyof T) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <FiChevronUp className="opacity-30" />;
    }
    
    if (sortConfig.direction === 'asc') {
      return <FiChevronUp className="text-primary" />;
    }
    
    if (sortConfig.direction === 'desc') {
      return <FiChevronDown className="text-primary" />;
    }
    
    return <FiChevronUp className="opacity-30" />;
  };

  if (data.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key as string} 
                className={`px-4 py-3 text-left text-xs font-medium tracking-wider ${column.className || ''} ${column.sortable !== false ? 'cursor-pointer' : ''}`}
                onClick={column.sortable !== false ? () => handleSort(column.key) : undefined}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  {column.sortable !== false && (
                    <span className="inline-flex">
                      {getSortIcon(column.key)}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map((column) => (
                <td 
                  key={column.key as string} 
                  className={`px-4 py-2 whitespace-nowrap text-sm ${column.className || ''}`}
                >
                  {column.render 
                    ? column.render(item[column.key], item)
                    : item[column.key] as React.ReactNode
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 