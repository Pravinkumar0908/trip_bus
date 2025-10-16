// pages/MyWallet.js - Complete Fixed Wallet Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Navbar from '../components/Navbar';
import { 
  FaWallet,
  FaRupeeSign,
  FaPlus,
  FaHistory,
  FaGift,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaUserCheck,
  FaFilter,
  FaSearch,
  FaTimes,
  FaEye,
  FaBus,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaSpinner,
  FaChair,
  FaDownload,
  FaPrint,
  FaShare,
  FaCheckCircle,
  FaInfoCircle
} from 'react-icons/fa';

const MyWallet = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [addingMoney, setAddingMoney] = useState(false);

  // Firebase Auth with better error handling
  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, 
      (currentUser) => {
        if (!mounted) return;
        
        console.log('🔥 Auth State:', currentUser ? currentUser.email : 'No user');
        
        if (currentUser) {
          setUser(currentUser);
          fetchUserData(currentUser);
        } else {
          setError(null);
          navigate('/login');
        }
        setUserLoading(false);
      },
      (authError) => {
        if (!mounted) return;
        console.error('❌ Auth Error:', authError);
        setError(`Authentication error: ${authError.message}`);
        setUserLoading(false);
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [navigate]);

  // Fetch all user data with comprehensive error handling
  const fetchUserData = async (currentUser) => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔥 Fetching data for:', currentUser.email);

      // Get wallet balance
      await fetchWalletBalance(currentUser.uid);
      
      // Get payments
      await fetchPaymentsWithoutIndex(currentUser.uid, currentUser.email);

    } catch (error) {
      console.error('❌ Fetch Error:', error);
      
      // Handle specific error types
      if (error.code === 'permission-denied') {
        setError('Permission denied. Please check your account access.');
      } else if (error.code === 'unavailable') {
        setError('Service temporarily unavailable. Please try again.');
      } else if (error.message.includes('IndexedDB') || error.message.includes('IDBFactory')) {
        setError('Browser storage issue. Try refreshing the page or clearing browser data.');
      } else {
        setError(`Failed to fetch data: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get wallet balance with error handling
  const fetchWalletBalance = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const balance = userData.walletBalance || 0;
        setWalletBalance(balance);
        console.log('💰 Balance:', balance);
      } else {
        console.log('👤 User document not found, creating...');
        // User document doesn't exist, set default balance
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('❌ Wallet balance error:', error);
      setWalletBalance(0); // Fallback to 0
    }
  };

  // Fetch payments WITHOUT requiring indexes
  const fetchPaymentsWithoutIndex = async (userId, userEmail) => {
    try {
      console.log('💳 Fetching payments for:', userEmail);

      // Get ALL payments (no where/orderBy to avoid indexes)
      const paymentsCollection = collection(db, 'payments');
      const snapshot = await getDocs(paymentsCollection);
      
      const userPayments = [];
      
      // Filter in JavaScript instead of Firestore
      snapshot.forEach((doc) => {
        const payment = { id: doc.id, ...doc.data() };
        
        // Check if payment belongs to current user
        const isUserPayment = (
          payment.userEmail === userEmail ||
          payment.userId === userId ||
          payment.bookedBy === userEmail ||
          payment.contactDetails?.email === userEmail
        );

        if (isUserPayment) {
          userPayments.push(payment);
        }
      });

      console.log('✅ Found payments:', userPayments.length);

      // Convert to transactions
      const paymentTransactions = userPayments.map(payment => {
        let createdDate;
        
        try {
          createdDate = payment.createdAt?.toDate ? payment.createdAt.toDate() : new Date();
        } catch (dateError) {
          console.warn('Date conversion error:', dateError);
          createdDate = new Date();
        }
        
        return {
          id: `payment-${payment.id}`,
          type: 'debit',
          amount: payment.totalAmount || 0,
          description: `Bus Booking - ${payment.boardingPoint?.name || 'Source'} → ${payment.droppingPoint?.name || 'Destination'}`,
          method: payment.paymentMethod || 'wallet',
          date: createdDate.toLocaleDateString('en-CA'),
          time: createdDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', minute: '2-digit', hour12: true 
          }),
          status: payment.paymentStatus || 'completed',
          transactionId: payment.transactionId || payment.bookingId || `TXN${payment.id}`,
          bookingId: payment.bookingId,
          route: `${payment.boardingPoint?.name || 'Source'} → ${payment.droppingPoint?.name || 'Destination'}`,
          busNumber: payment.busNumber || payment.busDetails?.busNumber,
          busType: payment.busDetails?.busType,
          seats: payment.formattedSeatNumbers?.map(seat => seat.seatWithDeck).join(', ') || 'N/A',
          operatorName: payment.operatorName,
          contactDetails: payment.contactDetails,
          boardingPoint: payment.boardingPoint,
          droppingPoint: payment.droppingPoint,
          userName: payment.userName || payment.contactDetails?.name,
          userPhone: payment.userPhone || payment.contactDetails?.phone,
          createdAt: createdDate,
          originalPayment: payment
        };
      });

      // Sort by date (newest first) in JavaScript
      paymentTransactions.sort((a, b) => b.createdAt - a.createdAt);

      setTransactions(paymentTransactions);
      console.log('✅ Transactions loaded:', paymentTransactions.length);

    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      
      if (error.message.includes('IndexedDB') || error.message.includes('IDBFactory')) {
        throw new Error('Browser storage issue detected');
      } else {
        throw error;
      }
    }
  };

  // Add money with validation and error handling
  const handleAddMoney = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(addAmount);
    
    if (amount > 50000) {
      alert('Maximum amount allowed is ₹50,000');
      return;
    }

    setAddingMoney(true);

    try {
      const newBalance = walletBalance + amount;
      
      // Update Firestore if user exists
      if (user?.uid) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, {
            walletBalance: newBalance,
            lastUpdated: new Date()
          });
        } catch (firestoreError) {
          console.warn('Firestore update failed:', firestoreError);
          // Continue with local update even if Firestore fails
        }
      }

      // Create transaction record
      const newTransaction = {
        id: `add-${Date.now()}`,
        type: 'credit',
        amount: amount,
        description: 'Money Added to Wallet',
        method: 'UPI',
        date: new Date().toLocaleDateString('en-CA'),
        time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', minute: '2-digit', hour12: true 
        }),
        status: 'completed',
        transactionId: `ADD${Date.now()}`,
        createdAt: new Date()
      };

      // Update local state
      setWalletBalance(newBalance);
      setTransactions([newTransaction, ...transactions]);
      setAddAmount('');
      setShowAddMoney(false);
      
      alert('Money added successfully!');
      
    } catch (error) {
      console.error('❌ Add money error:', error);
      alert('Failed to add money. Please try again.');
    } finally {
      setAddingMoney(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.type === filter;
    const matchesSearch = !searchTerm || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.route && transaction.route.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  // Calculate stats
  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const totalDebit = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);

  // Get transaction badge
  const getTransactionBadge = (type) => {
    if (type === 'credit') {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
          <FaArrowUp className="text-green-600" />
          <span>Credit</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
          <FaArrowDown className="text-red-600" />
          <span>Debit</span>
        </span>
      );
    }
  };

  // Retry function for failed operations
  const retryFetch = () => {
    if (user) {
      fetchUserData(user);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Checking Authentication...</h2>
            <p className="text-gray-500 mt-2">Please wait while we verify your session</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-red-600 mx-auto mb-4" />
            <p className="text-lg font-medium">Loading your wallet...</p>
            {user && <p className="text-sm text-gray-500 mt-2">User: {user.email}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="py-8" style={{ paddingTop: '80px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <FaWallet className="text-red-600" />
              <span>My Wallet</span>
            </h1>
            <p className="text-gray-600 mt-2">Your payment history and wallet balance</p>
            
            {user && (
              <div className="text-sm text-blue-600 font-medium mt-2 bg-blue-50 px-3 py-1 rounded-lg inline-block">
                <FaUserCheck className="inline mr-2" />
                {user.email}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-red-600 mr-2" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Wallet</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <button
                    onClick={retryFetch}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Wallet Balance */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-2">Wallet Balance</h2>
                <div className="text-4xl font-bold mb-4">
                  ₹{walletBalance.toLocaleString('en-IN')}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowAddMoney(true)}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all"
                  >
                    <FaPlus />
                    <span>Add Money</span>
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all">
                    <FaGift />
                    <span>Rewards</span>
                  </button>
                </div>
              </div>
              <div className="hidden md:block">
                <FaRupeeSign className="text-6xl text-white/30" />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FaArrowUp className="text-green-600 text-xl" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{totalCredit.toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm text-gray-500">Money Added</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FaArrowDown className="text-red-600 text-xl" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{totalDebit.toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm text-gray-500">Money Spent</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaHistory className="text-blue-600 text-xl" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
                  <div className="text-sm text-gray-500">Total Transactions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              
              <div className="flex items-center space-x-4">
                <FaFilter className="text-gray-500" />
                <div className="flex space-x-2">
                  {[
                    { key: 'all', label: 'All', count: transactions.length },
                    { key: 'credit', label: 'Added', count: transactions.filter(t => t.type === 'credit').length },
                    { key: 'debit', label: 'Spent', count: transactions.filter(t => t.type === 'debit').length }
                  ].map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filter === key
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 w-full md:w-80"
                />
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <FaHistory className="text-red-600" />
                <span>Transaction History</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredTransactions.length} of {transactions.length} transactions
              </p>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <FaHistory className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
                </h3>
                <p className="text-gray-500">
                  {transactions.length === 0 
                    ? 'Start booking tickets to see your payment history'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.bookingId ? 
                            <FaBus className="text-blue-600 text-xl" /> :
                            transaction.type === 'credit' ? 
                              <FaArrowUp className="text-green-600 text-xl" /> : 
                              <FaArrowDown className="text-red-600 text-xl" />
                          }
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{transaction.description}</div>
                          <div className="text-sm text-gray-500">
                            {transaction.date} at {transaction.time} • {transaction.method}
                          </div>
                          {transaction.route && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center">
                              <FaMapMarkerAlt className="mr-1" />
                              {transaction.route}
                            </div>
                          )}
                          {transaction.busNumber && (
                            <div className="text-xs text-purple-600 mt-1">
                              Bus: {transaction.busNumber}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-sm text-gray-500 capitalize flex items-center">
                          <FaCheckCircle className="text-green-500 mr-1" />
                          {transaction.status}
                        </div>
                        <div className="mt-2">{getTransactionBadge(transaction.type)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs text-gray-400">
                        ID: {transaction.transactionId}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 transition-colors"
                      >
                        <FaEye />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Money Modal */}
          {showAddMoney && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full">
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Add Money</h2>
                      <p className="text-red-100">Add money to your wallet</p>
                    </div>
                    <button
                      onClick={() => setShowAddMoney(false)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <FaTimes className="text-xl" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Amount
                    </label>
                    <div className="relative">
                      <FaRupeeSign className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="number"
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        placeholder="0"
                        className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-lg font-medium"
                        min="1"
                        max="50000"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Minimum: ₹1 • Maximum: ₹50,000</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[500, 1000, 2000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setAddAmount(amount.toString())}
                        className="py-2 px-4 border border-gray-300 rounded-lg hover:border-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleAddMoney}
                    disabled={!addAmount || parseFloat(addAmount) <= 0 || addingMoney}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 flex items-center justify-center space-x-2 transition-colors"
                  >
                    {addingMoney ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Adding Money...</span>
                      </>
                    ) : (
                      <span>Add ₹{addAmount || 0} to Wallet</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Details Modal */}
          {showModal && selectedTransaction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Transaction Details</h2>
                      <p className="text-red-100">ID: {selectedTransaction.transactionId}</p>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <FaTimes className="text-xl" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  
                  {/* Basic Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Transaction Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Description</span>
                        <div className="font-medium">{selectedTransaction.description}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Amount</span>
                        <div className={`font-bold text-lg ${
                          selectedTransaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedTransaction.type === 'credit' ? '+' : '-'}₹{selectedTransaction.amount.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Method</span>
                        <div className="font-medium capitalize">{selectedTransaction.method}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Date & Time</span>
                        <div className="font-medium">{selectedTransaction.date} at {selectedTransaction.time}</div>
                      </div>
                    </div>
                  </div>

                  {/* Bus Details */}
                  {selectedTransaction.bookingId && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <FaBus className="text-blue-600 mr-2" />
                        Bus Details
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Booking ID</span>
                          <div className="font-medium">{selectedTransaction.bookingId}</div>
                        </div>
                        {selectedTransaction.busNumber && (
                          <div>
                            <span className="text-sm text-gray-500">Bus Number</span>
                            <div className="font-medium">{selectedTransaction.busNumber}</div>
                          </div>
                        )}
                        {selectedTransaction.route && (
                          <div>
                            <span className="text-sm text-gray-500">Route</span>
                            <div className="font-medium text-blue-600">{selectedTransaction.route}</div>
                          </div>
                        )}
                        {selectedTransaction.seats && (
                          <div>
                            <span className="text-sm text-gray-500">Seats</span>
                            <div className="font-medium">{selectedTransaction.seats}</div>
                          </div>
                        )}
                      </div>

                      {/* Journey Points */}
                      {(selectedTransaction.boardingPoint || selectedTransaction.droppingPoint) && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <div className="grid md:grid-cols-2 gap-4">
                            {selectedTransaction.boardingPoint && (
                              <div>
                                <span className="text-sm text-gray-500 flex items-center">
                                  <FaMapMarkerAlt className="mr-1 text-green-600" />
                                  Boarding Point
                                </span>
                                <div className="font-medium">{selectedTransaction.boardingPoint.name}</div>
                                <div className="text-sm text-gray-600">{selectedTransaction.boardingPoint.address}</div>
                                {selectedTransaction.boardingPoint.time && (
                                  <div className="text-sm text-blue-600 flex items-center mt-1">
                                    <FaClock className="mr-1" />
                                    {selectedTransaction.boardingPoint.time}
                                  </div>
                                )}
                              </div>
                            )}
                            {selectedTransaction.droppingPoint && (
                              <div>
                                <span className="text-sm text-gray-500 flex items-center">
                                  <FaMapMarkerAlt className="mr-1 text-red-600" />
                                  Dropping Point
                                </span>
                                <div className="font-medium">{selectedTransaction.droppingPoint.name}</div>
                                <div className="text-sm text-gray-600">{selectedTransaction.droppingPoint.address}</div>
                                {selectedTransaction.droppingPoint.time && (
                                  <div className="text-sm text-blue-600 flex items-center mt-1">
                                    <FaClock className="mr-1" />
                                    {selectedTransaction.droppingPoint.time}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contact Details */}
                  {(selectedTransaction.contactDetails || selectedTransaction.userName) && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <FaUser className="text-green-600 mr-2" />
                        Contact Details
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {selectedTransaction.userName && (
                          <div>
                            <span className="text-sm text-gray-500">Name</span>
                            <div className="font-medium">{selectedTransaction.userName}</div>
                          </div>
                        )}
                        {selectedTransaction.userPhone && (
                          <div>
                            <span className="text-sm text-gray-500 flex items-center">
                              <FaPhone className="mr-1" />
                              Phone
                            </span>
                            <div className="font-medium">{selectedTransaction.userPhone}</div>
                          </div>
                        )}
                        {selectedTransaction.contactDetails?.email && (
                          <div>
                            <span className="text-sm text-gray-500 flex items-center">
                              <FaEnvelope className="mr-1" />
                              Email
                            </span>
                            <div className="font-medium">{selectedTransaction.contactDetails.email}</div>
                          </div>
                        )}
                        {selectedTransaction.contactDetails?.state && (
                          <div>
                            <span className="text-sm text-gray-500">State</span>
                            <div className="font-medium">{selectedTransaction.contactDetails.state}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => alert('Download feature coming soon!')}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      <FaDownload />
                      <span>Download</span>
                    </button>
                    
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      <FaPrint />
                      <span>Print</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Transaction Details',
                            text: `Transaction: ${selectedTransaction.description}`,
                            url: window.location.href
                          });
                        } else {
                          alert('Share feature not supported on this device');
                        }
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                    >
                      <FaShare />
                      <span>Share</span>
                    </button>
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

export default MyWallet;
