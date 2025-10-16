// Payment.js - Complete Code with Firebase Auth Integration
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Smartphone, Building2, Wallet, Shield, ArrowLeft, Clock, User, 
  Phone, Mail, MapPin, Users, Layers, Bus, Calendar, ArrowRight, Lock, Info, 
  Navigation, Star, Calculator, CreditCard as EmiIcon 
} from 'lucide-react';
import { getBookingData } from '../utils/data';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../config/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const Payment = ({ onBack, theme = { primary: '#007BFF', secondary: '#28A745', accent: '#DC3545' }, fontFamily = 'Poppins, sans-serif' }) => {
  // States
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [showBookingSummary, setShowBookingSummary] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [fareBreakdown, setFareBreakdown] = useState({ base: 0, tax: 0, fee: 0 });
  const [cardDetails, setCardDetails] = useState({ cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '', cardholderName: '' });
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [emiMonths, setEmiMonths] = useState(3);
  const [operatorId, setOperatorId] = useState(null);
  const [operatorData, setOperatorData] = useState(null);
  const [operatorLoading, setOperatorLoading] = useState(false);
  const [operatorError, setOperatorError] = useState(null);

  // 🔥 NEW: User Authentication States
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(null);
  const [userFirestoreData, setUserFirestoreData] = useState(null);

  const navigate = useNavigate();

  // Constants
  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Pay securely with your card', popular: true },
    { id: 'upi', name: 'UPI', icon: Smartphone, description: 'Pay using UPI ID or QR code', popular: true },
    { id: 'netbanking', name: 'Net Banking', icon: Building2, description: 'Pay using your bank account' },
    { id: 'wallet', name: 'Digital Wallet', icon: Wallet, description: 'Paytm, PhonePe, Google Pay' },
    { id: 'emi', name: 'EMI', icon: EmiIcon, description: 'Pay in installments' }
  ];
  const popularBanks = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank'];

  // 🔥 ENHANCED: Firebase Auth Detection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔥 Auth State Changed:', user ? `User logged in: ${user.email}` : 'No user logged in');
      
      if (user) {
        setCurrentUser(user);
        await fetchUserFirestoreData(user.uid);
      } else {
        console.log('❌ No user logged in, redirecting to login...');
        setCurrentUser(null);
        setUserFirestoreData(null);
        setUserError('Please login to continue with payment');
        navigate('/login');
      }
      setUserLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // 🔥 ENHANCED: Fetch User Data from Firestore
  const fetchUserFirestoreData = async (uid) => {
    try {
      console.log('🔥 Fetching user data from Firestore for UID:', uid);
      
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('uid', '==', uid));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        console.log('✅ User data found in Firestore:', userData);
        setUserFirestoreData({
          docId: userSnapshot.docs[0].id,
          ...userData
        });
      } else {
        console.log('⚠️ User data not found in Firestore, using Auth data only');
        setUserFirestoreData(null);
      }
    } catch (error) {
      console.error('❌ Error fetching user data from Firestore:', error);
      setUserError(`Failed to fetch user data: ${error.message}`);
    }
  };

  // 🔥 ENHANCED SEAT FORMATTING FUNCTIONS
  const formatSeatName = (seatId) => {
    if (!seatId) return 'N/A';
    
    try {
      const parts = seatId.split('-');
      if (parts.length >= 3) {
        const deck = parts[0];
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

  const formatSeatWithDeck = (seatId) => {
    if (!seatId) return 'N/A';
    
    try {
      const parts = seatId.split('-');
      if (parts.length >= 3) {
        const deck = parts[0];
        const row = parseInt(parts[1]);
        const col = parseInt(parts[2]);
        
        const seatLetter = String.fromCharCode(65 + row);
        const seatNumber = col + 1;
        const deckName = deck === 'lower' ? 'Lower Deck' : 'Upper Deck';
        
        return `${seatLetter}${seatNumber} (${deckName})`;
      }
    } catch (error) {
      console.error('Error formatting seat with deck:', error);
    }
    
    return seatId;
  };

  const getDeckName = (seatId) => {
    if (!seatId) return 'Lower Deck';
    
    try {
      const parts = seatId.split('-');
      if (parts.length >= 1) {
        const deck = parts[0];
        return deck === 'lower' ? 'Lower Deck' : 'Upper Deck';
      }
    } catch (error) {
      console.error('Error getting deck name:', error);
    }
    
    return 'Lower Deck';
  };

  // Utils
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString || new Date());
      return `${date.toLocaleDateString('en-US', { weekday: 'short' })}, ${date.getDate().toString().padStart(2, '0')} ${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getFullYear()}`;
    } catch { 
      return new Date().toLocaleDateString('en-IN'); 
    }
  };

  const formatTime = (timeString) => timeString?.includes(':') ? timeString : timeString || 'N/A';
  
  // 🔥 ENHANCED SEAT GROUPING BY DECK
  const getSeatsByDeck = () => {
    const lower = [];
    const upper = [];
    
    if (bookingData?.selectedSeats) {
      bookingData.selectedSeats.forEach(seatId => {
        if (seatId.startsWith('lower')) {
          lower.push(seatId);
        } else if (seatId.startsWith('upper')) {
          upper.push(seatId);
        }
      });
    }
    
    return { lower, upper };
  };

  // Helper function to safely get string values
  const safeString = (value, defaultValue = 'N/A') => {
    return value && value !== null && value !== undefined ? String(value) : defaultValue;
  };

  // Safe ID number formatting
  const formatIdNumber = (idNumber) => {
    if (!idNumber || idNumber === null || idNumber === undefined) {
      return '****';
    }
    const idStr = String(idNumber);
    return idStr.length > 4 ? `****${idStr.slice(-4)}` : `****${idStr}`;
  };

  // Validators
  const validateCardNumber = (num) => num.replace(/\s/g, '').length >= 13 && num.replace(/\s/g, '').length <= 19;
  const validateCVV = (cvv) => cvv.length >= 3 && cvv.length <= 4;
  const validateUPI = (upi) => upi.includes('@') && upi.length > 5;
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const match = v.match(/\d{4,16}/g)?.[0] || '';
    return match.match(/.{1,4}/g)?.join(' ') || v;
  };

  const handleCardChange = (field, value) => {
    const updates = {
      cardNumber: () => formatCardNumber(value),
      cvv: () => value.replace(/\D/g, '').slice(0, 4),
      expiryMonth: () => Math.min(parseInt(value.replace(/\D/g, '').slice(0, 2)) || 0, 12).toString(),
      expiryYear: () => value.replace(/\D/g, '').slice(0, 4),
      cardholderName: () => value
    };
    setCardDetails(prev => ({ ...prev, [field]: updates[field]?.() || value }));
  };

  const canProcessPayment = () => {
    const checks = {
      card: () => validateCardNumber(cardDetails.cardNumber) && cardDetails.expiryMonth && cardDetails.expiryYear && validateCVV(cardDetails.cvv) && cardDetails.cardholderName.trim(),
      upi: () => validateUPI(upiId),
      netbanking: () => selectedBank,
      wallet: () => selectedBank,
      emi: () => emiMonths > 0
    };
    return bookingData && currentUser && checks[selectedPaymentMethod]?.();
  };

  // Fetch Operator by operatorId
  const fetchOperatorById = async (operatorId) => {
    try {
      setOperatorLoading(true);
      setOperatorError(null);
      console.log('🔥 Fetching operator by ID:', operatorId);
      
      const operatorsRef = collection(db, 'operators');
      const operatorQuery = query(operatorsRef, where('operatorId', '==', operatorId));
      const operatorSnapshot = await getDocs(operatorQuery);
      
      if (!operatorSnapshot.empty) {
        const operatorDoc = operatorSnapshot.docs[0];
        const operatorInfo = {
          docId: operatorDoc.id,
          ...operatorDoc.data()
        };
        
        console.log('✅ Operator found:', operatorInfo);
        setOperatorData(operatorInfo);
        return operatorInfo;
      } else {
        try {
          const operatorDocRef = doc(db, 'operators', operatorId);
          const operatorDocSnap = await getDoc(operatorDocRef);
          
          if (operatorDocSnap.exists()) {
            const operatorInfo = {
              docId: operatorDocSnap.id,
              ...operatorDocSnap.data()
            };
            console.log('✅ Operator found by doc ID:', operatorInfo);
            setOperatorData(operatorInfo);
            return operatorInfo;
          }
        } catch (docError) {
          console.log('❌ Document ID fetch failed:', docError.message);
        }
        
        console.log('❌ Operator not found for ID:', operatorId);
        setOperatorError(`Operator not found for ID: ${operatorId}`);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching operator:', error);
      setOperatorError(`Error fetching operator: ${error.message}`);
      return null;
    } finally {
      setOperatorLoading(false);
    }
  };

  // Process booking data to extract operatorId
  const processBookingData = async (data) => {
    if (!data || !data.busData) {
      return;
    }
    
    let extractedOperatorId = null;
    const possibleFields = ['operatorId', 'operator_id', 'operatorID', 'operator'];
    
    for (const field of possibleFields) {
      if (data.busData[field]) {
        extractedOperatorId = data.busData[field];
        break;
      }
    }

    if (extractedOperatorId) {
      setOperatorId(extractedOperatorId);
      await fetchOperatorById(extractedOperatorId);
    } else {
      console.log('⚠️ Operator ID not found in bus data');
      setOperatorError('Operator ID not found in bus data');
    }
  };

  const updateSeatStatus = async (busId, busNumber, selectedSeats) => {
    try {
      console.log('🔥 Updating seat status for bus:', busId, 'Seats:', selectedSeats);
      
      const seatsRef = collection(db, 'bus_seats');
      const seatsQuery = query(seatsRef, where('busId', '==', busId));
      const seatsSnapshot = await getDocs(seatsQuery);
      
      if (!seatsSnapshot.empty) {
        const seatDoc = seatsSnapshot.docs[0];
        const updatedSeatLayout = JSON.parse(JSON.stringify(seatDoc.data().seatLayout));
        
        selectedSeats.forEach(seatId => {
          const [deck, rowStr, colStr] = seatId.split('-');
          const [row, col] = [parseInt(rowStr), parseInt(colStr)];
          const deckKey = deck === 'lower' ? 'lowerDeck' : 'upperDeck';
          
          if (updatedSeatLayout[deckKey]?.[row]?.[col] !== undefined) {
            updatedSeatLayout[deckKey][row][col] = 1;
            console.log(`✅ Updated seat ${seatId} to booked`);
          }
        });

        const updateData = {
          seatLayout: updatedSeatLayout,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || 'unknown'
        };

        if (operatorId) {
          updateData.operatorId = operatorId;
        }

        await updateDoc(doc(db, 'bus_seats', seatDoc.id), updateData);
        console.log('✅ Seat status updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating seat status:', error);
      throw error;
    }
  };

  // 🔥 ENHANCED: Save data with user information
  const saveDataToFirebase = async (bookingId, busId, busNumber, transactionId) => {
    try {
      console.log('🔥 Saving data to Firebase...');
      console.log('Current User:', currentUser);
      console.log('User Firestore Data:', userFirestoreData);
      
      const operatorName = safeString(
        operatorData?.name || 
        operatorData?.operatorName || 
        bookingData?.busData?.operatorName || 
        bookingData?.busData?.operator,
        'Unknown Operator'
      );

      // 🔥 ENHANCED: Save passengers with user information
      const passengerPromises = bookingData.passengers?.map(async (passenger, index) => {
        const passengerData = {
          bookingId: safeString(bookingId), 
          busId: safeString(busId), 
          busNumber: safeString(busNumber), 
          passengerIndex: index + 1,
          name: safeString(passenger.name, `Passenger ${index + 1}`),
          age: passenger.age || 0,
          gender: safeString(passenger.gender, 'male'),
          seatId: safeString(passenger.seatId),
          seatName: formatSeatName(passenger.seatId),
          seatWithDeck: formatSeatWithDeck(passenger.seatId),
          deck: getDeckName(passenger.seatId),
          idType: safeString(passenger.idType, 'N/A'),
          idNumber: safeString(passenger.idNumber, 'N/A'),
          operatorName: operatorName,
          
          // 🔥 NEW: Add user information to passenger data
          userId: currentUser?.uid || null,
          userEmail: currentUser?.email || null,
          userName: userFirestoreData?.name || currentUser?.displayName || null,
          userPhone: userFirestoreData?.phone || null,
          bookedBy: currentUser?.email || 'unknown',
          
          createdAt: serverTimestamp()
        };

        if (operatorId && operatorId !== null && operatorId !== undefined) {
          passengerData.operatorId = safeString(operatorId);
        }

        console.log('🔥 Saving passenger data:', passengerData);
        return await addDoc(collection(db, 'passengerinfo'), passengerData);
      }) || [];

      // 🔥 ENHANCED: Save payment with user information
      const formattedSeatNumbers = bookingData?.selectedSeats?.map(seatId => ({
        originalSeatId: seatId,
        seatName: formatSeatName(seatId),
        seatWithDeck: formatSeatWithDeck(seatId),
        deck: getDeckName(seatId)
      })) || [];

      const paymentData = {
        bookingId: safeString(bookingId), 
        busId: safeString(busId), 
        busNumber: safeString(busNumber), 
        transactionId: safeString(transactionId),
        paymentMethod: safeString(selectedPaymentMethod),
        paymentStatus: 'completed',
        totalAmount: bookingData.totalAmount || 0,
        operatorName: operatorName,
        
        // 🔥 NEW: Add user information to payment data
        userId: currentUser?.uid || null,
        userEmail: currentUser?.email || null,
        userName: userFirestoreData?.name || currentUser?.displayName || null,
        userPhone: userFirestoreData?.phone || null,
        bookedBy: currentUser?.email || 'unknown',
        
        busDetails: {
          busId: safeString(busId),
          busNumber: safeString(busNumber),
          busType: safeString(bookingData?.busData?.busType, 'AC Sleeper'),
          from: safeString(bookingData?.busData?.from, 'Source'),
          to: safeString(bookingData?.busData?.to, 'Destination'),
          date: safeString(bookingData?.busData?.date, new Date().toISOString().split('T')[0]),
          duration: safeString(bookingData?.busData?.duration, 'N/A')
        },
        passengerCount: bookingData?.passengers?.length || 0,
        seatNumbers: bookingData?.selectedSeats || [],
        formattedSeatNumbers: formattedSeatNumbers,
        boardingPoint: {
          name: safeString(bookingData?.selectedBoardingPoint?.name, 'Boarding Point'),
          address: safeString(bookingData?.selectedBoardingPoint?.address, 'N/A'),
          time: safeString(bookingData?.selectedBoardingPoint?.time, '00:00')
        },
        droppingPoint: {
          name: safeString(bookingData?.selectedDroppingPoint?.name, 'Dropping Point'),
          address: safeString(bookingData?.selectedDroppingPoint?.address, 'N/A'),
          time: safeString(bookingData?.selectedDroppingPoint?.time, '00:00')
        },
        contactDetails: {
          phone: safeString(bookingData?.contactDetails?.phone, userFirestoreData?.phone || 'N/A'),
          email: safeString(bookingData?.contactDetails?.email, currentUser?.email || 'N/A'),
          state: safeString(bookingData?.contactDetails?.state, 'Rajasthan'),
          whatsappEnabled: bookingData?.contactDetails?.whatsappEnabled || false
        },
        createdAt: serverTimestamp()
      };

      if (operatorId && operatorId !== null && operatorId !== undefined) {
        paymentData.operatorId = safeString(operatorId);
      }

      console.log('🔥 Saving payment data:', paymentData);

      const [passengerDocs, paymentDoc] = await Promise.all([
        Promise.all(passengerPromises),
        addDoc(collection(db, 'payments'), paymentData)
      ]);

      console.log('✅ Data saved successfully to Firebase');
      console.log('Passenger IDs:', passengerDocs.map(doc => doc.id));
      console.log('Payment Doc ID:', paymentDoc.id);

      return { 
        passengerIds: passengerDocs.map(doc => doc.id), 
        paymentDocId: paymentDoc.id 
      };
    } catch (error) {
      console.error('❌ Error saving data:', error);
      throw error;
    }
  };

  // Effects
  useEffect(() => {
    const data = getBookingData();
    console.log('🔥 Booking data loaded:', data);
    setBookingData(data);
    const total = data?.totalAmount || 0;
    setFareBreakdown({ base: total * 0.8, tax: total * 0.15, fee: total * 0.05 });
    processBookingData(data);
  }, []);

  // 🔥 ENHANCED: Payment handler with user validation
  const handlePayment = async () => {
    if (!currentUser) {
      alert('Please login to continue with payment');
      navigate('/login');
      return;
    }

    if (!canProcessPayment()) {
      alert('Please fill all required payment details correctly.');
      return;
    }

    if (!operatorId || !operatorData) {
      const confirmProceed = window.confirm(
        'Operator information could not be fetched. Do you want to proceed with the payment anyway?'
      );
      if (!confirmProceed) return;
    }

    setProcessing(true);
    
    try {
      console.log('🔥 Starting payment process...');
      console.log('Current User:', currentUser.email);
      console.log('Payment Method:', selectedPaymentMethod);

      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const bookingId = `BUS${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const busId = bookingData?.busData?.busId || bookingData?.busData?.id;
      const busNumber = bookingData?.busData?.busNumber;

      console.log('Generated IDs:', { transactionId, bookingId, busId, busNumber });

      await new Promise(resolve => setTimeout(resolve, 2000));

      if (bookingData?.selectedSeats?.length > 0) {
        await updateSeatStatus(busId, busNumber, bookingData.selectedSeats);
      }

      const { passengerIds, paymentDocId } = await saveDataToFirebase(bookingId, busId, busNumber, transactionId);

      const successData = {
        ...bookingData,
        transactionId, 
        bookingId, 
        paymentDocId, 
        passengerIds,
        paymentMethod: selectedPaymentMethod,
        operatorInfo: operatorData,
        operatorId: operatorId,
        
        // 🔥 NEW: Add user information to success data
        userInfo: {
          uid: currentUser.uid,
          email: currentUser.email,
          name: userFirestoreData?.name || currentUser.displayName,
          phone: userFirestoreData?.phone,
          firestoreData: userFirestoreData
        }
      };

      console.log('🔥 Payment successful, redirecting to ticket page...');
      navigate('/ticket', { state: { paymentData: successData } });

    } catch (error) {
      console.error('❌ Payment failed:', error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 🔥 Show loading screen while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying Authentication</h2>
          <p className="text-gray-600">Please wait while we verify your login status...</p>
        </div>
      </div>
    );
  }

  // 🔥 Show error if user not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily }}>
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please login to continue with payment</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Component Renders
  const renderPaymentForm = () => {
    const forms = {
      card: (
        <div className="space-y-4">
          <h3 className="font-bold text-black mb-4">Enter Card Details</h3>
          {[
            { field: 'cardNumber', placeholder: '1234 5678 9012 3456', maxLength: '19', validator: validateCardNumber },
            { field: 'cardholderName', placeholder: 'Cardholder Name' }
          ].map(({ field, placeholder, maxLength, validator }) => (
            <input key={field}
              type="text" value={cardDetails[field]}
              onChange={(e) => handleCardChange(field, e.target.value)}
              placeholder={placeholder} maxLength={maxLength}
              className="w-full p-3 border-2 border-gray-300 rounded-lg"
              style={{ borderColor: validator ? (validator(cardDetails[field]) ? theme.secondary : theme.accent) : '' }}
            />
          ))}
          <div className="grid grid-cols-3 gap-4">
            {[
              { field: 'expiryMonth', placeholder: 'MM', maxLength: '2' },
              { field: 'expiryYear', placeholder: 'YYYY', maxLength: '4' },
              { field: 'cvv', placeholder: 'CVV', maxLength: '4', type: 'password' }
            ].map(({ field, placeholder, maxLength, type }) => (
              <input key={field}
                type={type || "text"} value={cardDetails[field]}
                onChange={(e) => handleCardChange(field, e.target.value)}
                placeholder={placeholder} maxLength={maxLength}
                className="w-full p-3 border-2 border-gray-300 rounded-lg"
              />
            ))}
          </div>
        </div>
      ),
      upi: (
        <div className="space-y-4">
          <h3 className="font-bold text-black mb-4">Enter UPI Details</h3>
          <input
            type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@upi"
            className="w-full p-3 border-2 border-gray-300 rounded-lg"
            style={{ borderColor: validateUPI(upiId) ? theme.secondary : theme.accent }}
          />
        </div>
      ),
      netbanking: (
        <div className="space-y-4">
          <h3 className="font-bold text-black mb-4">Select Bank</h3>
          <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg">
            <option value="">Select your bank</option>
            {popularBanks.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
          </select>
        </div>
      ),
      wallet: (
        <div className="space-y-4">
          <h3 className="font-bold text-black mb-4">Select Wallet</h3>
          <div className="grid grid-cols-2 gap-4">
            {['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay'].map((wallet) => (
              <div key={wallet} onClick={() => setSelectedBank(wallet)}
                className={`border-2 rounded-lg p-3 text-center cursor-pointer
                  ${selectedBank === wallet ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <div className="font-bold text-black">{wallet}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      emi: (
        <div className="space-y-4">
          <h3 className="font-bold text-black mb-4">Select EMI Plan</h3>
          <select value={emiMonths} onChange={(e) => setEmiMonths(parseInt(e.target.value))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg">
            {[3, 6, 9, 12].map(months => <option key={months} value={months}>{months} Months</option>)}
          </select>
          <div className="text-sm text-gray-600">Monthly: ₹{(bookingData?.totalAmount / emiMonths).toFixed(2)}</div>
        </div>
      )
    };
    return forms[selectedPaymentMethod] || null;
  };

  const seatsByDeck = getSeatsByDeck();

  return (
    <div className="min-h-screen bg-gray-50 p-2" style={{ fontFamily }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => onBack ? onBack() : navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5 text-blue-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-black">Complete Payment</h1>
              <p className="text-sm text-gray-600">Secure payment for your bus journey</p>
              
              {/* 🔥 NEW: User Information Display */}
              {currentUser && (
                <div className="text-xs text-blue-600 font-medium mt-1 bg-blue-50 px-2 py-1 rounded">
                  ✅ Logged in as: {currentUser.email}
                  {userFirestoreData?.name && ` (${userFirestoreData.name})`}
                  {userFirestoreData?.phone && ` • ${userFirestoreData.phone}`}
                </div>
              )}

              {userError && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  ⚠️ {userError}
                </p>
              )}
              
              {operatorLoading && (
                <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                  <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Loading operator information...
                </p>
              )}
              
              {!operatorLoading && operatorId && operatorData && (
                <p className="text-xs text-green-600 font-medium mt-1">
                  ✅ Operator: {operatorData.name || operatorData.operatorName} (ID: {operatorId})
                </p>
              )}
              
              {!operatorLoading && operatorError && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  ⚠️ {operatorError}
                </p>
              )}
            </div>
          </div>

          {/* Trip Summary */}
          <div className="bg-gray-100 rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="font-bold text-lg text-black">{bookingData?.busData?.from || 'Source'}</div>
                  <div className="text-sm font-semibold" style={{ color: theme.primary }}>
                    {formatTime(bookingData?.selectedBoardingPoint?.time)}
                  </div>
                  <div className="text-xs text-gray-600">{formatDate(bookingData?.busData?.date)}</div>
                </div>
                <div className="flex flex-col items-center px-4">
                  <div className="text-xs text-gray-500 mb-1">{bookingData?.busData?.duration || 'N/A'}</div>
                  <ArrowRight className="text-gray-400 w-6 h-6" />
                  <div className="text-xs text-gray-500 mt-1">{bookingData?.busData?.distance || 'N/A'}</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-black">{bookingData?.busData?.to || 'Destination'}</div>
                  <div className="text-sm font-semibold" style={{ color: theme.accent }}>
                    {formatTime(bookingData?.selectedDroppingPoint?.time)}
                  </div>
                  <div className="text-xs text-gray-600">{formatDate(bookingData?.busData?.date)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: theme.accent }}>₹{bookingData?.totalAmount || 0}</div>
                <div className="text-sm text-gray-600">{bookingData?.totalPassengers || 0} passengers</div>
              </div>
            </div>

            <div className="bg-white bg-opacity-70 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bus className="w-6 h-6" style={{ color: theme.primary }} />
                  <div>
                    <div className="font-bold text-black">{bookingData?.busData?.operatorName || 'Premium Travels'}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <span>{bookingData?.busData?.busType || 'AC Sleeper (2+1)'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        {bookingData?.busData?.rating || '4.2'}
                      </span>
                    </div>
                    {operatorId && operatorData && (
                      <div className="text-xs text-green-600 mt-1">
                        Operator ID: {operatorId} • {operatorData.companyName || operatorData.name || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600">Bus No: {bookingData?.busData?.busNumber || 'N/A'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-100 rounded-lg p-3">
                <div className="text-sm font-bold" style={{ color: theme.secondary }}>Boarding Point</div>
                <div className="font-semibold text-black">{bookingData?.selectedBoardingPoint?.name || 'City Bus Stand'}</div>
                <div className="text-xs text-gray-600">{bookingData?.selectedBoardingPoint?.address || 'Main Bus Terminal'}</div>
                <div className="text-xs font-semibold mt-1" style={{ color: theme.secondary }}>
                  Report by: {formatTime(bookingData?.selectedBoardingPoint?.time)}
                </div>
              </div>
              <div className="bg-red-100 rounded-lg p-3">
                <div className="text-sm font-bold" style={{ color: theme.accent }}>Dropping Point</div>
                <div className="font-semibold text-black">{bookingData?.selectedDroppingPoint?.name || 'Destination Terminal'}</div>
                <div className="text-xs text-gray-600">{bookingData?.selectedDroppingPoint?.address || 'Main Bus Station'}</div>
                <div className="text-xs font-semibold mt-1" style={{ color: theme.accent }}>
                  Arrival: {formatTime(bookingData?.selectedDroppingPoint?.time)}
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-yellow-100 rounded-lg p-3">
              <div className="font-bold text-black mb-2 flex items-center gap-2">
                <Calculator className="w-5 h-5" style={{ color: theme.primary }} />
                Fare Breakdown
              </div>
              <ul className="text-sm text-gray-600">
                <li>Base Fare: ₹{fareBreakdown.base.toFixed(2)}</li>
                <li>Taxes: ₹{fareBreakdown.tax.toFixed(2)}</li>
                <li>Fees: ₹{fareBreakdown.fee.toFixed(2)}</li>
                <li><strong>Total: ₹{bookingData?.totalAmount || 0}</strong></li>
              </ul>
            </div>
            
            <button onClick={() => setShowBookingSummary(!showBookingSummary)}
              className="text-blue-500 text-sm underline mt-4 font-bold hover:text-blue-700 flex items-center gap-1 transition-colors">
              <Info className="w-4 h-4" />
              {showBookingSummary ? 'Hide' : 'View'} complete booking details
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Passenger Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: theme.primary }} />
                Passenger Information
                {operatorId && operatorData && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
                    Operator: {operatorData.name || operatorData.operatorName} (ID: {operatorId})
                  </span>
                )}
              </h2>
              <div className="space-y-3">
                {bookingData?.passengers?.map((passenger, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                        style={{ backgroundColor: theme.primary, color: 'white' }}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-black">{passenger.name || `Passenger ${index + 1}`}</div>
                        <div className="text-sm text-gray-600">{passenger.age}yrs • {passenger.gender?.charAt(0)?.toUpperCase() + passenger.gender?.slice(1) || 'N/A'}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {safeString(passenger.idType, 'ID')}: {formatIdNumber(passenger.idNumber)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ color: theme.accent }}>
                        Seat {formatSeatName(passenger.seatId)}
                      </div>
                      <div className="text-xs text-gray-500">{getDeckName(passenger.seatId)}</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 py-4">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No passenger information available</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t">
                <h3 className="font-bold text-black mb-3">Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: Phone, label: 'Mobile Number', value: bookingData?.contactDetails?.phone || userFirestoreData?.phone || 'N/A', bg: '#E3F2FD', color: theme.primary },
                    { icon: Mail, label: 'Email Address', value: bookingData?.contactDetails?.email || currentUser?.email || 'N/A', bg: '#D4EDDA', color: theme.secondary },
                    { icon: MapPin, label: 'State', value: bookingData?.contactDetails?.state || 'Rajasthan', bg: '#E5CCFF', color: '#6F42C1' },
                    { icon: Navigation, label: 'WhatsApp Updates', value: bookingData?.contactDetails?.whatsappEnabled ? 'Enabled' : 'Disabled', bg: '#FFE5B4', color: '#FD7E14' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: item.bg }}>
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      <div>
                        <div className="text-sm text-gray-600">{item.label}</div>
                        <div className="font-bold text-black">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {operatorData && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-bold text-black mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5" style={{ color: theme.primary }} />
                    Operator Information
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Operator ID:</span>
                        <span className="font-bold text-black ml-2">{operatorId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="font-bold text-black ml-2">{operatorData.name || operatorData.operatorName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Company:</span>
                        <span className="font-bold text-black ml-2">{operatorData.companyName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Contact:</span>
                        <span className="font-bold text-black ml-2">{operatorData.contact || operatorData.phone || 'N/A'}</span>
                      </div>
                      {operatorData.email && (
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <span className="font-bold text-black ml-2">{operatorData.email}</span>
                        </div>
                      )}
                      {operatorData.licenseNumber && (
                        <div>
                          <span className="text-gray-600">License:</span>
                          <span className="font-bold text-black ml-2">{operatorData.licenseNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-black mb-6">Select Payment Method</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <div key={method.id} onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-md
                        ${selectedPaymentMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      {method.popular && (
                        <div className="absolute -top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          Popular
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <IconComponent className={`w-6 h-6 ${selectedPaymentMethod === method.id ? 'text-blue-500' : 'text-gray-600'}`} />
                        <div>
                          <div className="font-bold text-black">{method.name}</div>
                          <div className="text-sm text-gray-600">{method.description}</div>
                        </div>
                      </div>
                      <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2
                        ${selectedPaymentMethod === method.id ? 'border-blue-500 bg-white' : 'border-gray-400'}`}>
                        {selectedPaymentMethod === method.id && (
                          <div className="w-2.5 h-2.5 rounded-full m-1 bg-blue-500"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-6">{renderPaymentForm()}</div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-black mb-4">Payment Summary</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="font-bold text-black mb-2">Trip Details</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Bus className="w-4 h-4" style={{ color: theme.primary }} />
                    {bookingData?.busData?.operatorName || 'Premium Bus'} • {bookingData?.busData?.busType || 'AC Sleeper'}
                  </div>
                  {operatorId && operatorData && (
                    <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Operator: {operatorData.name || operatorData.operatorName} (ID: {operatorId})
                    </div>
                  )}
                  {operatorError && (
                    <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      ⚠️ {operatorError}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.secondary }}></div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }}></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-black">{bookingData?.selectedBoardingPoint?.name || 'Boarding Point'}</div>
                    <div className="text-sm text-gray-600">{formatDate(bookingData?.busData?.date)} • {formatTime(bookingData?.selectedBoardingPoint?.time)}</div>
                    <div className="text-xs text-gray-500 mt-1">{bookingData?.selectedBoardingPoint?.address || 'N/A'}</div>
                    <div className="font-bold text-black mt-2">{bookingData?.selectedDroppingPoint?.name || 'Dropping Point'}</div>
                    <div className="text-sm text-gray-600">{formatDate(bookingData?.busData?.date)} • {formatTime(bookingData?.selectedDroppingPoint?.time)}</div>
                    <div className="text-xs text-gray-500 mt-1">{bookingData?.selectedDroppingPoint?.address || 'N/A'}</div>
                  </div>
                </div>

                {/* 🔥 ENHANCED SEAT DETAILS SECTION */}
                <div className="border-t pt-4">
                  <div className="font-bold text-black mb-2">Seat Details</div>
                  <div className="text-sm text-gray-600 mb-2">{bookingData?.totalPassengers || 0} passenger(s)</div>
                  
                  {bookingData?.selectedSeats && bookingData.selectedSeats.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-2">
                      <div className="font-semibold text-blue-800 mb-2">Selected Seats:</div>
                      <div className="flex flex-wrap gap-2">
                        {bookingData.selectedSeats.map((seatId, index) => (
                          <div key={index} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {formatSeatWithDeck(seatId)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {seatsByDeck.lower.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Layers className="w-3 h-3" style={{ color: theme.primary }} />
                        <span className="text-xs font-bold" style={{ color: theme.primary }}>Lower Deck:</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {seatsByDeck.lower.map(seatId => formatSeatName(seatId)).join(', ')}
                      </div>
                    </div>
                  )}
                  {seatsByDeck.upper.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Layers className="w-3 h-3" style={{ color: theme.secondary }} />
                        <span className="text-xs font-bold" style={{ color: theme.secondary }}>Upper Deck:</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {seatsByDeck.upper.map(seatId => formatSeatName(seatId)).join(', ')}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-black">Total Amount:</span>
                    <span className="text-xl font-bold" style={{ color: theme.accent }}>₹{bookingData?.totalAmount || 0}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Includes all taxes and fees</div>
                </div>

                <button 
                  onClick={handlePayment} 
                  disabled={processing || !canProcessPayment()}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-300
                    ${processing || !canProcessPayment() ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {processing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : !currentUser ? (
                    'Please Login to Continue'
                  ) : (
                    `Pay ₹{bookingData?.totalAmount || 0}`
                  )}
                </button>

                {currentUser && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Lock className="w-4 h-4" style={{ color: theme.primary }} />
                    <span>Secured payment • Logged in as {currentUser?.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showBookingSummary && (
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowBookingSummary(false)}></div>
            <div className="bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-black">Booking Summary</h3>
                <button onClick={() => setShowBookingSummary(false)} className="text-gray-600 hover:text-gray-800">✕</button>
              </div>
              <div className="space-y-6">
                <div className="border-t pt-4">
                  <h4 className="font-bold text-black mb-3 flex items-center gap-2">
                    <Calculator className="w-5 h-5" style={{ color: theme.primary }} />
                    Payment Details
                  </h4>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-black">Total Amount:</span>
                    <span className="text-xl font-bold" style={{ color: theme.accent }}>₹{bookingData?.totalAmount || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Includes all taxes and fees</div>
                  {operatorId && operatorData ? (
                    <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Operator ID: {operatorId} will be automatically added to all records
                    </div>
                  ) : (
                    <div className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      ⚠️ Operator not found in operators collection
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-bold text-black mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" style={{ color: theme.primary }} />
                    Selected Seats Summary
                  </h4>
                  {bookingData?.selectedSeats && bookingData.selectedSeats.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {bookingData.selectedSeats.map((seatId, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-3 text-center">
                          <div className="font-bold text-lg text-gray-800">
                            {formatSeatName(seatId)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {getDeckName(seatId)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Original ID: {seatId}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">
                      No seats selected
                    </div>
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

export default Payment;
