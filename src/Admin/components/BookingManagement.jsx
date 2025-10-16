import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  TicketIcon,
  UserIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  UserGroupIcon} from '@heroicons/react/24/outline';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // view, edit, delete
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalRevenue: 0,
    todayBookings: 0,
    avgBookingValue: 0,
    totalPassengers: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      navigate('/admin-login');
      return;
    }

    fetchBookingsAndPassengers();
  }, [navigate]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, filterStatus, filterPaymentMethod, dateFilter]);

  const fetchBookingsAndPassengers = async () => {
    setLoading(true);
    try {
      // Fetch payments (bookings)
      const paymentsSnapshot = await getDocs(collection(db, 'payments'));
      const paymentsList = [];
      
      paymentsSnapshot.forEach((doc) => {
        paymentsList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Fetch passenger info
      const passengersSnapshot = await getDocs(collection(db, 'passengerInfo'));
      const passengersList = [];
      
      passengersSnapshot.forEach((doc) => {
        passengersList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort payments by creation date (newest first)
      paymentsList.sort((a, b) => {
        const aDate = a.createdAt?.toDate() || new Date(0);
        const bDate = b.createdAt?.toDate() || new Date(0);
        return bDate - aDate;
      });

      setBookings(paymentsList);
      setPassengers(passengersList);
      calculateStats(paymentsList, passengersList);
    } catch (error) {
      console.error('Error fetching bookings and passengers:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsList, passengersList) => {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const stats = {
      total: paymentsList.length,
      completed: paymentsList.filter(payment => payment.paymentStatus === 'completed').length,
      pending: paymentsList.filter(payment => payment.paymentStatus === 'pending').length,
      failed: paymentsList.filter(payment => payment.paymentStatus === 'failed').length,
      totalRevenue: paymentsList
        .filter(payment => payment.paymentStatus === 'completed')
        .reduce((total, payment) => total + (payment.totalAmount || 0), 0),
      todayBookings: paymentsList.filter(payment => {
        const paymentDate = payment.createdAt?.toDate();
        return paymentDate >= todayStart && paymentDate <= todayEnd;
      }).length,
      avgBookingValue: paymentsList.length > 0 
        ? Math.round(paymentsList.reduce((total, payment) => total + (payment.totalAmount || 0), 0) / paymentsList.length)
        : 0,
      totalPassengers: passengersList.length
    };

    setStats(stats);
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userPhone?.includes(searchTerm) ||
        booking.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Payment Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(booking => booking.paymentStatus === filterStatus);
    }

    // Payment Method filter
    if (filterPaymentMethod !== 'all') {
      filtered = filtered.filter(booking => booking.paymentMethod === filterPaymentMethod);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      filtered = filtered.filter(booking => {
        const bookingDate = booking.createdAt?.toDate();
        if (!bookingDate) return false;

        switch (dateFilter) {
          case 'today':
            return bookingDate.toDateString() === today.toDateString();
          case 'yesterday':
            return bookingDate.toDateString() === yesterday.toDateString();
          case 'week':
            return bookingDate >= weekAgo;
          default:
            return true;
        }
      });
    }

    setFilteredBookings(filtered);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await updateDoc(doc(db, 'payments', bookingId), {
        paymentStatus: newStatus,
        updatedAt: new Date(),
        updatedBy: JSON.parse(localStorage.getItem('adminData')).name
      });

      // Log the action
      await addDoc(collection(db, 'adminLogs'), {
        adminId: JSON.parse(localStorage.getItem('adminData')).uid,
        action: 'PAYMENT_STATUS_UPDATE',
        bookingId: bookingId,
        newStatus: newStatus,
        timestamp: serverTimestamp()
      });

      fetchBookingsAndPassengers();
      setShowModal(false);
      alert(`Payment status updated to ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status');
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from payments collection
      await deleteDoc(doc(db, 'payments', bookingId));
      
      // Delete related passenger info
      const relatedPassengers = passengers.filter(p => p.bookingId === selectedBooking.bookingId);
      for (const passenger of relatedPassengers) {
        await deleteDoc(doc(db, 'passengerInfo', passenger.id));
      }
      
      // Log the action
      await addDoc(collection(db, 'adminLogs'), {
        adminId: JSON.parse(localStorage.getItem('adminData')).uid,
        action: 'BOOKING_DELETE',
        bookingId: bookingId,
        timestamp: serverTimestamp()
      });

      fetchBookingsAndPassengers();
      setShowModal(false);
      alert('Booking deleted successfully!');
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Error deleting booking');
    }
  };

  const openModal = (booking, type) => {
    setSelectedBooking(booking);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
    setModalType('view');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'wallet':
        return '💳';
      case 'upi':
        return '📱';
      case 'card':
        return '💳';
      case 'netbanking':
        return '🏦';
      default:
        return '💰';
    }
  };

  const getBookingPassengers = (bookingId) => {
    return passengers.filter(p => p.bookingId === bookingId);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
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
        <div className="text-white text-xl">Loading Bookings...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <TicketIcon className="w-8 h-8 mr-3 text-red-400" />
            Booking Management
          </h1>
          <p className="text-gray-300">
            Manage and monitor all bookings and payments on the platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Bookings"
            value={stats.total}
            icon={TicketIcon}
            color="blue"
            subtitle="All time bookings"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircleIcon}
            color="green"
            subtitle={`${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% success rate`}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={ClockIcon}
            color="yellow"
            subtitle="Awaiting payment"
          />
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={XCircleIcon}
            color="red"
            subtitle="Payment failed"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`₹${(stats.totalRevenue / 100000).toFixed(1)}L`}
            icon={CurrencyRupeeIcon}
            color="green"
            subtitle="Completed payments"
          />
          <StatCard
            title="Today's Bookings"
            value={stats.todayBookings}
            icon={CalendarIcon}
            color="blue"
            subtitle="Bookings made today"
          />
          <StatCard
            title="Avg Booking Value"
            value={`₹${stats.avgBookingValue}`}
            icon={CurrencyRupeeIcon}
            color="purple"
            subtitle="Per booking"
          />
          <StatCard
            title="Total Passengers"
            value={stats.totalPassengers}
            icon={UserGroupIcon}
            color="indigo"
            subtitle="All passengers"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Search bookings, passengers, phone, transaction ID..."
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Payment Methods</option>
                <option value="wallet">Wallet</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="netbanking">Net Banking</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-red-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600/20 border-b border-red-500/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Customer Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Journey Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Booking Info
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Payment Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => {
                    const bookingPassengers = getBookingPassengers(booking.bookingId);
                    return (
                      <tr key={booking.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-full bg-red-600/20 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-red-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {booking.userName || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-400">
                                {booking.userEmail || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-400">
                                {booking.contactDetails?.phone || booking.userPhone || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white flex items-center">
                            {booking.busDetails?.from || 'N/A'}
                            <ArrowRightIcon className="h-4 w-4 mx-2 text-gray-400" />
                            {booking.busDetails?.to || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {booking.busNumber || booking.busDetails?.busNumber || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {booking.busDetails?.date || 'N/A'} • {booking.busDetails?.duration || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white">{booking.bookingId || 'N/A'}</div>
                          <div className="text-sm text-gray-400">
                            {booking.passengerCount || bookingPassengers.length} passenger(s)
                          </div>
                          <div className="text-sm text-gray-400">
                            {booking.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white">₹{booking.totalAmount || 0}</div>
                          <div className="text-sm text-gray-400 flex items-center">
                            <span className="mr-1">{getPaymentMethodIcon(booking.paymentMethod)}</span>
                            {booking.paymentMethod || 'N/A'}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.paymentStatus)}`}>
                            {booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1) || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(booking, 'view')}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => openModal(booking, 'edit')}
                              className="text-green-400 hover:text-green-300 transition-colors"
                              title="Edit Status"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => openModal(booking, 'delete')}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete Booking"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <TicketIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No bookings found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {modalType === 'view' && 'Booking Details'}
                  {modalType === 'edit' && 'Edit Payment Status'}
                  {modalType === 'delete' && 'Delete Booking'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {modalType === 'view' && (
                <div className="space-y-6">
                  {/* Booking Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Booking Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Booking ID</label>
                        <p className="text-white">{selectedBooking.bookingId || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Transaction ID</label>
                        <p className="text-white">{selectedBooking.transactionId || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Booking Date</label>
                        <p className="text-white">{selectedBooking.createdAt?.toDate()?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Total Amount</label>
                        <p className="text-white">₹{selectedBooking.totalAmount || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Payment Method</label>
                        <p className="text-white flex items-center">
                          <span className="mr-2">{getPaymentMethodIcon(selectedBooking.paymentMethod)}</span>
                          {selectedBooking.paymentMethod || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Payment Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.paymentStatus)}`}>
                          {selectedBooking.paymentStatus?.charAt(0).toUpperCase() + selectedBooking.paymentStatus?.slice(1) || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                        <p className="text-white">{selectedBooking.userName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <p className="text-white">{selectedBooking.userEmail || selectedBooking.bookedBy || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                        <p className="text-white">{selectedBooking.contactDetails?.phone || selectedBooking.userPhone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">State</label>
                        <p className="text-white">{selectedBooking.contactDetails?.state || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">WhatsApp Enabled</label>
                        <p className="text-white">{selectedBooking.contactDetails?.whatsappEnabled ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Journey Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Journey Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">From</label>
                        <p className="text-white">{selectedBooking.busDetails?.from || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">To</label>
                        <p className="text-white">{selectedBooking.busDetails?.to || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Bus Number</label>
                        <p className="text-white">{selectedBooking.busNumber || selectedBooking.busDetails?.busNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Bus Type</label>
                        <p className="text-white">{selectedBooking.busDetails?.busType || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Journey Date</label>
                        <p className="text-white">{selectedBooking.busDetails?.date || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Duration</label>
                        <p className="text-white">{selectedBooking.busDetails?.duration || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Boarding & Dropping Points */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Boarding Point</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                          <p className="text-white">{selectedBooking.boardingPoint?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                          <p className="text-white">{selectedBooking.boardingPoint?.address || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
                          <p className="text-white">{selectedBooking.boardingPoint?.time || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Dropping Point</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                          <p className="text-white">{selectedBooking.droppingPoint?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                          <p className="text-white">{selectedBooking.droppingPoint?.address || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
                          <p className="text-white">{selectedBooking.droppingPoint?.time || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seat Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Seat Information</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Selected Seats</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedBooking.formattedSeatNumbers?.map((seat, index) => (
                            <span key={index} className="px-3 py-1 bg-red-600/20 text-red-200 text-sm rounded-full">
                              {seat.seatWithDeck || seat.seatName || 'N/A'}
                            </span>
                          )) || (
                            <span className="text-white">No seats selected</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Passenger Count</label>
                        <p className="text-white">{selectedBooking.passengerCount || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Details */}
                  {getBookingPassengers(selectedBooking.bookingId).length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Passenger Details</h4>
                      <div className="space-y-4">
                        {getBookingPassengers(selectedBooking.bookingId).map((passenger, index) => (
                          <div key={passenger.id} className="border border-gray-600 rounded-lg p-3">
                            <h5 className="text-md font-medium text-white mb-2">Passenger {index + 1}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                                <p className="text-white text-sm">{passenger.name || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Age</label>
                                <p className="text-white text-sm">{passenger.age || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Gender</label>
                                <p className="text-white text-sm">{passenger.gender || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Seat</label>
                                <p className="text-white text-sm">{passenger.seatWithDeck || passenger.seatName || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">ID Type</label>
                                <p className="text-white text-sm">{passenger.idType || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">ID Number</label>
                                <p className="text-white text-sm">{passenger.idNumber || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Operator Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Operator Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Operator Name</label>
                        <p className="text-white">{selectedBooking.operatorName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Operator ID</label>
                        <p className="text-white">{selectedBooking.operatorId || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'edit' && (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Change the payment status of booking: <span className="text-white font-medium">{selectedBooking.bookingId}</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'completed')}
                      className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'pending')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Set Pending
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'failed')}
                      className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Mark Failed
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'delete' && (
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-red-600/20 border border-red-600/30 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3" />
                    <p className="text-red-200">
                      This action cannot be undone. All data associated with this booking including passenger information will be permanently deleted.
                    </p>
                  </div>
                  <p className="text-gray-300">
                    Are you sure you want to delete booking: <span className="text-white font-medium">{selectedBooking.bookingId}</span>?
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleDelete(selectedBooking.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Delete Permanently
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingManagement;
