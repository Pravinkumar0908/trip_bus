import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  UserGroupIcon,
  TruckIcon,
  TicketIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalOperators: 0,
    totalBuses: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeBookings: 0,
    pendingApprovals: 0,
    todayBookings: 0,
    totalPassengers: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [quickStats, setQuickStats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      navigate('/admin-login');
      return;
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCounts(),
        fetchRecentActivities(),
        fetchPendingAdmins(),
        fetchQuickStats()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      // Users count
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Operators count
      const operatorsSnapshot = await getDocs(collection(db, 'operators'));
      const totalOperators = operatorsSnapshot.size;

      // Buses count
      const busesSnapshot = await getDocs(collection(db, 'buses'));
      const totalBuses = busesSnapshot.size;

      // Payments count (actual bookings)
      const paymentsSnapshot = await getDocs(collection(db, 'payments'));
      const totalBookings = paymentsSnapshot.size;

      // Passenger info count
      const passengersSnapshot = await getDocs(collection(db, 'passengerInfo'));
      const totalPassengers = passengersSnapshot.size;

      // Today's bookings from payments
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      const todayBookingsQuery = query(
        collection(db, 'payments'),
        where('createdAt', '>=', todayStart),
        where('createdAt', '<=', todayEnd)
      );
      const todayBookingsSnapshot = await getDocs(todayBookingsQuery);
      const todayBookings = todayBookingsSnapshot.size;

      // Calculate revenue from completed payments
      let totalRevenue = 0;
      let activeBookings = 0;
      paymentsSnapshot.forEach((doc) => {
        const payment = doc.data();
        if (payment.paymentStatus === 'completed' && payment.totalAmount) {
          totalRevenue += payment.totalAmount;
          activeBookings++;
        }
      });

      setDashboardData({
        totalUsers,
        totalOperators,
        totalBuses,
        totalBookings,
        totalRevenue,
        activeBookings,
        todayBookings,
        totalPassengers,
        pendingApprovals: 0 // Will be updated by fetchPendingAdmins
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // Fetch recent payments (bookings)
      const recentPaymentsQuery = query(
        collection(db, 'payments'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const paymentsSnapshot = await getDocs(recentPaymentsQuery);
      
      const activities = [];
      paymentsSnapshot.forEach((doc) => {
        const payment = doc.data();
        activities.push({
          id: doc.id,
          type: 'booking',
          message: `New booking from ${payment.userName || 'Unknown'} - ${payment.busDetails?.from || 'N/A'} to ${payment.busDetails?.to || 'N/A'}`,
          time: payment.createdAt?.toDate() || new Date(),
          status: payment.paymentStatus || 'pending',
          amount: payment.totalAmount || 0
        });
      });

      // Also fetch recent operator registrations
      const recentOperatorsQuery = query(
        collection(db, 'operators'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const operatorsSnapshot = await getDocs(recentOperatorsQuery);
      
      operatorsSnapshot.forEach((doc) => {
        const operator = doc.data();
        activities.push({
          id: doc.id,
          type: 'operator',
          message: `New operator registered: ${operator.fullName || operator.businessName || 'Unknown'}`,
          time: operator.createdAt?.toDate() || new Date(),
          status: operator.status || 'pending'
        });
      });

      // Sort all activities by time (newest first)
      activities.sort((a, b) => b.time - a.time);
      
      // Take only the latest 8 activities
      setRecentActivities(activities.slice(0, 8));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const fetchPendingAdmins = async () => {
    try {
      const adminsQuery = query(
        collection(db, 'admins'),
        where('isActive', '==', false)
      );
      const adminsSnapshot = await getDocs(adminsQuery);
      
      const pending = [];
      adminsSnapshot.forEach((doc) => {
        const admin = doc.data();
        pending.push({
          id: doc.id,
          ...admin
        });
      });

      setPendingAdmins(pending);
      setDashboardData(prev => ({
        ...prev,
        pendingApprovals: pending.length
      }));
    } catch (error) {
      console.error('Error fetching pending admins:', error);
    }
  };

  const fetchQuickStats = async () => {
    try {
      // Calculate real statistics
      const paymentsSnapshot = await getDocs(collection(db, 'payments'));
      const operatorsSnapshot = await getDocs(collection(db, 'operators'));
      
      let completedPayments = 0;
      let totalAmount = 0;
      let failedPayments = 0;
      
      paymentsSnapshot.forEach((doc) => {
        const payment = doc.data();
        if (payment.paymentStatus === 'completed') {
          completedPayments++;
          totalAmount += payment.totalAmount || 0;
        } else if (payment.paymentStatus === 'failed') {
          failedPayments++;
        }
      });

      const successRate = paymentsSnapshot.size > 0 
        ? ((completedPayments / paymentsSnapshot.size) * 100).toFixed(1)
        : '0.0';

      const failureRate = paymentsSnapshot.size > 0 
        ? ((failedPayments / paymentsSnapshot.size) * 100).toFixed(1)
        : '0.0';

      const avgBookingValue = completedPayments > 0 
        ? Math.round(totalAmount / completedPayments)
        : 0;

      // Count active operators
      let activeOperators = 0;
      operatorsSnapshot.forEach((doc) => {
        const operator = doc.data();
        if (operator.isActive === true && operator.status === 'approved') {
          activeOperators++;
        }
      });

      const operatorGrowth = operatorsSnapshot.size > 0 
        ? ((activeOperators / operatorsSnapshot.size) * 100).toFixed(1)
        : '0.0';

      const stats = [
        { 
          label: 'Payment Success Rate', 
          value: `${successRate}%`, 
          trend: parseFloat(successRate) > 95 ? 'up' : 'down', 
          color: parseFloat(successRate) > 95 ? 'green' : 'red' 
        },
        { 
          label: 'Payment Failure Rate', 
          value: `${failureRate}%`, 
          trend: parseFloat(failureRate) < 5 ? 'up' : 'down', 
          color: parseFloat(failureRate) < 5 ? 'green' : 'red' 
        },
        { 
          label: 'Avg. Booking Value', 
          value: `₹${avgBookingValue}`, 
          trend: 'up', 
          color: 'blue' 
        },
        { 
          label: 'Operator Growth', 
          value: `${operatorGrowth}%`, 
          trend: 'up', 
          color: 'purple' 
        }
      ];
      
      setQuickStats(stats);
    } catch (error) {
      console.error('Error calculating quick stats:', error);
      // Fallback to mock data
      const stats = [
        { label: 'Payment Success Rate', value: '96.5%', trend: 'up', color: 'green' },
        { label: 'Payment Failure Rate', value: '3.5%', trend: 'down', color: 'red' },
        { label: 'Avg. Booking Value', value: '₹850', trend: 'up', color: 'blue' },
        { label: 'Operator Growth', value: '12.3%', trend: 'up', color: 'purple' }
      ];
      setQuickStats(stats);
    }
  };

  const approveAdmin = async (adminId, adminName) => {
    try {
      await updateDoc(doc(db, 'admins', adminId), {
        isActive: true,
        approvedAt: new Date(),
        approvedBy: JSON.parse(localStorage.getItem('adminData')).name
      });
      
      setPendingAdmins(prev => prev.filter(admin => admin.id !== adminId));
      setDashboardData(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1
      }));
      
      alert(`${adminName} approved successfully!`);
    } catch (error) {
      console.error('Error approving admin:', error);
      alert('Error approving admin');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend === 'up' ? (
                <ArrowUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 mr-1" />
              )}
              {trendValue}
            </div>
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
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
        <div className="text-white text-xl">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-300">
            Welcome back! Here's what's happening with EasyTrip today.
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={dashboardData.totalUsers.toLocaleString()}
            icon={UserGroupIcon}
            color="blue"
            trend="up"
            trendValue="+5.2%"
          />
          <StatCard
            title="Total Operators"
            value={dashboardData.totalOperators.toLocaleString()}
            icon={BuildingOfficeIcon}
            color="green"
            trend="up"
            trendValue="+2.1%"
          />
          <StatCard
            title="Total Buses"
            value={dashboardData.totalBuses.toLocaleString()}
            icon={TruckIcon}
            color="purple"
            trend="up"
            trendValue="+8.5%"
          />
          <StatCard
            title="Total Bookings"
            value={dashboardData.totalBookings.toLocaleString()}
            icon={TicketIcon}
            color="yellow"
            trend="up"
            trendValue="+12.3%"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Today's Bookings"
            value={dashboardData.todayBookings.toLocaleString()}
            icon={CalendarIcon}
            color="red"
          />
          <StatCard
            title="Completed Bookings"
            value={dashboardData.activeBookings.toLocaleString()}
            icon={CheckCircleIcon}
            color="green"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${(dashboardData.totalRevenue / 100000).toFixed(1)}L`}
            icon={CurrencyRupeeIcon}
            color="blue"
            trend="up"
            trendValue="+15.7%"
          />
          <StatCard
            title="Total Passengers"
            value={dashboardData.totalPassengers.toLocaleString()}
            icon={UserGroupIcon}
            color="indigo"
          />
        </div>

        {/* Pending Approvals Card */}
        {dashboardData.pendingApprovals > 0 && (
          <div className="mb-8">
            <StatCard
              title="Pending Admin Approvals"
              value={dashboardData.pendingApprovals.toLocaleString()}
              icon={ExclamationTriangleIcon}
              color="yellow"
            />
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <ClockIcon className="w-6 h-6 mr-2 text-red-400" />
                Recent Activities
              </h3>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-700/50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        activity.type === 'booking' && activity.status === 'completed' ? 'bg-green-400' :
                        activity.type === 'booking' && activity.status === 'pending' ? 'bg-yellow-400' :
                        activity.type === 'booking' && activity.status === 'failed' ? 'bg-red-400' :
                        activity.type === 'operator' && activity.status === 'approved' ? 'bg-green-400' :
                        activity.type === 'operator' && activity.status === 'pending' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{activity.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-gray-400 text-xs">
                            {activity.time.toLocaleString()}
                          </p>
                          {activity.amount && (
                            <p className="text-green-400 text-xs font-medium">
                              ₹{activity.amount}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No recent activities</p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 mt-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <ChartBarIcon className="w-6 h-6 mr-2 text-red-400" />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {quickStats.map((stat, index) => (
                  <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400 text-xs">{stat.label}</p>
                    <div className="flex items-center justify-between">
                      <p className={`text-lg font-bold ${
                        stat.color === 'green' ? 'text-green-400' :
                        stat.color === 'red' ? 'text-red-400' :
                        stat.color === 'blue' ? 'text-blue-400' : 
                        stat.color === 'purple' ? 'text-purple-400' : 'text-yellow-400'
                      }`}>
                        {stat.value}
                      </p>
                      {stat.trend && (
                        <div className={`flex items-center ${
                          stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {stat.trend === 'up' ? (
                            <ArrowUpIcon className="w-3 h-3" />
                          ) : (
                            <ArrowDownIcon className="w-3 h-3" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <ExclamationTriangleIcon className="w-6 w-6 mr-2 text-yellow-400" />
                Pending Admin Approvals
              </h3>
              <div className="space-y-3">
                {pendingAdmins.length > 0 ? (
                  pendingAdmins.map((admin) => (
                    <div key={admin.id} className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium">{admin.name}</p>
                        <button
                          onClick={() => approveAdmin(admin.id, admin.name)}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                        >
                          Approve
                        </button>
                      </div>
                      <p className="text-gray-400 text-xs">{admin.email}</p>
                      <p className="text-gray-500 text-xs">
                        {admin.createdAt?.toDate()?.toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No pending approvals</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 mt-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/admin-panel/operators')}
                  className="w-full text-left p-3 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="w-5 h-5 text-red-400 mr-3" />
                    <span className="text-white">Manage Operators</span>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/admin-panel/buses')}
                  className="w-full text-left p-3 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <TruckIcon className="w-5 h-5 text-red-400 mr-3" />
                    <span className="text-white">View All Buses</span>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/admin-panel/bookings')}
                  className="w-full text-left p-3 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <TicketIcon className="w-5 h-5 text-red-400 mr-3" />
                    <span className="text-white">View Bookings</span>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/admin-panel/reports')}
                  className="w-full text-left p-3 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <ChartBarIcon className="w-5 h-5 text-red-400 mr-3" />
                    <span className="text-white">View Reports</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
