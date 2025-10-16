import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  TruckIcon,
  MapIcon,
  TicketIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const AdminSidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Permission check function
  const checkPermission = (permission) => {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    return adminData?.permissions?.[permission] || false;
  };

  // Get current admin data
  const getCurrentAdmin = () => {
    return JSON.parse(localStorage.getItem('adminData') || '{}');
  };

  const currentAdmin = getCurrentAdmin();

  const menuItems = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: HomeIcon, 
      path: '/admin-panel/dashboard',
      permission: 'canViewDashboard',
      showToAll: true // Dashboard हमेशा show करें
    },
    { 
      id: 'operators', 
      name: 'Operators', 
      icon: BuildingOfficeIcon, 
      path: '/admin-panel/operators',
      permission: 'canManageOperators'
    },
    { 
      id: 'buses', 
      name: 'All Buses', 
      icon: TruckIcon, 
      path: '/admin-panel/buses',
      permission: 'canManageBuses'
    },
    { 
      id: 'routes', 
      name: 'Routes', 
      icon: MapIcon, 
      path: '/admin-panel/routes',
      permission: 'canManageBuses'
    },
    { 
      id: 'bookings', 
      name: 'All Bookings', 
      icon: TicketIcon, 
      path: '/admin-panel/bookings',
      permission: 'canManageBookings'
    },
    { 
      id: 'users', 
      name: 'Users', 
      icon: UserGroupIcon, 
      path: '/admin-panel/users',
      permission: 'canManageUsers'
    },
    { 
      id: 'reports', 
      name: 'Reports', 
      icon: DocumentChartBarIcon, 
      path: '/admin-panel/reports',
      permission: 'canViewReports'
    },
    { 
      id: 'analytics', 
      name: 'Analytics', 
      icon: ChartBarIcon, 
      path: '/admin-panel/analytics',
      permission: 'canViewLogs'
    },
    { 
      id: 'settings', 
      name: 'Settings', 
      icon: CogIcon, 
      path: '/admin-panel/settings',
      adminOnly: true // सिर्फ Admin को Settings access
    },
    { 
      id: 'profile', 
      name: 'Profile', 
      icon: UserIcon, 
      path: '/admin-panel/profile',
      showToAll: true // Profile हमेशा show करें
    },
  ];

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(item => {
    // Show to all items (Dashboard, Profile)
    if (item.showToAll) return true;
    
    // Admin only items (Settings)
    if (item.adminOnly && currentAdmin.role !== 'admin') return false;
    
    // Permission based items
    if (item.permission) {
      return checkPermission(item.permission);
    }
    
    return true;
  });

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin-login');
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Super Admin';
      case 'co_admin':
        return 'Co-Admin';
      case 'moderator':
        return 'Moderator';
      default:
        return role;
    }
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-green-400 border-green-600 bg-green-600';
      case 'co_admin':
        return 'text-blue-400 border-blue-600 bg-blue-600';
      case 'moderator':
        return 'text-yellow-400 border-yellow-600 bg-yellow-600';
      default:
        return 'text-gray-400 border-gray-600 bg-gray-600';
    }
  };

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 fixed h-full z-50 flex flex-col ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center">
            <ShieldCheckIcon className="w-8 h-8 text-red-400 mr-2" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Admin Info - Fixed */}
      {!isCollapsed && currentAdmin.name && (
        <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <UserIcon className="w-5 h-5 text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentAdmin.name}</p>
              <p className={`text-xs ${getRoleColor(currentAdmin.role).split(' ')[0]} truncate`}>
                {getRoleDisplayName(currentAdmin.role)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Navigation Menu */}
        <nav className="mt-6">
          <ul className="space-y-2 px-3">
            {filteredMenuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                    title={isCollapsed ? item.name : ''}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="ml-3 transition-opacity duration-300">
                        {item.name}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Admin Badge */}
        {!isCollapsed && currentAdmin.role && (
          <div className="px-6 mt-6">
            <div className={`${getRoleColor(currentAdmin.role).split(' ')[2]} bg-opacity-20 border ${getRoleColor(currentAdmin.role).split(' ')[1]} rounded-lg p-3`}>
              <div className="flex items-center">
                <ShieldCheckIcon className={`w-5 h-5 ${getRoleColor(currentAdmin.role).split(' ')[0]} mr-2`} />
                <div className="flex-1">
                  <span className={`text-sm ${getRoleColor(currentAdmin.role).split(' ')[0]} font-medium block`}>
                    {getRoleDisplayName(currentAdmin.role)} Access
                  </span>
                  {currentAdmin.adminCode && (
                    <span className="text-xs text-gray-400 font-mono">
                      {currentAdmin.adminCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Access Info */}
        {!isCollapsed && (
          <div className="px-6 mt-4 mb-6">
            <div className="text-xs text-gray-400">
              <div className="mb-1">Available Sections: {filteredMenuItems.length}</div>
              {currentAdmin.role === 'admin' && (
                <div className="text-green-400">✅ Full System Access (All 10 Sections)</div>
              )}
              {currentAdmin.role === 'co_admin' && (
                <div className="text-blue-400">✅ Senior Access (9/10 Sections - No Settings)</div>
              )}
              {currentAdmin.role === 'moderator' && (
                <div className="text-yellow-400">⚠️ Limited Access (Bookings Only)</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section - Fixed */}
      <div className="flex-shrink-0">
        {/* Logout Button */}
        <div className="px-3 py-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
            title={isCollapsed ? 'Logout' : ''}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="ml-3">Logout</span>
            )}
          </button>
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="px-4 pb-4">
            <div className="text-xs text-gray-400 text-center">
              © 2025 EasyTrip Admin
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;
