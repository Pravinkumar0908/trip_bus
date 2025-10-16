// components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  color = 'red',
  showMessage = true,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6', 
    large: 'w-8 h-8',
    xlarge: 'w-12 h-12'
  };

  const colorClasses = {
    red: 'border-red-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    gray: 'border-gray-500'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div 
        className={`
          animate-spin border-2 ${colorClasses[color]} border-t-transparent rounded-full 
          ${sizeClasses[size]}
        `}
      ></div>
      {showMessage && (
        <p className="text-gray-600 text-sm mt-2 animate-pulse">{message}</p>
      )}
    </div>
  );
};

// Different loading variants
export const SkeletonLoader = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-gray-200 rounded h-4 w-full mb-2"></div>
    <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
    <div className="bg-gray-200 rounded h-4 w-1/2"></div>
  </div>
);

export const BusInfoSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="bg-gray-200 h-6 w-32 rounded"></div>
      <div className="bg-gray-200 h-4 w-16 rounded"></div>
    </div>
    
    <div className="space-y-3">
      <div className="bg-gray-200 h-4 w-full rounded"></div>
      <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
      <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
    </div>
    
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-200 h-8 rounded"></div>
        <div className="bg-gray-200 h-8 rounded"></div>
      </div>
    </div>
  </div>
);

export const SeatLayoutSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="bg-gray-200 h-6 w-24 rounded-full"></div>
      <div className="bg-gray-200 h-4 w-16 rounded"></div>
    </div>
    
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center justify-center gap-4">
          <div className="bg-gray-200 w-5 h-4 rounded"></div>
          <div className="flex gap-2">
            <div className="bg-gray-200 w-10 h-16 rounded"></div>
            <div className="bg-gray-200 w-10 h-16 rounded"></div>
          </div>
          <div className="w-10 h-16"></div>
          <div className="bg-gray-200 w-10 h-16 rounded"></div>
          <div className="bg-gray-200 w-5 h-4 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSpinner;
