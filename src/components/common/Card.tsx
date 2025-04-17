'use client';

import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export const Card = ({ title, children, className = '' }: CardProps) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}; 