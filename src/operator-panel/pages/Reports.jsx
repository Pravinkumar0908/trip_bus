import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const Reports = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">View detailed reports and analytics</p>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
        <p className="text-gray-600">Reports and analytics functionality will be implemented here</p>
      </div>
    </div>
  );
};

export default Reports;
