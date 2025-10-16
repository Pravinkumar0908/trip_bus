import React, { useState, useEffect } from 'react';
import {
  TruckIcon,
  MapIcon,
  TicketIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  ClockIcon,
  RefreshIcon,
  ExclamationTriangleIcon,

} from '@heroicons/react/24/outline';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggedInOperatorId, setLoggedInOperatorId] = useState(null);
  const [operatorInfo, setOperatorInfo] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalBuses: 0,
      activeRoutes: 0,
      todayBookings: 0,
      todayRevenue: 0,
      activeDrivers: 0,
      onTimePerformance: 94
    },
    recentBookings: [],
    weeklyRevenue: [0, 0, 0, 0, 0, 0, 0],
    busStatus: {
      active: 0,
      maintenance: 0,
      outOfService: 0
    }
  });

  // Get operator ID from localStorage
  useEffect(() => {
    const getOperatorId = () => {
      try {
        const storedOperatorId = localStorage.getItem('operatorId');
        if (storedOperatorId) {
          setLoggedInOperatorId(storedOperatorId);
          return;
        }

        const storedOperatorInfo = localStorage.getItem('operatorInfo');
        if (storedOperatorInfo) {
          const operatorData = JSON.parse(storedOperatorInfo);
          const operatorId = operatorData.operatorId || operatorData.id;
          if (operatorId) {
            setLoggedInOperatorId(operatorId);
            return;
          }
        }

        setError('Please login first to access your dashboard');

      } catch (error) {
        console.error('Error getting operator ID:', error);
        setError('Error accessing operator information. Please login again.');
      }
    };

    getOperatorId();
  }, []);

  // Helper function to format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Helper function to format seat name
  const formatSeatName = (seatId) => {
    if (!seatId) return 'N/A';

    try {
      const parts = seatId.split('-');
      if (parts.length >= 3) {
        const row = parseInt(parts[1]);
        const col = parseInt(parts[2]);
        const seatLetter = String.fromCharCode(65 + row);
        const seatNumber = col + 1;
        return `${seatLetter}${seatNumber}`;
      }
    } catch (error) {
      console.error('Error formatting seat name:', error);
    }

    return seatId;
  };

  // Fetch operator information
  const fetchOperatorInfo = async (operatorId) => {
    try {
      // Try by document ID first
      const operatorDocRef = doc(db, 'operators', operatorId);
      const operatorDoc = await getDoc(operatorDocRef);

      if (operatorDoc.exists()) {
        return { id: operatorDoc.id, ...operatorDoc.data() };
      } else {
        // Try by operatorId field
        const operatorsQuery = query(
          collection(db, 'operators'),
          where('operatorId', '==', operatorId)
        );

        const operatorsSnapshot = await getDocs(operatorsQuery);

        if (!operatorsSnapshot.empty) {
          const operatorDoc = operatorsSnapshot.docs[0];
          return { id: operatorDoc.id, ...operatorDoc.data() };
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching operator info:', error);
      return null;
    }
  };

  // Fetch buses for the operator
  const fetchOperatorBuses = async (operatorId) => {
    try {
      const busesQuery = query(
        collection(db, 'buses'),
        where('operatorId', '==', operatorId)
      );

      const busesSnapshot = await getDocs(busesQuery);
      const buses = [];

      busesSnapshot.forEach(doc => {
        buses.push({ id: doc.id, ...doc.data() });
      });

      return buses;
    } catch (error) {
      console.error('Error fetching buses:', error);
      return [];
    }
  };

  // Fetch bookings for the operator
  const fetchOperatorBookings = async (operatorId) => {
    try {
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('operatorId', '==', operatorId)
      );

      const paymentsSnapshot = await getDocs(paymentsQuery);
      const bookings = [];

      for (const paymentDoc of paymentsSnapshot.docs) {
        const paymentData = paymentDoc.data();

        // Fetch passengers for this booking
        try {
          const passengersQuery = query(
            collection(db, 'passengerinfo'),
            where('bookingId', '==', paymentData.bookingId)
          );

          const passengersSnapshot = await getDocs(passengersQuery);
          const passengers = passengersSnapshot.docs.map(doc => doc.data());

          bookings.push({
            id: paymentDoc.id,
            ...paymentData,
            passengers: passengers
          });
        } catch (passengerError) {
          console.error('Error fetching passengers:', passengerError);
          bookings.push({
            id: paymentDoc.id,
            ...paymentData,
            passengers: []
          });
        }
      }

      return bookings;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  };

  // Calculate today's data
  const calculateTodayData = (bookings) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBookings = bookings.filter(booking => {
      const bookingDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === today.getTime();
    });

    const todayRevenue = todayBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    return {
      count: todayBookings.length,
      revenue: todayRevenue
    };
  };

  // Calculate weekly revenue
  const calculateWeeklyRevenue = (bookings) => {
    const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // 7 days
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);

      const dayBookings = bookings.filter(booking => {
        const bookingDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === date.getTime();
      });

      weeklyData[i] = dayBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    }

    return weeklyData;
  };

  // Get recent bookings (last 5)
  const getRecentBookings = (bookings) => {
    return bookings
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      })
      .slice(0, 5)
      .map(booking => {
        const firstPassenger = booking.passengers?.[0];
        const firstSeat = booking.seatNumbers?.[0] || booking.formattedSeatNumbers?.[0]?.seatName;

        return {
          id: booking.bookingId,
          route: `${booking.busDetails?.from || 'N/A'} → ${booking.busDetails?.to || 'N/A'}`,
          passenger: firstPassenger?.name || 'N/A',
          seat: formatSeatName(firstSeat) || 'N/A',
          amount: `₹${booking.totalAmount?.toLocaleString() || 0}`,
          status: booking.paymentStatus === 'completed' ? 'Confirmed' :
            booking.paymentStatus === 'pending' ? 'Pending' :
              booking.paymentStatus === 'cancelled' ? 'Cancelled' : 'Unknown'
        };
      });
  };

  // Calculate bus status
  const calculateBusStatus = (buses) => {
    const active = buses.filter(bus => bus.status === 'active').length;
    const maintenance = buses.filter(bus => bus.status === 'maintenance').length;
    const outOfService = buses.filter(bus => bus.status === 'out_of_service' || bus.status === 'inactive').length;

    return { active, maintenance, outOfService };
  };

  // Get unique routes
  const getActiveRoutes = (bookings) => {
    const routes = new Set();
    bookings.forEach(booking => {
      if (booking.busDetails?.from && booking.busDetails?.to) {
        routes.add(`${booking.busDetails.from}-${booking.busDetails.to}`);
      }
    });
    return routes.size;
  };

  // Main fetch function
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!loggedInOperatorId) {
        throw new Error("Please login first. Operator ID is required.");
      }

      console.log("🔍 Fetching dashboard data for operator:", loggedInOperatorId);

      // Fetch operator info
      const operatorData = await fetchOperatorInfo(loggedInOperatorId);
      if (operatorData) {
        setOperatorInfo(operatorData);
      }

      // Fetch buses and bookings in parallel
      const [buses, bookings] = await Promise.all([
        fetchOperatorBuses(loggedInOperatorId),
        fetchOperatorBookings(loggedInOperatorId)
      ]);

      console.log("📊 Fetched data:", { buses: buses.length, bookings: bookings.length });

      // Calculate all statistics
      const todayData = calculateTodayData(bookings);
      const weeklyRevenue = calculateWeeklyRevenue(bookings);
      const recentBookings = getRecentBookings(bookings);
      const busStatus = calculateBusStatus(buses);
      const activeRoutes = getActiveRoutes(bookings);

      // Update dashboard data
      setDashboardData({
        stats: {
          totalBuses: buses.length,
          activeRoutes: activeRoutes,
          todayBookings: todayData.count,
          todayRevenue: todayData.revenue,
          activeDrivers: buses.filter(bus => bus.driverId).length,
          onTimePerformance: 94 // This could be calculated based on actual data
        },
        recentBookings: recentBookings,
        weeklyRevenue: weeklyRevenue,
        busStatus: busStatus
      });

    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when operator ID is available
  useEffect(() => {
    if (loggedInOperatorId) {
      fetchDashboardData();
    }
  }, [loggedInOperatorId]);

  // Stats configuration
  const stats = [
    {
      name: 'Total Buses',
      value: dashboardData.stats.totalBuses.toString(),
      icon: TruckIcon,
      color: 'bg-blue-500',
      change: '+2'
    },
    {
      name: 'Active Routes',
      value: dashboardData.stats.activeRoutes.toString(),
      icon: MapIcon,
      color: 'bg-green-500',
      change: '+1'
    },
    {
      name: 'Today Bookings',
      value: dashboardData.stats.todayBookings.toString(),
      icon: TicketIcon,
      color: 'bg-purple-500',
      change: '+24'
    },
    {
      name: 'Today Revenue',
      value: `₹${dashboardData.stats.todayRevenue.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      color: 'bg-yellow-500',
      change: '+12%'
    },
    {
      name: 'Active Drivers',
      value: dashboardData.stats.activeDrivers.toString(),
      icon: UserGroupIcon,
      color: 'bg-indigo-500',
      change: '+3'
    },
    {
      name: 'On Time Performance',
      value: `${dashboardData.stats.onTimePerformance}%`,
      icon: ClockIcon,
      color: 'bg-red-500',
      change: '+2%'
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Dashboard...</h3>
          <p className="text-gray-600">Fetching data for operator: {loggedInOperatorId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchDashboardData}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <ClockIcon className="w-4 h-4" />
              Retry Loading
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/operator-login';
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mx-auto block"
            >
              Login Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back,
            <span className="ml-1 font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 uppercase">
              {operatorInfo?.fullName || 'Operator'}
            </span>!

          </p>


        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ClockIcon className="w-4 h-4" />
            Refresh Data
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Add New Bus
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">
                    <span className="font-medium">{stat.change}</span> vs last month
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Revenue</h3>
          <div className="h-64 bg-gradient-to-t from-blue-100 to-blue-50 rounded-lg flex items-end justify-center">
            <div className="flex items-end space-x-2 h-48">
              {dashboardData.weeklyRevenue.map((revenue, index) => {
                const maxRevenue = Math.max(...dashboardData.weeklyRevenue);
                const height = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 10;
                return (
                  <div
                    key={index}
                    className="bg-blue-500 w-8 rounded-t"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`Day ${index + 1}: ₹${revenue.toLocaleString()}`}
                  ></div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>7 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Bus Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Status Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Buses</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${dashboardData.stats.totalBuses > 0 ? (dashboardData.busStatus.active / dashboardData.stats.totalBuses) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{dashboardData.busStatus.active}/{dashboardData.stats.totalBuses}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">In Maintenance</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${dashboardData.stats.totalBuses > 0 ? (dashboardData.busStatus.maintenance / dashboardData.stats.totalBuses) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{dashboardData.busStatus.maintenance}/{dashboardData.stats.totalBuses}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Out of Service</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${dashboardData.stats.totalBuses > 0 ? (dashboardData.busStatus.outOfService / dashboardData.stats.totalBuses) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{dashboardData.busStatus.outOfService}/{dashboardData.stats.totalBuses}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passenger</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboardData.recentBookings.length > 0 ? (
                dashboardData.recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{booking.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.route}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.passenger}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.seat}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${booking.status === 'Confirmed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : booking.status === 'Cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    <TicketIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No recent bookings found</p>
                    <p className="text-xs mt-1">Bookings will appear here once customers start booking</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
