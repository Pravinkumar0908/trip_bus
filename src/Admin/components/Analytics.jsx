import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  TruckIcon,
  TicketIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  ChartPieIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    users: { total: 0, verified: 0, growth: 0 },
    operators: { total: 0, approved: 0, pending: 0, growth: 0 },
    buses: { total: 0, active: 0, inactive: 0, utilization: 0 },
    bookings: { total: 0, completed: 0, pending: 0, failed: 0, todayCount: 0 },
    payments: { totalRevenue: 0, avgBooking: 0, successRate: 0, todayRevenue: 0 },
    drivers: { total: 0, active: 0, inactive: 0 },
    trends: {
      userGrowth: [],
      revenueGrowth: [],
      bookingTrends: [],
      operatorGrowth: []
    }
  });

  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    // Check authentication
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      navigate('/admin-login');
      return;
    }

    fetchAnalyticsData();
  }, [navigate, timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch all collections
      const [
        usersSnapshot,
        operatorsSnapshot,
        busesSnapshot,
        paymentsSnapshot,
        passengersSnapshot,
        driversSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'operators')),
        getDocs(collection(db, 'buses')),
        getDocs(collection(db, 'payments')),
        getDocs(collection(db, 'passengerInfo')),
        getDocs(collection(db, 'drivers'))
      ]);

      // Process Users Data
      const users = [];
      let verifiedUsers = 0;
      usersSnapshot.forEach(doc => {
        const userData = { id: doc.id, ...doc.data() };
        users.push(userData);
        if (userData.emailVerified) verifiedUsers++;
      });

      // Process Operators Data
      const operators = [];
      let approvedOperators = 0;
      let pendingOperators = 0;
      operatorsSnapshot.forEach(doc => {
        const operatorData = { id: doc.id, ...doc.data() };
        operators.push(operatorData);
        if (operatorData.status === 'approved') approvedOperators++;
        else if (operatorData.status === 'pending') pendingOperators++;
      });

      // Process Buses Data
      const buses = [];
      let activeBuses = 0;
      let inactiveBuses = 0;
      busesSnapshot.forEach(doc => {
        const busData = { id: doc.id, ...doc.data() };
        buses.push(busData);
        if (busData.isActive) activeBuses++;
        else inactiveBuses++;
      });

      // Process Payments Data
      const payments = [];
      let completedPayments = 0;
      let pendingPayments = 0;
      let failedPayments = 0;
      let totalRevenue = 0;
      let todayRevenue = 0;
      let todayBookings = 0;

      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      paymentsSnapshot.forEach(doc => {
        const paymentData = { id: doc.id, ...doc.data() };
        payments.push(paymentData);

        const paymentDate = paymentData.createdAt?.toDate();
        if (paymentDate && paymentDate >= todayStart && paymentDate <= todayEnd) {
          todayBookings++;
          if (paymentData.paymentStatus === 'completed') {
            todayRevenue += paymentData.totalAmount || 0;
          }
        }

        if (paymentData.paymentStatus === 'completed') {
          completedPayments++;
          totalRevenue += paymentData.totalAmount || 0;
        } else if (paymentData.paymentStatus === 'pending') {
          pendingPayments++;
        } else if (paymentData.paymentStatus === 'failed') {
          failedPayments++;
        }
      });

      // Process Drivers Data
      const drivers = [];
      let activeDrivers = 0;
      driversSnapshot.forEach(doc => {
        const driverData = { id: doc.id, ...doc.data() };
        drivers.push(driverData);
        if (driverData.status === 'active') activeDrivers++;
      });

      // Calculate trends (mock data for demo - replace with actual historical data)
      const userGrowthTrend = generateTrendData(users.length, 'growth');
      const revenueTrend = generateTrendData(totalRevenue, 'revenue');
      const bookingTrend = generateTrendData(payments.length, 'bookings');
      const operatorTrend = generateTrendData(operators.length, 'operators');

      setAnalyticsData({
        users: {
          total: users.length,
          verified: verifiedUsers,
          growth: calculateGrowth(users.length, users.length - 120) // Mock previous period
        },
        operators: {
          total: operators.length,
          approved: approvedOperators,
          pending: pendingOperators,
          growth: calculateGrowth(operators.length, operators.length - 50)
        },
        buses: {
          total: buses.length,
          active: activeBuses,
          inactive: inactiveBuses,
          utilization: buses.length > 0 ? Math.round((activeBuses / buses.length) * 100) : 0
        },
        bookings: {
          total: payments.length,
          completed: completedPayments,
          pending: pendingPayments,
          failed: failedPayments,
          todayCount: todayBookings
        },
        payments: {
          totalRevenue,
          avgBooking: completedPayments > 0 ? Math.round(totalRevenue / completedPayments) : 0,
          successRate: payments.length > 0 ? Math.round((completedPayments / payments.length) * 100) : 0,
          todayRevenue
        },
        drivers: {
          total: drivers.length,
          active: activeDrivers,
          inactive: drivers.length - activeDrivers
        },
        trends: {
          userGrowth: userGrowthTrend,
          revenueGrowth: revenueTrend,
          bookingTrends: bookingTrend,
          operatorGrowth: operatorTrend
        }
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = (currentValue, type) => {
    const periods = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const baseValue = currentValue * 0.7; // Start from 70% of current value
    
    return periods.map((period, index) => ({
      period,
      value: Math.round(baseValue + (currentValue - baseValue) * (index / (periods.length - 1))),
      growth: index > 0 ? Math.round(Math.random() * 20 - 10) : 0 // Random growth between -10% to +10%
    }));
  };

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  };

  const AnimatedCard = ({ title, value, subtitle, icon: Icon, color, trend, onClick, isSelected }) => (
    <div 
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 ${
        isSelected ? 'border-red-500 shadow-lg shadow-red-500/30' : 'border-red-500/20 hover:border-red-500/40'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1 animate-pulse">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              trend >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend >= 0 ? (
                <ArrowUpIcon className="w-4 h-4 mr-1 animate-bounce" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 mr-1 animate-bounce" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-600 bg-opacity-20 animate-pulse`}>
          <Icon className={`w-8 h-8 text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  const TrendChart = ({ data, title, color }) => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="flex items-end justify-between h-32 space-x-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className={`w-full bg-${color}-500 rounded-t-md transition-all duration-1000 ease-out animate-pulse`}
              style={{ 
                height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`,
                minHeight: '4px',
                animationDelay: `${index * 100}ms`
              }}
            ></div>
            <p className="text-xs text-gray-400 mt-2">{item.period}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const CircularProgress = ({ percentage, title, color }) => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-700"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
            className={`text-${color}-500 transition-all duration-2000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white animate-pulse">{percentage}%</span>
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-2">{title}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading Analytics...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <ChartBarIcon className="w-8 h-8 mr-3 text-red-400 animate-pulse" />
            Advanced Analytics Dashboard
          </h1>
          <p className="text-gray-300">
            Real-time insights and trends from your EasyTrip platform
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              >
                <option value="overview">Overview</option>
                <option value="users">User Analytics</option>
                <option value="revenue">Revenue Analytics</option>
                <option value="operations">Operations</option>
                <option value="trends">Trends</option>
              </select>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="text-right">
              <p className="text-gray-400 text-sm">Last Updated</p>
              <p className="text-white text-sm">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnimatedCard
            title="Total Users"
            value={analyticsData.users.total.toLocaleString()}
            subtitle={`${analyticsData.users.verified.toLocaleString()} verified`}
            icon={UserGroupIcon}
            color="blue"
            trend={analyticsData.users.growth}
            onClick={() => setSelectedMetric('users')}
            isSelected={selectedMetric === 'users'}
          />
          <AnimatedCard
            title="Total Revenue"
            value={`₹${(analyticsData.payments.totalRevenue / 100000).toFixed(1)}L`}
            subtitle={`₹${analyticsData.payments.avgBooking} avg booking`}
            icon={CurrencyRupeeIcon}
            color="green"
            trend={15.7}
            onClick={() => setSelectedMetric('revenue')}
            isSelected={selectedMetric === 'revenue'}
          />
          <AnimatedCard
            title="Total Bookings"
            value={analyticsData.bookings.total.toLocaleString()}
            subtitle={`${analyticsData.bookings.todayCount} today`}
            icon={TicketIcon}
            color="yellow"
            trend={12.3}
            onClick={() => setSelectedMetric('operations')}
            isSelected={selectedMetric === 'operations'}
          />
          <AnimatedCard
            title="Platform Health"
            value={`${analyticsData.payments.successRate}%`}
            subtitle="Success rate"
            icon={CheckCircleIcon}
            color="green"
            trend={2.1}
            onClick={() => setSelectedMetric('trends')}
            isSelected={selectedMetric === 'trends'}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnimatedCard
            title="Total Operators"
            value={analyticsData.operators.total.toLocaleString()}
            subtitle={`${analyticsData.operators.approved} approved`}
            icon={BuildingOfficeIcon}
            color="purple"
            trend={analyticsData.operators.growth}
          />
          <AnimatedCard
            title="Total Buses"
            value={analyticsData.buses.total.toLocaleString()}
            subtitle={`${analyticsData.buses.active} active`}
            icon={TruckIcon}
            color="indigo"
            trend={8.5}
          />
          <AnimatedCard
            title="Total Drivers"
            value={analyticsData.drivers.total.toLocaleString()}
            subtitle={`${analyticsData.drivers.active} active`}
            icon={UserGroupIcon}
            color="blue"
            trend={5.2}
          />
          <AnimatedCard
            title="Today's Revenue"
            value={`₹${(analyticsData.payments.todayRevenue / 1000).toFixed(1)}K`}
            subtitle="Today's earnings"
            icon={CurrencyRupeeIcon}
            color="green"
            trend={18.9}
          />
        </div>

        {/* Trends Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TrendChart
            data={analyticsData.trends.userGrowth}
            title="User Growth Trend"
            color="blue"
          />
          <TrendChart
            data={analyticsData.trends.revenueGrowth}
            title="Revenue Growth Trend"
            color="green"
          />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <CircularProgress
            percentage={analyticsData.payments.successRate}
            title="Payment Success Rate"
            color="green"
          />
          <CircularProgress
            percentage={Math.round((analyticsData.users.verified / analyticsData.users.total) * 100)}
            title="User Verification Rate"
            color="blue"
          />
          <CircularProgress
            percentage={analyticsData.buses.utilization}
            title="Bus Utilization Rate"
            color="yellow"
          />
          <CircularProgress
            percentage={Math.round((analyticsData.operators.approved / analyticsData.operators.total) * 100)}
            title="Operator Approval Rate"
            color="purple"
          />
        </div>

        {/* Detailed Analytics Table */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <ChartPieIcon className="w-6 h-6 mr-2 text-red-400" />
            Detailed Breakdown
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Users Breakdown */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Users</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white animate-pulse">{analyticsData.users.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Verified:</span>
                  <span className="text-green-400 animate-pulse">{analyticsData.users.verified}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Unverified:</span>
                  <span className="text-yellow-400 animate-pulse">{analyticsData.users.total - analyticsData.users.verified}</span>
                </div>
              </div>
            </div>

            {/* Bookings Breakdown */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Bookings</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white animate-pulse">{analyticsData.bookings.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Completed:</span>
                  <span className="text-green-400 animate-pulse">{analyticsData.bookings.completed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Pending:</span>
                  <span className="text-yellow-400 animate-pulse">{analyticsData.bookings.pending}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Failed:</span>
                  <span className="text-red-400 animate-pulse">{analyticsData.bookings.failed}</span>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Revenue</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-green-400 animate-pulse">₹{analyticsData.payments.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Today:</span>
                  <span className="text-blue-400 animate-pulse">₹{analyticsData.payments.todayRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg/Booking:</span>
                  <span className="text-white animate-pulse">₹{analyticsData.payments.avgBooking}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
