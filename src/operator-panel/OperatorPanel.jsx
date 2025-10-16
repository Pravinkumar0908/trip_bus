import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// Operator Panel Pages
import Dashboard from './pages/Dashboard';
import BusManagement from './pages/BusManagement';
import BookingManagement from './pages/BookingManagement';
import DriverManagement from './pages/DriverManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import BusImage from './pages/BusImage';
import AddPass from './pages/AddPass';



const OperatorPanel = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if operator is logged in
    const operatorToken = localStorage.getItem('operatorToken');
    if (operatorToken) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/operator-panel" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/buses" element={<BusManagement />} />
            <Route path="/bookings" element={<BookingManagement />} />
            <Route path="/drivers" element={<DriverManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/image" element={<BusImage />} />
            <Route path="/addpass" element={<AddPass />} />


          </Routes>
        </main>
      </div>
    </div>
  );
};

export default OperatorPanel;
