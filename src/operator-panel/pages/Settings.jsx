import React from 'react';
import { CogIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your operator settings</p>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <CogIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
        <p className="text-gray-600">Settings functionality will be implemented here</p>
      </div>
    </div>
  );
};

export default Settings;
