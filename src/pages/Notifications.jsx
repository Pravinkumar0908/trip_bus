import React, { useState, useMemo, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import Navbar from '../components/Navbar';

// Notification types & filter data
const types = [
  { code: "success", label: "Success" },
  { code: "error", label: "Error" },
  { code: "info", label: "Info" },
  { code: "warning", label: "Warning" }
];

// Icons (SVG)
const icons = {
  success: (
    <svg className="w-6 h-6 text-white bg-green-600 rounded-full p-1" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="green" />
      <path stroke="white" strokeWidth="2" d="M16 10l-4.5 4.5L8 12" />
    </svg>
  ),
  error: (
    <svg className="w-6 h-6 text-white bg-red-600 rounded-full p-1" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="red" />
      <path stroke="white" strokeWidth="2" d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  info: (
    <svg className="w-6 h-6 text-white bg-blue-600 rounded-full p-1" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#2563eb" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="white" fontFamily="Arial">i</text>
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6 text-black bg-yellow-300 rounded-full p-1" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#fde047" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="black" fontFamily="Arial">!</text>
    </svg>
  ),
};

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterRead, setFilterRead] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [userBookings, setUserBookings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dynamic User ID Detection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setUserId(user.uid);
      } else {
        const storedUserId = localStorage.getItem('userId') || 
                           localStorage.getItem('userToken') ||
                           localStorage.getItem('currentUserId');
        
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          const sessionUserId = sessionStorage.getItem('userId') ||
                               sessionStorage.getItem('userToken');
          
          if (sessionUserId) {
            setUserId(sessionUserId);
          } else {
            setLoading(false);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Create notifications from payments data
  const createNotificationsFromPayments = (paymentsData) => {
    const generatedNotifications = [];

    paymentsData.forEach(payment => {
      const currentTime = new Date();

      // 1. Booking Confirmation Notification
      if (payment.paymentStatus === 'completed') {
        generatedNotifications.push({
          id: `booking_${payment.bookingId}`,
          type: 'success',
          title: 'Booking Confirmed! ✅',
          message: `Your bus ticket from ${payment.boardingPoint?.name || 'Source'} to ${payment.droppingPoint?.name || 'Destination'} is confirmed.`,
          bookingDetails: {
            bookingId: payment.bookingId,
            busNumber: payment.busNumber,
            busType: payment.busDetails?.busType,
            date: payment.busDetails?.date,
            duration: payment.busDetails?.duration,
            boardingPoint: payment.boardingPoint?.name,
            boardingTime: payment.boardingPoint?.time,
            droppingPoint: payment.droppingPoint?.name,
            droppingTime: payment.droppingPoint?.time,
            totalAmount: payment.totalAmount,
            seatNumbers: payment.formattedSeatNumbers?.map(seat => seat.seatWithDeck).join(', '),
            userName: payment.userName,
            userEmail: payment.userEmail
          },
          read: false,
          createdAt: payment.createdAt,
          date: new Date(payment.createdAt.toDate()).toLocaleString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        });
      }

      // 2. Departure Alert (10 minutes before)
      if (payment.paymentStatus === 'completed' && payment.boardingPoint?.time && payment.busDetails?.date) {
        try {
          const [hours, minutes] = payment.boardingPoint.time.split(':');
          const departureDateTime = new Date(payment.busDetails.date);
          departureDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          const timeDiff = departureDateTime.getTime() - currentTime.getTime();
          const minutesDiff = Math.floor(timeDiff / (1000 * 60));

          if (minutesDiff <= 10 && minutesDiff > 0) {
            generatedNotifications.push({
              id: `departure_${payment.bookingId}`,
              type: 'warning',
              title: 'Bus Departure Alert! 🚌',
              message: `Your bus ${payment.busNumber} is departing in ${minutesDiff} minutes from ${payment.boardingPoint.name}. Please reach the boarding point now!`,
              bookingDetails: {
                bookingId: payment.bookingId,
                busNumber: payment.busNumber,
                boardingPoint: payment.boardingPoint?.name,
                boardingTime: payment.boardingPoint?.time,
                minutesLeft: minutesDiff,
                busType: payment.busDetails?.busType
              },
              read: false,
              createdAt: new Date(),
              date: new Date().toLocaleString('en-IN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            });
          }
        } catch (error) {
          // Silent error handling
        }
      }

      // 3. Arrival Alert (10 minutes before)
      if (payment.paymentStatus === 'completed' && payment.boardingPoint?.time && payment.droppingPoint?.time && payment.busDetails?.date) {
        try {
          const [depHours, depMinutes] = payment.boardingPoint.time.split(':');
          const departureDateTime = new Date(payment.busDetails.date);
          departureDateTime.setHours(parseInt(depHours), parseInt(depMinutes), 0, 0);
          
          const durationMatch = payment.busDetails.duration.match(/(\d+)h\s*(\d+)m/);
          if (durationMatch) {
            const durationHours = parseInt(durationMatch[1]);
            const durationMinutes = parseInt(durationMatch[2]);
            
            const arrivalDateTime = new Date(departureDateTime.getTime() + (durationHours * 60 + durationMinutes) * 60000);
            const timeDiff = arrivalDateTime.getTime() - currentTime.getTime();
            const minutesDiff = Math.floor(timeDiff / (1000 * 60));

            if (minutesDiff <= 10 && minutesDiff > 0) {
              generatedNotifications.push({
                id: `arrival_${payment.bookingId}`,
                type: 'info',
                title: 'Bus Arrival Alert! 🏁',
                message: `Your bus ${payment.busNumber} will arrive at ${payment.droppingPoint.name} in ${minutesDiff} minutes. Please be ready to deboard!`,
                bookingDetails: {
                  bookingId: payment.bookingId,
                  busNumber: payment.busNumber,
                  droppingPoint: payment.droppingPoint?.name,
                  droppingTime: payment.droppingPoint?.time,
                  minutesLeft: minutesDiff,
                  busType: payment.busDetails?.busType
                },
                read: false,
                createdAt: new Date(),
                date: new Date().toLocaleString('en-IN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              });
            }
          }
        } catch (error) {
          // Silent error handling
        }
      }

      // 4. Cancellation Notification
      if (payment.paymentStatus === 'cancelled') {
        generatedNotifications.push({
          id: `cancelled_${payment.bookingId}`,
          type: 'error',
          title: 'Booking Cancelled ❌',
          message: `Your booking ${payment.bookingId} has been cancelled. Refund will be processed as per policy.`,
          bookingDetails: {
            bookingId: payment.bookingId,
            busNumber: payment.busNumber,
            totalAmount: payment.totalAmount,
            cancelledAt: payment.cancelledAt,
            busType: payment.busDetails?.busType
          },
          read: false,
          createdAt: payment.cancelledAt || payment.createdAt,
          date: new Date(payment.cancelledAt?.toDate() || payment.createdAt.toDate()).toLocaleString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        });
      }
    });

    return generatedNotifications;
  };

  // Fetch user's payments from Firestore
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const paymentsRef = collection(db, 'payments');
    const userPaymentsQuery = query(
      paymentsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(userPaymentsQuery, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserBookings(paymentsData);
      const generatedNotifications = createNotificationsFromPayments(paymentsData);
      setNotifications(generatedNotifications);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Set up interval for time-based notifications
  useEffect(() => {
    if (!userId || userBookings.length === 0) return;

    const checkTimeBasedNotifications = () => {
      const timeBasedNotifications = createNotificationsFromPayments(userBookings);
      setNotifications(timeBasedNotifications);
    };

    const interval = setInterval(checkTimeBasedNotifications, 60000);
    return () => clearInterval(interval);
  }, [userId, userBookings]);

  // FILTER LOGIC
  const filtered = useMemo(() => {
    return notifications.filter(n => {
      let typeMatch = filterType === "all" || n.type === filterType;
      let readMatch =
        filterRead === "all" ||
        (filterRead === "read" && n.read) ||
        (filterRead === "unread" && !n.read);
      let searchMatch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase()) ||
        (n.bookingDetails?.bookingId && n.bookingDetails.bookingId.toLowerCase().includes(search.toLowerCase()));
      return typeMatch && readMatch && searchMatch;
    });
  }, [notifications, filterType, filterRead, search]);

  // Mark as read/unread
  const toggleRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: !notif.read } : notif
      )
    );
  };

  // Delete notification
  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Bulk actions
  const markAllRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteAll = () => {
    setNotifications([]);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-16 min-h-screen flex items-center justify-center bg-gray-100 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your notifications...</p>
          </div>
        </div>
      </>
    );
  }

  if (!userId) {
    return (
      <>
        <Navbar />
        <div className="pt-16 min-h-screen flex items-center justify-center bg-gray-100 px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <p className="text-xl text-gray-600 mb-4">Please login to view notifications</p>
            <p className="text-sm text-gray-500">User authentication required</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-gray-100">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-red-600">
              Notifications 
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 bg-white p-4 lg:p-6 order-2 lg:order-1">
            {/* Desktop Header */}
            <div className="hidden lg:flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-red-600">
                  Your Travel Notifications 
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-sm px-2 py-1 rounded-full animate-bounce">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  User: {currentUser?.email || userBookings[0]?.userEmail || 'Unknown'} | 
                  ID: {userId?.slice(0, 8)}...
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={markAllRead}
                  className="text-sm px-3 lg:px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium transition-colors"
                >
                  Mark all read
                </button>
                <button
                  onClick={deleteAll}
                  className="text-sm px-3 lg:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="lg:hidden flex gap-2 mb-4">
              <button
                onClick={markAllRead}
                className="flex-1 text-sm px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium transition-colors"
              >
                Mark all read
              </button>
              <button
                onClick={deleteAll}
                className="flex-1 text-sm px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
            
            <div>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  <p className="text-lg">No notifications found</p>
                  <p className="text-sm mt-2">Book a bus ticket to receive travel updates!</p>
                  {userBookings.length === 0 && (
                    <p className="text-xs mt-2 text-red-500">No bookings found for this user</p>
                  )}
                </div>
              )}
              
              <ul className="space-y-3">
                {filtered.map(notif => (
                  <li
                    key={notif.id}
                    className={`
                      flex flex-col sm:flex-row items-start gap-4 px-4 lg:px-5 py-4 rounded-xl border transition-all duration-300
                      ${notif.read 
                        ? "bg-gray-50 border-gray-200 hover:bg-gray-100" 
                        : "bg-red-50 border-red-200 shadow-lg hover:shadow-xl"
                      }
                    `}
                  >
                    <div className="flex-shrink-0 mt-1">{icons[notif.type]}</div>
                    <div className="flex-grow min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <span className="font-bold text-gray-900 text-base lg:text-lg">{notif.title}</span>
                        {!notif.read && (
                          <span className="inline-flex text-xs bg-red-500 text-white rounded-full px-2 py-1 animate-pulse font-medium">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">{notif.message}</p>
                      
                      {/* Booking Details */}
                      {notif.bookingDetails && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-2 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex justify-between">
                              <span className="font-medium text-blue-600">Booking ID:</span>
                              <span className="font-mono text-right text-xs break-all">{notif.bookingDetails.bookingId}</span>
                            </div>
                            {notif.bookingDetails.busNumber && (
                              <div className="flex justify-between">
                                <span className="font-medium text-green-600">Bus:</span>
                                <span className="text-right">{notif.bookingDetails.busNumber}</span>
                              </div>
                            )}
                            {notif.bookingDetails.busType && (
                              <div className="flex justify-between">
                                <span className="font-medium text-purple-600">Type:</span>
                                <span className="text-right">{notif.bookingDetails.busType}</span>
                              </div>
                            )}
                            {notif.bookingDetails.boardingPoint && (
                              <div className="flex justify-between">
                                <span className="font-medium text-orange-600">From:</span>
                                <span className="text-right text-xs">{notif.bookingDetails.boardingPoint} ({notif.bookingDetails.boardingTime})</span>
                              </div>
                            )}
                            {notif.bookingDetails.droppingPoint && (
                              <div className="flex justify-between">
                                <span className="font-medium text-indigo-600">To:</span>
                                <span className="text-right text-xs">{notif.bookingDetails.droppingPoint} ({notif.bookingDetails.droppingTime})</span>
                              </div>
                            )}
                            {notif.bookingDetails.seatNumbers && (
                              <div className="flex justify-between col-span-1 sm:col-span-2">
                                <span className="font-medium text-pink-600">Seats:</span>
                                <span className="text-right text-xs">{notif.bookingDetails.seatNumbers}</span>
                              </div>
                            )}
                            {notif.bookingDetails.totalAmount && (
                              <div className="flex justify-between">
                                <span className="font-medium text-red-600">Amount:</span>
                                <span className="font-bold text-right">₹{notif.bookingDetails.totalAmount}</span>
                              </div>
                            )}
                            {notif.bookingDetails.minutesLeft && (
                              <div className="flex justify-between col-span-1 sm:col-span-2">
                                <span className="font-medium text-yellow-600">Time Left:</span>
                                <span className="font-bold text-yellow-700 animate-pulse">{notif.bookingDetails.minutesLeft} minutes</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {notif.date}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 flex-shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => toggleRead(notif.id)}
                        className={`flex-1 sm:flex-none text-xs px-3 py-2 rounded-lg transition-all duration-200 font-medium
                          ${notif.read
                            ? "bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md"
                            : "bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg"}
                        `}
                      >
                        {notif.read ? "Mark Unread" : "Mark Read"}
                      </button>
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="flex-1 sm:flex-none text-xs px-3 py-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-all duration-200 font-medium hover:shadow-md"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <aside className={`
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            fixed lg:relative top-0 right-0 h-full lg:h-auto w-80 sm:w-96 lg:w-80 
            bg-white border-l border-gray-200 p-4 lg:p-6 z-50 
            transform transition-transform duration-300 ease-in-out
            order-1 lg:order-2 overflow-y-auto
          `}>
            {/* Mobile Close Button */}
            <div className="lg:hidden flex justify-between items-center mb-4 pb-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">Filter & Search</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <h3 className="hidden lg:block text-lg font-bold text-gray-800 mb-4">Filter & Search</h3>
            
            {/* User Info */}
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Current User
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span>Email:</span>
                  <span className="font-medium text-green-700 break-all">
                    {currentUser?.email || userBookings[0]?.userEmail || 'Not available'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span>User ID:</span>
                  <span className="font-mono text-green-600">
                    {userId ? `${userId.slice(0, 8)}...` : 'Not found'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span>Name:</span>
                  <span className="font-medium text-green-700">
                    {currentUser?.displayName || userBookings[0]?.userName || 'Not available'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block font-medium mb-2 text-gray-700">Type</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              >
                <option value="all">All Types</option>
                {types.map(t => (
                  <option key={t.code} value={t.code}>{t.label}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block font-medium mb-2 text-gray-700">Read Status</label>
              <select
                value={filterRead}
                onChange={e => setFilterRead(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              >
                <option value="all">All</option>
                <option value="unread">Unread only</option>
                <option value="read">Read only</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block font-medium mb-2 text-gray-700">Search</label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                placeholder="Search by booking ID, bus number..."
              />
            </div>

            {/* User Bookings Summary */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Your Bookings
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>Total:</span>
                  <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded">
                    {userBookings.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completed:</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                    {userBookings.filter(b => b.paymentStatus === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cancelled:</span>
                  <span className="font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                    {userBookings.filter(b => b.paymentStatus === 'cancelled').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Stats */}
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                Notifications
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>Total:</span>
                  <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded">
                    {notifications.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Unread:</span>
                  <span className="font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                    {notifications.filter(n => !n.read).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Success:</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                    {notifications.filter(n => n.type === 'success').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Warnings:</span>
                  <span className="font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                    {notifications.filter(n => n.type === 'warning').length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-2">
                Powered by <span className="font-bold text-red-500">EasyTrip</span>
              </div>
              <div className="text-gray-300 text-xs">
                Real-time Travel Updates
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default NotificationPage;
