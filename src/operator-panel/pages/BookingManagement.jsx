import React, { useState, useEffect } from 'react';
import {
  User, Bus, Calendar, Phone, Mail, MapPin,
  Search, RefreshCw, AlertCircle, CheckCircle,
  Eye, EyeOff, CreditCard, Users, Clock,
  Navigation, Shield, Building2, ChevronDown,
  ChevronUp, Download, Filter, MoreHorizontal,
  X, XCircle, Printer, FileText, UserCheck,
  QrCode, Ticket, AlertTriangle, Star
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const OperatorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operatorInfo, setOperatorInfo] = useState(null);
  const [loggedInOperatorId, setLoggedInOperatorId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedBookingData, setSelectedBookingData] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalPassengers: 0,
    completedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    refundedBookings: 0
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

  // Fetch operator data and bookings
  const fetchOperatorDataAndBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!loggedInOperatorId) {
        throw new Error("Please login first. Operator ID is required.");
      }

      // Fetch operator info
      let operatorData = null;

      try {
        const operatorDocRef = doc(db, 'operators', loggedInOperatorId);
        const operatorDoc = await getDoc(operatorDocRef);

        if (operatorDoc.exists()) {
          operatorData = { id: operatorDoc.id, ...operatorDoc.data() };
        } else {
          const operatorsQuery = query(
            collection(db, 'operators'),
            where('operatorId', '==', loggedInOperatorId)
          );

          const operatorsSnapshot = await getDocs(operatorsQuery);

          if (!operatorsSnapshot.empty) {
            const operatorDoc = operatorsSnapshot.docs[0];
            operatorData = { id: operatorDoc.id, ...operatorDoc.data() };
          }
        }

        if (operatorData) {
          setOperatorInfo(operatorData);
        } else {
          setOperatorInfo({
            id: loggedInOperatorId,
            name: 'Unknown Operator',
            operatorId: loggedInOperatorId
          });
        }
      } catch (operatorError) {
        setOperatorInfo({
          id: loggedInOperatorId,
          name: 'Unknown Operator',
          operatorId: loggedInOperatorId
        });
      }

      // Fetch bookings
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('operatorId', '==', loggedInOperatorId)
      );

      const paymentsSnapshot = await getDocs(paymentsQuery);

      if (paymentsSnapshot.empty) {
        setBookings([]);
        setStats({
          totalBookings: 0,
          totalRevenue: 0,
          totalPassengers: 0,
          completedBookings: 0,
          pendingBookings: 0,
          cancelledBookings: 0,
          refundedBookings: 0
        });
        setLoading(false);
        return;
      }

      const bookingsData = [];
      let totalRevenue = 0;
      let totalPassengers = 0;
      let completedBookings = 0;
      let pendingBookings = 0;
      let cancelledBookings = 0;
      let refundedBookings = 0;

      for (const paymentDoc of paymentsSnapshot.docs) {
        const paymentData = paymentDoc.data();
        totalRevenue += paymentData.totalAmount || 0;
        totalPassengers += paymentData.passengerCount || 0;

        // Count different statuses
        switch (paymentData.paymentStatus) {
          case 'completed':
            completedBookings++;
            break;
          case 'pending':
            pendingBookings++;
            break;
          case 'cancelled':
            cancelledBookings++;
            break;
          case 'refunded':
            refundedBookings++;
            break;
        }

        try {
          const passengersQuery = query(
            collection(db, 'passengerinfo'),
            where('bookingId', '==', paymentData.bookingId)
          );

          const passengersSnapshot = await getDocs(passengersQuery);
          const passengers = passengersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          bookingsData.push({
            id: paymentDoc.id,
            ...paymentData,
            passengers: passengers
          });

        } catch (passengerError) {
          bookingsData.push({
            id: paymentDoc.id,
            ...paymentData,
            passengers: []
          });
        }
      }

      setBookings(bookingsData);
      setStats({
        totalBookings: bookingsData.length,
        totalRevenue: totalRevenue,
        totalPassengers: totalPassengers,
        completedBookings: completedBookings,
        pendingBookings: pendingBookings,
        cancelledBookings: cancelledBookings,
        refundedBookings: refundedBookings
      });

    } catch (error) {
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedInOperatorId) {
      fetchOperatorDataAndBookings();
    }
  }, [loggedInOperatorId]);

  // Helper functions
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (time) => {
    return time || 'N/A';
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-blue-100 text-blue-800'
    };

    const icons = {
      completed: <CheckCircle className="w-3 h-3 mr-1" />,
      pending: <Clock className="w-3 h-3 mr-1" />,
      failed: <XCircle className="w-3 h-3 mr-1" />,
      cancelled: <X className="w-3 h-3 mr-1" />,
      refunded: <RefreshCw className="w-3 h-3 mr-1" />
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status]}
        {status || 'unknown'}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      card: '💳',
      upi: '📱',
      netbanking: '🏦',
      wallet: '👛'
    };
    return icons[method] || '💰';
  };

  // Cancel ticket function
  const cancelTicket = async (booking) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${booking.bookingId}?`)) {
      return;
    }

    setCancelLoading(true);
    try {
      // Update payment status to cancelled
      const paymentRef = doc(db, 'payments', booking.id);
      await updateDoc(paymentRef, {
        paymentStatus: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'operator'
      });

      // Update local state
      setBookings(prevBookings =>
        prevBookings.map(b =>
          b.id === booking.id
            ? { ...b, paymentStatus: 'cancelled', cancelledAt: new Date() }
            : b
        )
      );

      alert(`Booking ${booking.bookingId} has been cancelled successfully!`);

      // Refresh stats
      await fetchOperatorDataAndBookings();

    } catch (error) {
      console.error('Error cancelling ticket:', error);
      alert('Failed to cancel ticket. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  // View Profile/Ticket Modal
  const viewTicketDetails = (booking) => {
    setSelectedBookingData(booking);
    setShowTicketModal(true);
  };

  const viewProfileDetails = (booking) => {
    setSelectedBookingData(booking);
    setShowProfileModal(true);
  };

  // Print ticket function
  const printTicket = () => {
    window.print();
  };

  // Filter and search logic
  const filteredBookings = bookings.filter(booking => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        booking.bookingId?.toLowerCase().includes(search) ||
        booking.busNumber?.toLowerCase().includes(search) ||
        booking.transactionId?.toLowerCase().includes(search) ||
        booking.passengers?.some(p => p.name?.toLowerCase().includes(search))
      );
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filterStatus !== 'all' && booking.paymentStatus !== filterStatus) return false;

    // Payment method filter
    if (filterPaymentMethod !== 'all' && booking.paymentMethod !== filterPaymentMethod) return false;

    return true;
  });

  // Sort logic
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    switch (sortBy) {
      case 'date_desc':
        return new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt) - new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt);
      case 'date_asc':
        return new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt) - new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt);
      case 'amount_desc':
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      case 'amount_asc':
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedBookings.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedBookings = sortedBookings.slice(startIndex, startIndex + rowsPerPage);

  // Toggle row expansion
  const toggleRowExpansion = (bookingId) => {
    setExpandedRows(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  // Select booking
  const toggleBookingSelection = (bookingId) => {
    setSelectedBookings(prev =>
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  // Export data
  const exportData = () => {
    const csvData = sortedBookings.map(booking => ({
      'Booking ID': booking.bookingId,
      'Bus Number': booking.busNumber,
      'From': booking.busDetails?.from || 'N/A',
      'To': booking.busDetails?.to || 'N/A',
      'Date': booking.busDetails?.date || 'N/A',
      'Passengers': booking.passengerCount || 0,
      'Amount': booking.totalAmount || 0,
      'Payment Method': booking.paymentMethod,
      'Status': booking.paymentStatus,
      'Created': formatDate(booking.createdAt)
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operator-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Dashboard...</h3>
          <p className="text-gray-600">Operator: {loggedInOperatorId || 'Detecting...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchOperatorDataAndBookings}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/operator-login';
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <User className="w-4 h-4" />
              Login Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                {operatorInfo?.name || operatorInfo?.operatorName || 'Operator Dashboard'}
              </h1>
              <p className="text-green-100 text-sm">
                <strong>Operator ID:</strong> {loggedInOperatorId}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <div className="text-green-100 text-sm">Total Bookings</div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          {[
            { title: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'bg-blue-500' },
            { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: CreditCard, color: 'bg-green-500' },
            { title: 'Total Passengers', value: stats.totalPassengers, icon: Users, color: 'bg-purple-500' },
            { title: 'Completed', value: stats.completedBookings, icon: CheckCircle, color: 'bg-emerald-500' },
            { title: 'Pending', value: stats.pendingBookings, icon: Clock, color: 'bg-yellow-500' },
            { title: 'Cancelled', value: stats.cancelledBookings, icon: XCircle, color: 'bg-gray-500' },
            { title: 'Refunded', value: stats.refundedBookings, icon: RefreshCw, color: 'bg-blue-500' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">{stat.title}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 rounded-full`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="netbanking">Net Banking</option>
                <option value="wallet">Wallet</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date_desc">Latest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Amount High-Low</option>
                <option value="amount_asc">Amount Low-High</option>
              </select>
            </div>

            {/* Export Button */}
            <div>
              <button
                onClick={exportData}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {paginatedBookings.length === 0 ? (
            <div className="text-center py-12">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Bookings Found</h3>
              <p className="text-gray-600">
                {bookings.length === 0
                  ? "You haven't received any bookings yet."
                  : "No bookings match your search criteria."
                }
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBookings(paginatedBookings.map(b => b.id));
                            } else {
                              setSelectedBookings([]);
                            }
                          }}
                          checked={selectedBookings.length === paginatedBookings.length && paginatedBookings.length > 0}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Details</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Info</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passengers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedBookings.map((booking, index) => (
                      <React.Fragment key={booking.id}>
                        {/* Main Row */}
                        <tr className={`hover:bg-gray-50 ${selectedBookings.includes(booking.id) ? 'bg-blue-50' : ''}`}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedBookings.includes(booking.id)}
                              onChange={() => toggleBookingSelection(booking.id)}
                            />
                          </td>

                          {/* Booking Details */}
                          <td className="px-4 py-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{booking.bookingId}</div>
                              <div className="text-gray-500 flex items-center gap-1">
                                <Bus className="w-3 h-3" />
                                {booking.busNumber}
                              </div>
                              <div className="text-xs text-gray-400">
                                {formatDate(booking.createdAt)}
                              </div>
                            </div>
                          </td>

                          {/* Trip Info */}
                          <td className="px-4 py-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                {booking.boardingPoint?.name || 'N/A'} → {booking.droppingPoint?.name || 'N/A'}
                              </div>
                              <div className="text-gray-500">{booking.busDetails?.date || 'N/A'}</div>
                             
                              <div className="text-xs text-blue-600 mt-1">
                                📍 From: {booking.boardingPoint?.address || 'Address not available'}
                              </div>
                              <div className="text-xs text-purple-600">
                                📍 To: {booking.droppingPoint?.address || 'Address not available'}
                              </div>
                            </div>
                          </td>


                          {/* Passengers */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm">
                              <Users className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="font-medium">{booking.passengerCount || booking.passengers?.length || 0}</span>
                            </div>
                          </td>

                          {/* Payment */}
                          <td className="px-4 py-4">
                            <div className="text-sm">
                              <div className="font-bold text-green-600">₹{booking.totalAmount?.toLocaleString() || 0}</div>
                              <div className="text-gray-500 flex items-center gap-1">
                                <span>{getPaymentMethodIcon(booking.paymentMethod)}</span>
                                {booking.paymentMethod}
                              </div>
                              <div className="text-xs text-gray-400">
                                TXN: {booking.transactionId?.slice(-8) || 'N/A'}
                              </div>
                            </div>
                          </td>

                          {/* Full Status */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {getStatusBadge(booking.paymentStatus)}
                              {booking.cancelledAt && (
                                <div className="text-xs text-red-600">
                                  Cancelled: {formatDate(booking.cancelledAt)}
                                </div>
                              )}
                              {booking.refundedAt && (
                                <div className="text-xs text-blue-600">
                                  Refunded: {formatDate(booking.refundedAt)}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Enhanced Actions */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => toggleRowExpansion(booking.id)}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-xs"
                              >
                                {expandedRows[booking.id] ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    Details
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => viewProfileDetails(booking)}
                                className="text-purple-600 hover:text-purple-900 flex items-center gap-1 text-xs"
                              >
                                <UserCheck className="w-3 h-3" />
                                Profile
                              </button>

                              <button
                                onClick={() => viewTicketDetails(booking)}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1 text-xs"
                              >
                                <Ticket className="w-3 h-3" />
                                Ticket
                              </button>

                              {booking.paymentStatus === 'completed' && (
                                <button
                                  onClick={() => cancelTicket(booking)}
                                  disabled={cancelLoading}
                                  className="text-red-600 hover:text-red-900 flex items-center gap-1 text-xs disabled:opacity-50"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Row */}
                        {expandedRows[booking.id] && (
                          <tr className="bg-gray-50">
                            <td colSpan="7" className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Passengers Details */}
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-purple-500" />
                                    Passengers ({booking.passengers?.length || 0})
                                  </h4>
                                  <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {booking.passengers && booking.passengers.length > 0 ? (
                                      booking.passengers.map((passenger, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded border text-sm">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <div className="font-medium">{passenger.name}</div>
                                              <div className="text-gray-600">
                                                Age: {passenger.age} • {passenger.gender}
                                              </div>
                                              {passenger.idType && passenger.idNumber && (
                                                <div className="text-xs text-gray-500">
                                                  {passenger.idType}: ****{passenger.idNumber?.slice(-4)}
                                                </div>
                                              )}
                                            </div>
                                            <div className="text-blue-600 font-medium">
                                              {passenger.seatId}
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-gray-500 text-sm">No passenger details available</div>
                                    )}
                                  </div>
                                </div>

                                {/* Enhanced Contact & Trip Details */}
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-green-500" />
                                    Full Booking Info
                                  </h4>
                                  <div className="bg-white p-3 rounded border text-sm space-y-2">
                                    {booking.contactDetails && (
                                      <>
                                        {booking.contactDetails.phone && (
                                          <div className="flex items-center gap-2">
                                            <Phone className="w-3 h-3 text-gray-400" />
                                            <span>{booking.contactDetails.phone}</span>
                                          </div>
                                        )}
                                        {booking.contactDetails.email && (
                                          <div className="flex items-center gap-2">
                                            <Mail className="w-3 h-3 text-gray-400" />
                                            <span>{booking.contactDetails.email}</span>
                                          </div>
                                        )}
                                        {booking.contactDetails.state && (
                                          <div className="flex items-center gap-2">
                                            <MapPin className="w-3 h-3 text-gray-400" />
                                            <span>{booking.contactDetails.state}</span>
                                          </div>
                                        )}
                                      </>
                                    )}

                                    <div className="border-t pt-2 mt-2">
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <div><strong>Boarding:</strong> {booking.boardingPoint?.name || 'N/A'}</div>
                                        <div><strong>Boarding Time:</strong> {booking.boardingPoint?.time || 'N/A'}</div>
                                        <div><strong>Dropping:</strong> {booking.droppingPoint?.name || 'N/A'}</div>
                                        <div><strong>Dropping Time:</strong> {booking.droppingPoint?.time || 'N/A'}</div>
                                        <div><strong>Duration:</strong> {booking.busDetails?.duration || 'N/A'}</div>
                                        <div><strong>Bus Type:</strong> {booking.busDetails?.busType || 'N/A'}</div>

                                        {booking.paymentStatus === 'cancelled' && booking.cancelledAt && (
                                          <div className="text-red-600 font-medium">
                                            <strong>Cancelled On:</strong> {formatDate(booking.cancelledAt)}
                                          </div>
                                        )}

                                        {booking.paymentStatus === 'refunded' && booking.refundedAt && (
                                          <div className="text-blue-600 font-medium">
                                            <strong>Refunded On:</strong> {formatDate(booking.refundedAt)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="mr-2 px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                    <span className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, sortedBookings.length)} of {sortedBookings.length} results
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Details Modal */}
        {showProfileModal && selectedBookingData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-purple-500" />
                    Passenger Profile - {selectedBookingData.bookingId}
                  </h2>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Booking Overview */}
                <div className="bg-purple-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-purple-800 mb-2">Booking Overview</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="font-medium ml-2">{selectedBookingData.bookingId}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2">{getStatusBadge(selectedBookingData.paymentStatus)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-green-600 ml-2">₹{selectedBookingData.totalAmount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium ml-2">{selectedBookingData.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Passenger Details */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Passenger Information ({selectedBookingData.passengers?.length || 0})
                  </h3>
                  <div className="space-y-4">
                    {selectedBookingData.passengers && selectedBookingData.passengers.length > 0 ? (
                      selectedBookingData.passengers.map((passenger, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2"><strong>Name:</strong> {passenger.name}</h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div><strong>Age:</strong> {passenger.age} years</div>
                                <div><strong>Gender:</strong> {passenger.gender}</div>
                                <div><strong>Seat:</strong> {passenger.seatWithDeck}</div>
                                {passenger.idType && (
                                  <div><strong>{passenger.idType}:</strong> ****{passenger.idNumber?.slice(-4)}</div>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div><strong>Passenger Index:</strong> {passenger.passengerIndex || idx + 1}</div>
                              <div><strong>Deck:</strong> {passenger.deck || 'Lower'}</div>
                              {passenger.operatorName && (
                                <div><strong>Operator:</strong> {passenger.operatorName}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No passenger information available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                {selectedBookingData.contactDetails && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-500" />
                      Contact Information
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {selectedBookingData.contactDetails.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{selectedBookingData.contactDetails.phone}</span>
                          </div>
                        )}
                        {selectedBookingData.contactDetails.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{selectedBookingData.contactDetails.email}</span>
                          </div>
                        )}
                        {selectedBookingData.contactDetails.state && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{selectedBookingData.contactDetails.state}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            WhatsApp: {selectedBookingData.contactDetails.whatsappEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      viewTicketDetails(selectedBookingData);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    View Ticket
                  </button>

                  {selectedBookingData.paymentStatus === 'completed' && (
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        cancelTicket(selectedBookingData);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Details Modal */}
        {showTicketModal && selectedBookingData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Ticket className="w-6 h-6 text-green-500" />
                    Bus Ticket - {selectedBookingData.bookingId}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={printTicket}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <button
                      onClick={() => setShowTicketModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Ticket Design */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">EasyTrip Bus Ticket</h3>
                      <p className="text-blue-100">Your journey starts here</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{selectedBookingData.bookingId}</div>
                      <div className="text-blue-100 text-sm">Booking Reference</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <div className="text-blue-100 text-sm mb-1">FROM</div>
                      <div className="text-xl font-bold">{selectedBookingData.busDetails?.from || 'N/A'}</div>
                      <div className="text-blue-100 text-xs">{selectedBookingData.boardingPoint?.name}</div>
                      <div className="text-blue-100 text-xs">{selectedBookingData.boardingPoint?.time}</div>
                    </div>

                    <div className="text-center">
                      <div className="text-blue-100 text-sm mb-1">JOURNEY</div>
                      <div className="flex items-center justify-center gap-2 text-lg">
                        <span className="w-3 h-3 bg-white rounded-full"></span>
                        <div className="flex-1 h-px bg-white"></div>
                        <Bus className="w-6 h-6" />
                        <div className="flex-1 h-px bg-white"></div>
                        <span className="w-3 h-3 bg-white rounded-full"></span>
                      </div>
                      <div className="text-blue-100 text-xs mt-1">{selectedBookingData.busDetails?.duration}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-blue-100 text-sm mb-1">TO</div>
                      <div className="text-xl font-bold">{selectedBookingData.busDetails?.to || 'N/A'}</div>
                      <div className="text-blue-100 text-xs">{selectedBookingData.droppingPoint?.name}</div>
                      <div className="text-blue-100 text-xs">{selectedBookingData.droppingPoint?.time}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-blue-100 text-xs">DATE</div>
                      <div className="font-bold">{selectedBookingData.busDetails?.date}</div>
                    </div>
                    <div>
                      <div className="text-blue-100 text-xs">BUS NO.</div>
                      <div className="font-bold">{selectedBookingData.busNumber}</div>
                    </div>
                    <div>
                      <div className="text-blue-100 text-xs">PASSENGERS</div>
                      <div className="font-bold">{selectedBookingData.passengerCount}</div>
                    </div>
                    <div>
                      <div className="text-blue-100 text-xs">AMOUNT</div>
                      <div className="font-bold">₹{selectedBookingData.totalAmount}</div>
                    </div>
                  </div>
                </div>

                {/* Passenger Information on Ticket */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      Passenger Details
                    </h4>
                    <div className="space-y-3">
                      {selectedBookingData.passengers && selectedBookingData.passengers.length > 0 ? (
                        selectedBookingData.passengers.map((passenger, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 border">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-gray-900">{passenger.name}</div>
                                <div className="text-sm text-gray-600">
                                  {passenger.age}yrs • {passenger.gender}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-blue-600">Seat {passenger.seatId}</div>
                                <div className="text-xs text-gray-500">{passenger.deck || 'Lower'} Deck</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">No passenger details available</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-green-500" />
                      Payment & Status
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        {getStatusBadge(selectedBookingData.paymentStatus)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium flex items-center gap-1">
                          {getPaymentMethodIcon(selectedBookingData.paymentMethod)}
                          {selectedBookingData.paymentMethod}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-mono text-xs">{selectedBookingData.transactionId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Booked On:</span>
                        <span className="text-sm">{formatDate(selectedBookingData.createdAt)}</span>
                      </div>

                      {selectedBookingData.paymentStatus === 'cancelled' && selectedBookingData.cancelledAt && (
                        <div className="flex justify-between text-red-600">
                          <span>Cancelled On:</span>
                          <span className="text-sm">{formatDate(selectedBookingData.cancelledAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* QR Code Section */}
                    <div className="mt-4 text-center">
                      <div className="inline-block bg-gray-100 p-4 rounded-lg">
                        <QrCode className="w-20 h-20 text-gray-400 mx-auto mb-2" />
                        <div className="text-xs text-gray-600">Scan for mobile ticket</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Information */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Important Information
                  </h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Please arrive at boarding point 15 minutes before departure</li>
                    <li>• Carry a valid ID proof for verification</li>
                    <li>• This ticket is non-transferable</li>
                    <li>• Keep this ticket until end of journey</li>
                    {selectedBookingData.paymentStatus === 'cancelled' && (
                      <li className="text-red-600 font-medium">• This ticket has been cancelled</li>
                    )}
                  </ul>
                </div>

                {/* Operator Information */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Operator Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                      <strong>Operator:</strong> {selectedBookingData.fullName || operatorInfo?.fullName || 'N/A'}
                    </div>
                    <div>
                      <strong>Contact:</strong> {operatorInfo?.mobileNumber || operatorInfo?.mobileNumber || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowTicketModal(false);
                      viewProfileDetails(selectedBookingData);
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    View Profile
                  </button>

                  {selectedBookingData.paymentStatus === 'completed' && (
                    <button
                      onClick={() => {
                        setShowTicketModal(false);
                        cancelTicket(selectedBookingData);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Ticket
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorBookings;
