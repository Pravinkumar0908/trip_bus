// pages/MyBookings.js - Fully Responsive Version
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import Navbar from '../components/Navbar';
import { 
  FaBus, 
  FaTicketAlt, 
  FaCalendarAlt, 
  FaClock, 
  FaRupeeSign, 
  FaUser, 
  FaRoute, 
  FaDownload, 
  FaTimes, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaHistory,
  FaFilter,
  FaSearch,
  FaEye,
  FaPrint,
  FaShare,
  FaStopwatch,
  FaUserCheck,
  FaDatabase,
  FaUsers
} from 'react-icons/fa';

const MyBookings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Firebase Auth State Detection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('🔥 Auth State Changed in MyBookings:', currentUser ? `User: ${currentUser.email}` : 'No user');
      
      if (currentUser) {
        setUser(currentUser);
        fetchBookingsFromFirebase(currentUser.uid);
      } else {
        console.log('❌ No user logged in, redirecting to login...');
        navigate('/login');
      }
      setUserLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch bookings from Firebase
  const fetchBookingsFromFirebase = async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔥 Fetching bookings for user UID:', userId);

      const paymentsRef = collection(db, 'payments');
      const paymentsQuery = query(
        paymentsRef, 
        where('userId', '==', userId)
      );

      console.log('🔥 Executing payments query without orderBy...');
      const paymentsSnapshot = await getDocs(paymentsQuery);

      if (paymentsSnapshot.empty) {
        console.log('📋 No payments found for user');
        
        console.log('🔄 Trying fallback query with email...');
        const fallbackQuery = query(
          paymentsRef,
          where('userEmail', '==', user?.email)
        );
        
        const fallbackSnapshot = await getDocs(fallbackQuery);
        
        if (fallbackSnapshot.empty) {
          console.log('📋 No payments found with email either');
          setBookings([]);
          setLoading(false);
          return;
        } else {
          console.log(`✅ Fallback query found ${fallbackSnapshot.docs.length} records`);
          processPaymentDocuments(fallbackSnapshot.docs);
          return;
        }
      }

      console.log(`✅ Found ${paymentsSnapshot.docs.length} payment records`);
      processPaymentDocuments(paymentsSnapshot.docs);

    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      setError(`Failed to fetch bookings: ${error.message}`);
      setLoading(false);
    }
  };

  // Process payment documents
  const processPaymentDocuments = async (paymentDocs) => {
    try {
      const bookingsPromises = paymentDocs.map(async (paymentDoc) => {
        const paymentData = paymentDoc.data();
        console.log('💳 Processing payment:', paymentDoc.id);

        try {
          const passengersRef = collection(db, 'passengerinfo');
          const passengersQuery = query(
            passengersRef,
            where('bookingId', '==', paymentData.bookingId)
          );

          const passengersSnapshot = await getDocs(passengersQuery);
          const passengers = passengersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          console.log(`👥 Found ${passengers.length} passengers for booking ${paymentData.bookingId}`);

          let status = 'confirmed';
          try {
            const travelDate = new Date(paymentData.busDetails?.date || paymentData.createdAt?.toDate());
            const currentDate = new Date();
            
            if (travelDate < currentDate) {
              status = 'completed';
            } else if (paymentData.paymentStatus === 'cancelled') {
              status = 'cancelled';
            }
          } catch (dateError) {
            console.log('⚠️ Error parsing date:', dateError);
            status = 'confirmed';
          }

          const seatNumbers = paymentData.formattedSeatNumbers?.map(seat => 
            seat.seatName || seat.originalSeatId
          ) || paymentData.seatNumbers?.map(seatId => {
            try {
              const parts = seatId.split('-');
              if (parts.length >= 3) {
                const row = parseInt(parts[1]);
                const col = parseInt(parts[2]);
                const seatLetter = String.fromCharCode(65 + row);
                const seatNumber = col + 1;
                return `${seatLetter}${seatNumber}`;
              }
              return seatId;
            } catch (e) {
              return seatId;
            }
          }) || [];

          const booking = {
            id: paymentDoc.id,
            bookingId: paymentData.bookingId,
            transactionId: paymentData.transactionId,
            
            busName: paymentData.operatorName || 'Bus Service',
            busNumber: paymentData.busDetails?.busNumber || 'N/A',
            busType: paymentData.busDetails?.busType || 'AC Sleeper',
            
            route: `${paymentData.boardingPoint?.name || paymentData.busDetails?.from || 'Source'} → ${paymentData.droppingPoint?.name || paymentData.busDetails?.to || 'Destination'}`,
            from: paymentData.busDetails?.from || 'Source',
            to: paymentData.busDetails?.to || 'Destination',
            boardingPoint: paymentData.boardingPoint?.name || paymentData.busDetails?.from || 'Boarding Point',
            droppingPoint: paymentData.droppingPoint?.name || paymentData.busDetails?.to || 'Dropping Point',
            date: paymentData.busDetails?.date || new Date().toISOString().split('T')[0],
            duration: paymentData.busDetails?.duration || 'N/A',
            
            departureTime: paymentData.boardingPoint?.time || '00:00',
            arrivalTime: paymentData.droppingPoint?.time || '00:00',
            boardingAddress: paymentData.boardingPoint?.address || 'N/A',
            droppingAddress: paymentData.droppingPoint?.address || 'N/A',
            
            passengerName: passengers.length > 0 ? passengers[0].name : (paymentData.userName || 'Passenger'),
            passengerCount: paymentData.passengerCount || passengers.length || 1,
            passengers: passengers,
            seatNumbers: seatNumbers,
            
            phoneNumber: paymentData.contactDetails?.phone || paymentData.userPhone || 'N/A',
            email: paymentData.contactDetails?.email || paymentData.userEmail || user?.email,
            
            totalAmount: paymentData.totalAmount || 0,
            paymentMethod: paymentData.paymentMethod || 'N/A',
            
            bookingDate: paymentData.createdAt?.toDate ? 
              paymentData.createdAt.toDate().toLocaleDateString('en-IN') : 
              new Date().toLocaleDateString('en-IN'),
            status: status,
            pnr: paymentData.bookingId || `PNR${Date.now()}`,
            
            operatorId: paymentData.operatorId || null,
            amenities: ['WiFi', 'Charging Point', 'Water Bottle'],
            
            createdAtTimestamp: paymentData.createdAt?.toDate ? 
              paymentData.createdAt.toDate().getTime() : 
              Date.now(),
            
            rawPaymentData: paymentData,
            rawPassengers: passengers
          };

          console.log('✅ Formatted booking:', booking.bookingId);
          return booking;

        } catch (passengerError) {
          console.error('❌ Error fetching passengers for booking:', paymentData.bookingId, passengerError);
          
          return {
            id: paymentDoc.id,
            bookingId: paymentData.bookingId,
            busName: paymentData.operatorName || 'Bus Service',
            busNumber: paymentData.busDetails?.busNumber || 'N/A',
            route: `${paymentData.busDetails?.from || 'Source'} → ${paymentData.busDetails?.to || 'Destination'}`,
            from: paymentData.busDetails?.from || 'Source',
            to: paymentData.busDetails?.to || 'Destination',
            boardingPoint: paymentData.boardingPoint?.name || 'Boarding Point',
            droppingPoint: paymentData.droppingPoint?.name || 'Dropping Point',
            date: paymentData.busDetails?.date || new Date().toISOString().split('T')[0],
            passengerName: paymentData.userName || 'Passenger',
            totalAmount: paymentData.totalAmount || 0,
            status: 'confirmed',
            pnr: paymentData.bookingId,
            createdAtTimestamp: paymentData.createdAt?.toDate ? 
              paymentData.createdAt.toDate().getTime() : 
              Date.now(),
            error: 'Could not fetch passenger details'
          };
        }
      });

      const processedBookings = await Promise.all(bookingsPromises);
      
      const sortedBookings = processedBookings
        .filter(booking => booking !== null)
        .sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
      
      console.log(`✅ Successfully processed and sorted ${sortedBookings.length} bookings`);
      setBookings(sortedBookings);

    } catch (error) {
      console.error('❌ Error processing bookings:', error);
      setError(`Failed to process bookings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = 
      booking.busName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.route?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pnr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      confirmed: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <FaCheckCircle className="text-green-600 text-xs" />,
        text: 'Confirmed'
      },
      completed: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <FaCheckCircle className="text-blue-600 text-xs" />,
        text: 'Completed'
      },
      cancelled: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <FaTimes className="text-red-600 text-xs" />,
        text: 'Cancelled'
      }
    };

    const badge = badges[status] || badges.confirmed;
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.icon}
        <span>{badge.text}</span>
      </span>
    );
  };

  // Open booking details modal
  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  // Show loading screen while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Checking Authentication</h2>
            <p className="text-gray-600 text-sm">Please wait while we verify your login...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Loading your bookings...</p>
            {user && (
              <p className="text-sm text-gray-500 mt-2">Fetching data for: {user.email}</p>
            )}
            <p className="text-xs text-blue-600 mt-1">No database index required ✅</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Main Content */}
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header - Mobile Optimized */}
          <div className="mb-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center justify-center sm:justify-start space-x-3 mb-2">
                <FaHistory className="text-red-600" />
                <span>My Bookings</span>
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mb-3">Manage and track all your bus bookings</p>
              
              {/* User Info Display */}
              {user && (
                <div className="text-xs sm:text-sm text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg inline-block mb-2">
                  <FaUserCheck className="inline mr-2" />
                  {user.email}
                </div>
              )}
              
              {error && (
                <div className="text-xs sm:text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg inline-block">
                  <FaExclamationTriangle className="inline mr-2" />
                  {error}
                </div>
              )}
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2 mt-4">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Total: {bookings.length}
              </span>
              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <FaDatabase className="inline mr-1" />
                Live Data
              </div>
            </div>
          </div>

          {/* Filters and Search - Mobile Optimized */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            
            {/* Status Filter - Mobile Scrollable */}
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <FaFilter className="text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Filter by Status</span>
              </div>
              
              <div className="flex overflow-x-auto pb-2 space-x-2">
                {[
                  { key: 'all', label: 'All', count: bookings.length },
                  { key: 'confirmed', label: 'Upcoming', count: bookings.filter(b => b.status === 'confirmed').length },
                  { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
                  { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length }
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === key
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search by bus name, route, PNR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full text-sm"
              />
            </div>
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
              <FaTicketAlt className="text-4xl sm:text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No bookings found</h3>
              <p className="text-gray-500 mb-6 text-sm sm:text-base">
                {searchTerm ? 'Try adjusting your search terms' : 
                 bookings.length === 0 ? 'You have no bookings yet' : 'You have no bookings in this category'}
              </p>
              {bookings.length === 0 && (
                <button
                  onClick={() => navigate('/')}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
                >
                  Book Your First Trip
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
                  
                  {/* Mobile Card Layout */}
                  <div className="block sm:hidden">
                    
                    {/* Mobile Header */}
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <FaBus className="text-xl flex-shrink-0" />
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold truncate">{booking.busName}</h3>
                            <p className="text-red-100 text-sm">{booking.busNumber}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-lg font-bold">₹{booking.totalAmount}</div>
                          <div className="text-red-100 text-xs">PNR: {booking.pnr}</div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Content */}
                    <div className="p-4 space-y-4">
                      
                      {/* Route with Arrow */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-center flex-1">
                            <div className="font-semibold text-gray-900 text-sm">
                              {booking.boardingPoint || booking.from}
                            </div>
                            <div className="text-xs text-gray-500">{booking.departureTime}</div>
                          </div>
                          
                          <div className="flex-shrink-0 px-4">
                            <div className="flex items-center space-x-1 text-gray-400">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <div className="w-8 h-0.5 bg-gray-400"></div>
                              <FaBus className="text-xs" />
                              <div className="w-8 h-0.5 bg-gray-400"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            </div>
                            <div className="text-xs text-gray-500 text-center mt-1">{booking.duration}</div>
                          </div>
                          
                          <div className="text-center flex-1">
                            <div className="font-semibold text-gray-900 text-sm">
                              {booking.droppingPoint || booking.to}
                            </div>
                            <div className="text-xs text-gray-500">{booking.arrivalTime}</div>
                          </div>
                        </div>
                      </div>

                      {/* Passenger & Travel Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <FaUser className="text-red-600 text-xs" />
                            <span className="text-gray-500">Passenger</span>
                          </div>
                          <div className="font-medium text-gray-900 truncate">{booking.passengerName}</div>
                          <div className="text-xs text-gray-500">
                            {booking.passengerCount > 1 ? `${booking.passengerCount} Passengers` : '1 Passenger'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <FaCalendarAlt className="text-red-600 text-xs" />
                            <span className="text-gray-500">Travel Date</span>
                          </div>
                          <div className="font-medium text-gray-900">{booking.date}</div>
                          <div className="text-xs text-gray-500">Booked: {booking.bookingDate}</div>
                        </div>
                      </div>

                      {/* Seat Info */}
                      {booking.seatNumbers && booking.seatNumbers.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <FaTicketAlt className="text-red-600 text-xs" />
                            <span className="text-gray-500 text-sm">Seat Numbers</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {booking.seatNumbers.map((seat, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {seat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(booking.status)}
                        </div>
                        
                        <button
                          onClick={() => openBookingDetails(booking)}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium"
                        >
                          <FaEye className="text-xs" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    
                    {/* Desktop Header */}
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <FaBus className="text-2xl" />
                          <div>
                            <h3 className="text-lg lg:text-xl font-semibold">{booking.busName}</h3>
                            <p className="text-red-100 text-sm">{booking.busNumber}</p>
                            {booking.operatorId && (
                              <p className="text-red-200 text-xs">Operator ID: {booking.operatorId}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl lg:text-2xl font-bold">₹{booking.totalAmount}</div>
                          <div className="text-red-100 text-sm">PNR: {booking.pnr}</div>
                          <div className="text-red-200 text-xs">Booking: {booking.bookingId}</div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Content */}
                    <div className="p-4 lg:p-6">
                      <div className="grid md:grid-cols-3 gap-6">
                        
                        {/* Route Info */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <FaRoute className="text-red-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                {booking.boardingPoint || booking.from}
                              </div>
                              <div className="text-sm text-gray-500">to</div>
                              <div className="font-semibold text-gray-900">
                                {booking.droppingPoint || booking.to}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <FaCalendarAlt className="text-red-600" />
                            <div>
                              <div className="font-medium text-gray-900">{booking.date}</div>
                              <div className="text-sm text-gray-500">Travel Date</div>
                            </div>
                          </div>
                        </div>

                        {/* Time Info */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <FaClock className="text-red-600" />
                            <div>
                              <div className="font-medium text-gray-900">{booking.departureTime}</div>
                              <div className="text-sm text-gray-500">Departure</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <FaStopwatch className="text-red-600" />
                            <div>
                              <div className="font-medium text-gray-900">{booking.duration}</div>
                              <div className="text-sm text-gray-500">Journey Time</div>
                            </div>
                          </div>
                        </div>

                        {/* Passenger Info */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <FaUser className="text-red-600" />
                            <div>
                              <div className="font-medium text-gray-900">{booking.passengerName}</div>
                              <div className="text-sm text-gray-500">
                                {booking.passengerCount > 1 ? `${booking.passengerCount} Passengers` : 'Passenger'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <FaTicketAlt className="text-red-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                Seat {booking.seatNumbers?.length > 0 ? booking.seatNumbers.join(', ') : 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">{booking.busType}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 pt-6 border-t border-gray-200 space-y-4 sm:space-y-0">
                        <div className="flex flex-wrap items-center gap-3">
                          {getStatusBadge(booking.status)}
                          <span className="text-sm text-gray-500">
                            Booked on {booking.bookingDate}
                          </span>
                          {booking.paymentMethod && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              Via {booking.paymentMethod}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => openBookingDetails(booking)}
                            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            <FaEye className="text-xs" />
                            <span>View Details</span>
                          </button>
                          
                          <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                            <FaDownload className="text-xs" />
                            <span>Download</span>
                          </button>
                          
                          {booking.status === 'confirmed' && (
                            <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium">
                              <FaTimes className="text-xs" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Booking Details Modal - Responsive */}
          {showModal && selectedBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sm:p-6 rounded-t-2xl sticky top-0 z-10">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold">Booking Details</h2>
                      <p className="text-red-100 text-sm sm:text-base">PNR: {selectedBooking.pnr}</p>
                      <p className="text-red-200 text-xs sm:text-sm truncate">Booking ID: {selectedBooking.bookingId}</p>
                      {selectedBooking.transactionId && (
                        <p className="text-red-200 text-xs sm:text-sm truncate">Transaction ID: {selectedBooking.transactionId}</p>
                      )}
                    </div>
                    <button
                      onClick={closeModal}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0 ml-2"
                    >
                      <FaTimes className="text-lg sm:text-xl" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  
                  {/* Bus Info */}
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm sm:text-base">
                      <FaBus className="text-red-600 mr-2" />
                      Bus Information
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Bus Name</span>
                        <div className="font-medium">{selectedBooking.busName}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Bus Number</span>
                        <div className="font-medium">{selectedBooking.busNumber}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Bus Type</span>
                        <div className="font-medium">{selectedBooking.busType}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Operator ID</span>
                        <div className="font-medium">{selectedBooking.operatorId || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Journey Info */}
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm sm:text-base">
                      <FaRoute className="text-red-600 mr-2" />
                      Journey Information
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Boarding Point</span>
                        <div className="font-medium">{selectedBooking.boardingPoint || selectedBooking.from}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Dropping Point</span>
                        <div className="font-medium">{selectedBooking.droppingPoint || selectedBooking.to}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Date</span>
                        <div className="font-medium">{selectedBooking.date}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Duration</span>
                        <div className="font-medium">{selectedBooking.duration}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Departure</span>
                        <div className="font-medium">{selectedBooking.departureTime}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Arrival</span>
                        <div className="font-medium">{selectedBooking.arrivalTime}</div>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Info */}
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm sm:text-base">
                      <FaUsers className="text-red-600 mr-2" />
                      Passenger Information ({selectedBooking.passengerCount || 1})
                    </h3>
                    
                    {selectedBooking.passengers && selectedBooking.passengers.length > 0 ? (
                      <div className="space-y-3">
                        {selectedBooking.passengers.map((passenger, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500 text-xs">Name</span>
                                <div className="font-medium">{passenger.name}</div>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs">Age & Gender</span>
                                <div className="font-medium">{passenger.age}yrs, {passenger.gender}</div>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs">Seat</span>
                                <div className="font-medium">{passenger.seatName || passenger.seatId}</div>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs">ID Type</span>
                                <div className="font-medium">{passenger.idType}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs sm:text-sm">Name</span>
                          <div className="font-medium">{selectedBooking.passengerName}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs sm:text-sm">Phone</span>
                          <div className="font-medium">{selectedBooking.phoneNumber}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs sm:text-sm">Email</span>
                          <div className="font-medium text-xs sm:text-sm break-all">{selectedBooking.email}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs sm:text-sm">Seat Numbers</span>
                          <div className="font-medium">{selectedBooking.seatNumbers?.join(', ') || 'N/A'}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs sm:text-sm">Status</span>
                          <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs sm:text-sm">Payment Method</span>
                          <div className="font-medium">{selectedBooking.paymentMethod || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm sm:text-base">
                      <FaRupeeSign className="text-red-600 mr-2" />
                      Payment Information
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Total Amount</span>
                        <div className="text-xl sm:text-2xl font-bold text-red-600">₹{selectedBooking.totalAmount}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Booking Date</span>
                        <div className="font-medium">{selectedBooking.bookingDate}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Transaction ID</span>
                        <div className="font-medium text-xs break-all">{selectedBooking.transactionId || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs sm:text-sm">Booking ID</span>
                        <div className="font-medium text-xs break-all">{selectedBooking.bookingId}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                      <FaDownload />
                      <span>Download Ticket</span>
                    </button>
                    
                    <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                      <FaPrint />
                      <span>Print Ticket</span>
                    </button>
                    
                    <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm">
                      <FaShare />
                      <span>Share</span>
                    </button>
                    
                    {selectedBooking.status === 'confirmed' && (
                      <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
                        <FaTimes />
                        <span>Cancel Booking</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
