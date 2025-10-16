import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  DocumentTextIcon,
  ChartBarIcon,
  DocumentDownloadIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  TruckIcon,
  TicketIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    totalUsers: 0,
    totalOperators: 0,
    approvedOperators: 0,
    pendingOperators: 0,
    totalBuses: 0,
    activeBuses: 0,
    inactiveBuses: 0,
    totalBookings: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalRevenue: 0,
    totalPassengers: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    totalAdmins: 0,
    verifiedUsers: 0
  });
  
  const [dateRange, setDateRange] = useState('all');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [detailedData, setDetailedData] = useState({
    users: [],
    operators: [],
    buses: [],
    payments: [],
    passengers: [],
    drivers: [],
    admins: []
  });

  useEffect(() => {
    // Check authentication
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      navigate('/admin-login');
      return;
    }

    fetchReportData();
  }, [navigate, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch all collections in parallel
      const [
        usersSnapshot,
        operatorsSnapshot,
        busesSnapshot,
        paymentsSnapshot,
        passengersSnapshot,
        driversSnapshot,
        adminsSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'operators')),
        getDocs(collection(db, 'buses')),
        getDocs(collection(db, 'payments')),
        getDocs(collection(db, 'passengerInfo')),
        getDocs(collection(db, 'drivers')),
        getDocs(collection(db, 'admins'))
      ]);

      // Process users data
      const users = [];
      let verifiedUsers = 0;
      usersSnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        users.push(userData);
        if (userData.emailVerified) verifiedUsers++;
      });

      // Process operators data
      const operators = [];
      let approvedOperators = 0;
      let pendingOperators = 0;
      operatorsSnapshot.forEach((doc) => {
        const operatorData = { id: doc.id, ...doc.data() };
        operators.push(operatorData);
        
        if (operatorData.status === 'approved') approvedOperators++;
        else if (operatorData.status === 'pending') pendingOperators++;
      });

      // Process buses data
      const buses = [];
      let activeBuses = 0;
      let inactiveBuses = 0;
      busesSnapshot.forEach((doc) => {
        const busData = { id: doc.id, ...doc.data() };
        buses.push(busData);
        
        if (busData.isActive) activeBuses++;
        else inactiveBuses++;
      });

      // Process payments data
      const payments = [];
      let completedPayments = 0;
      let pendingPayments = 0;
      let failedPayments = 0;
      let totalRevenue = 0;
      
      paymentsSnapshot.forEach((doc) => {
        const paymentData = { id: doc.id, ...doc.data() };
        payments.push(paymentData);
        
        if (paymentData.paymentStatus === 'completed') {
          completedPayments++;
          totalRevenue += paymentData.totalAmount || 0;
        } else if (paymentData.paymentStatus === 'pending') {
          pendingPayments++;
        } else if (paymentData.paymentStatus === 'failed') {
          failedPayments++;
        }
      });

      // Process passengers data
      const passengers = [];
      passengersSnapshot.forEach((doc) => {
        passengers.push({ id: doc.id, ...doc.data() });
      });

      // Process drivers data
      const drivers = [];
      let activeDrivers = 0;
      driversSnapshot.forEach((doc) => {
        const driverData = { id: doc.id, ...doc.data() };
        drivers.push(driverData);
        
        if (driverData.status === 'active') activeDrivers++;
      });

      // Process admins data
      const admins = [];
      adminsSnapshot.forEach((doc) => {
        admins.push({ id: doc.id, ...doc.data() });
      });

      // Update state with aggregated data
      setReportData({
        totalUsers: users.length,
        totalOperators: operators.length,
        approvedOperators,
        pendingOperators,
        totalBuses: buses.length,
        activeBuses,
        inactiveBuses,
        totalBookings: payments.length,
        completedPayments,
        pendingPayments,
        failedPayments,
        totalRevenue,
        totalPassengers: passengers.length,
        totalDrivers: drivers.length,
        activeDrivers,
        totalAdmins: admins.length,
        verifiedUsers
      });

      setDetailedData({
        users,
        operators,
        buses,
        payments,
        passengers,
        drivers,
        admins
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Users', reportData.totalUsers],
      ['Verified Users', reportData.verifiedUsers],
      ['Total Operators', reportData.totalOperators],
      ['Approved Operators', reportData.approvedOperators],
      ['Pending Operators', reportData.pendingOperators],
      ['Total Buses', reportData.totalBuses],
      ['Active Buses', reportData.activeBuses],
      ['Inactive Buses', reportData.inactiveBuses],
      ['Total Bookings', reportData.totalBookings],
      ['Completed Payments', reportData.completedPayments],
      ['Pending Payments', reportData.pendingPayments],
      ['Failed Payments', reportData.failedPayments],
      ['Total Revenue (₹)', reportData.totalRevenue],
      ['Total Passengers', reportData.totalPassengers],
      ['Total Drivers', reportData.totalDrivers],
      ['Active Drivers', reportData.activeDrivers],
      ['Total Admins', reportData.totalAdmins]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `easytrip_reports_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 hover:border-red-500/40 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-600 bg-opacity-20`}>
          <Icon className={`w-8 h-8 text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full flex items-center justify-center">
        <div className="text-white text-xl">Loading Reports...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <DocumentTextIcon className="w-8 h-8 mr-3 text-red-400" />
            Comprehensive Reports
          </h1>
          <p className="text-gray-300">
            Complete overview of all platform activities and statistics
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="overview">Overview</option>
                <option value="users">User Reports</option>
                <option value="operators">Operator Reports</option>
                <option value="buses">Bus Reports</option>
                <option value="bookings">Booking Reports</option>
                <option value="revenue">Revenue Reports</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={reportData.totalUsers.toLocaleString()}
            subtitle={`${reportData.verifiedUsers} verified`}
            icon={UserGroupIcon}
            color="blue"
          />
          <StatCard
            title="Total Operators"
            value={reportData.totalOperators.toLocaleString()}
            subtitle={`${reportData.approvedOperators} approved`}
            icon={BuildingOfficeIcon}
            color="green"
          />
          <StatCard
            title="Total Buses"
            value={reportData.totalBuses.toLocaleString()}
            subtitle={`${reportData.activeBuses} active`}
            icon={TruckIcon}
            color="purple"
          />
          <StatCard
            title="Total Bookings"
            value={reportData.totalBookings.toLocaleString()}
            subtitle={`${reportData.completedPayments} completed`}
            icon={TicketIcon}
            color="yellow"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`₹${(reportData.totalRevenue / 100000).toFixed(1)}L`}
            subtitle="From completed bookings"
            icon={CurrencyRupeeIcon}
            color="green"
          />
          <StatCard
            title="Total Passengers"
            value={reportData.totalPassengers.toLocaleString()}
            subtitle="Individual passenger records"
            icon={UserGroupIcon}
            color="blue"
          />
          <StatCard
            title="Total Drivers"
            value={reportData.totalDrivers.toLocaleString()}
            subtitle={`${reportData.activeDrivers} active`}
            icon={TruckIcon}
            color="indigo"
          />
          <StatCard
            title="Platform Health"
            value={`${Math.round((reportData.completedPayments / reportData.totalBookings) * 100)}%`}
            subtitle="Success rate"
            icon={CheckCircleIcon}
            color="green"
          />
        </div>

        {/* Detailed Statistics */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 mb-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <ChartBarIcon className="w-6 h-6 mr-2 text-red-400" />
            Detailed Statistics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Users Stats */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">User Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Users:</span>
                  <span className="text-white">{reportData.totalUsers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Verified Users:</span>
                  <span className="text-green-400">{reportData.verifiedUsers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Unverified Users:</span>
                  <span className="text-yellow-400">{reportData.totalUsers - reportData.verifiedUsers}</span>
                </div>
              </div>
            </div>

            {/* Operators Stats */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Operator Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Operators:</span>
                  <span className="text-white">{reportData.totalOperators}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Approved:</span>
                  <span className="text-green-400">{reportData.approvedOperators}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Pending:</span>
                  <span className="text-yellow-400">{reportData.pendingOperators}</span>
                </div>
              </div>
            </div>

            {/* Bus Stats */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Bus Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Buses:</span>
                  <span className="text-white">{reportData.totalBuses}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Active:</span>
                  <span className="text-green-400">{reportData.activeBuses}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Inactive:</span>
                  <span className="text-red-400">{reportData.inactiveBuses}</span>
                </div>
              </div>
            </div>

            {/* Payment Stats */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Payment Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Bookings:</span>
                  <span className="text-white">{reportData.totalBookings}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Completed:</span>
                  <span className="text-green-400">{reportData.completedPayments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Pending:</span>
                  <span className="text-yellow-400">{reportData.pendingPayments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Failed:</span>
                  <span className="text-red-400">{reportData.failedPayments}</span>
                </div>
              </div>
            </div>

            {/* Revenue Stats */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Revenue Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Revenue:</span>
                  <span className="text-green-400">₹{reportData.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg Per Booking:</span>
                  <span className="text-white">₹{reportData.completedPayments > 0 ? Math.round(reportData.totalRevenue / reportData.completedPayments) : 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-white">{reportData.totalBookings > 0 ? Math.round((reportData.completedPayments / reportData.totalBookings) * 100) : 0}%</span>
                </div>
              </div>
            </div>

            {/* Driver Stats */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Driver Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Drivers:</span>
                  <span className="text-white">{reportData.totalDrivers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Active:</span>
                  <span className="text-green-400">{reportData.activeDrivers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Inactive:</span>
                  <span className="text-red-400">{reportData.totalDrivers - reportData.activeDrivers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <ClockIcon className="w-6 h-6 mr-2 text-red-400" />
            Platform Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-600/20 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{Math.round((reportData.completedPayments / reportData.totalBookings) * 100)}%</div>
              <div className="text-sm text-gray-300">Payment Success Rate</div>
            </div>
            
            <div className="text-center p-4 bg-blue-600/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{Math.round((reportData.verifiedUsers / reportData.totalUsers) * 100)}%</div>
              <div className="text-sm text-gray-300">User Verification Rate</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-600/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{Math.round((reportData.activeBuses / reportData.totalBuses) * 100)}%</div>
              <div className="text-sm text-gray-300">Bus Utilization Rate</div>
            </div>
            
            <div className="text-center p-4 bg-purple-600/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{Math.round((reportData.approvedOperators / reportData.totalOperators) * 100)}%</div>
              <div className="text-sm text-gray-300">Operator Approval Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
