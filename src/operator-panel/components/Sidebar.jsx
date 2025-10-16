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
} from '@heroicons/react/24/outline';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon, path: '/operator-panel/dashboard' },
    { id: 'buses', name: 'Bus Management', icon: TruckIcon, path: '/operator-panel/buses' },
    { id: 'bookings', name: 'Bookings', icon: TicketIcon, path: '/operator-panel/bookings' },
    { id: 'drivers', name: 'Drivers', icon: UserGroupIcon, path: '/operator-panel/drivers' },
    { id: 'profile', name: 'Profile', icon: UserIcon, path: '/operator-panel/profile' },
    { id: 'image', name: 'Add Image', icon: UserIcon, path: '/operator-panel/image' },
    { id: 'pass', name: 'Add Pass', icon: UserIcon, path: '/operator-panel/addpass' },


  ];

  const handleLogout = () => {
    localStorage.removeItem('operatorToken');
    navigate('/operator-login');
  };

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 fixed h-full z-50 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center">
            <TruckIcon className="w-8 h-8 text-blue-400 mr-2" />
            <h1 className="text-xl font-bold">Easy Trip</h1>
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

      {/* Navigation Menu */}
      <nav className="mt-6">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
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

      {/* Logout Button */}
      <div className="absolute bottom-16 left-3 right-3">
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
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-gray-400 text-center">
            © 2025 EasyTrip.com
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
