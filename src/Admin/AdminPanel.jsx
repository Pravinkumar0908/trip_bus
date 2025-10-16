import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from './components/Admin-Sidebar';
import AdminDashboard from './components/Dashboard';

// Import other components
import OperatorManagement from './components/OperatorManagement';
import BusManagement from './components/BusManagement';
import RouteManagement from './components/RouteManagement';
import BookingManagement from './components/BookingManagement';
import UserManagement from './components/UserManagement';
import Reports from './components/Reports';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import AdminProfile from './components/AdminProfile';

import {
  ShieldCheckIcon,
  BoltIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

const AdminPanel = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Dynamic loading text animation
        const loadingTexts = [
          'Checking Authentication...',
          'Verifying Admin Access...',
          'Loading Dashboard...',
          'Preparing Interface...',
          'Almost Ready...'
        ];

        let textIndex = 0;
        const textInterval = setInterval(() => {
          setLoadingText(loadingTexts[textIndex]);
          textIndex = (textIndex + 1) % loadingTexts.length;
        }, 800);

        // Simulate proper loading time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if admin is logged in
        const adminToken = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminData');
        
        console.log('Admin Token:', adminToken);
        console.log('Admin Data:', adminData);
        
        if (adminToken && adminData) {
          // Additional validation
          const parsedAdminData = JSON.parse(adminData);
          if (parsedAdminData && (parsedAdminData.uid || parsedAdminData.id)) {
            setCurrentAdmin(parsedAdminData);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }

        clearInterval(textInterval);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        // Minimum loading time for smooth UX
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };

    checkAuthentication();
  }, []);

  // Enhanced Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
          </div>
        </div>

        {/* Main Loader Content */}
        <div className="relative z-10 text-center">
          {/* Logo Section */}
          <div className="mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                  <ShieldCheckIcon className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-ping">
                  <BoltIcon className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-2">
              EasyTrip Admin
            </h1>
            <p className="text-gray-300 text-lg">
              Bus Booking Management System
            </p>
          </div>

          {/* Loading Animation */}
          <div className="mb-8">
            <div className="flex justify-center items-center space-x-2 mb-4">
              <TruckIcon className="w-6 h-6 text-red-400 animate-bounce" />
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <TruckIcon className="w-6 h-6 text-red-400 animate-bounce" />
            </div>

            {/* Progress Bar */}
            <div className="w-80 bg-gray-700 rounded-full h-2 mx-auto mb-4">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: '100%', animation: 'loading 3s ease-in-out infinite' }}></div>
            </div>

            {/* Dynamic Loading Text */}
            <p className="text-white text-xl font-semibold animate-pulse">
              {loadingText}
            </p>
          </div>

          {/* Features Preview */}
          <div className="text-center">
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs text-gray-300">Dashboard</div>
                <div className="text-red-400 font-semibold">Ready</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs text-gray-300">Bookings</div>
                <div className="text-green-400 font-semibold">Active</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs text-gray-300">Analytics</div>
                <div className="text-blue-400 font-semibold">Live</div>
              </div>
            </div>
          </div>

          {/* Version Info */}
          <div className="mt-8 text-xs text-gray-400">
            Version 2.0.1 | © 2025 EasyTrip Technologies
          </div>
        </div>

        {/* Custom CSS for animations */}
        <style jsx>{`
          @keyframes loading {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
          
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar 
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      } relative`}>


        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50 relative">
          <div className="h-full">
            <Routes>
              {/* Default route - redirect to dashboard */}
              <Route path="/" element={<Navigate to="/admin-panel/dashboard" replace />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/operators" element={<OperatorManagement />} />
              <Route path="/buses" element={<BusManagement />} />
              <Route path="/routes" element={<RouteManagement />} />
              <Route path="/bookings" element={<BookingManagement />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<AdminProfile />} />
            </Routes>
          </div>
        </main>


      </div>
    </div>
  );
};

export default AdminPanel;
