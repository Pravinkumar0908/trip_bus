// services/bookingService.js
import { doc, updateDoc, addDoc, collection, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';

// Complete booking process with seat status update
export const completeBooking = async (paymentData) => {
  try {
    console.log('🎫 Starting booking completion process...');
    
    const result = await runTransaction(db, async (transaction) => {
      // 1. Get current bus data
      const busRef = doc(db, 'buses', paymentData.busData.id);
      const busDoc = await transaction.get(busRef);
      
      if (!busDoc.exists()) {
        throw new Error('Bus not found');
      }
      
      const currentBusData = busDoc.data();
      
      // 2. Update seat statuses to "booked" (2)
      const updatedSeatLayout = { ...currentBusData.seatLayout };
      
      paymentData.selectedSeats.forEach(seatId => {
        const [deck, rowStr, colStr] = seatId.split('-');
        const row = parseInt(rowStr);
        const col = parseInt(colStr);
        
        if (updatedSeatLayout[deck] && updatedSeatLayout[deck][row]) {
          updatedSeatLayout[deck][row][col] = 2; // 2 = Booked
        }
      });
      
      // 3. Update available seats count
      const newAvailableSeats = (currentBusData.availableSeats || 0) - paymentData.selectedSeats.length;
      
      // 4. Update bus document with new seat statuses
      transaction.update(busRef, {
        seatLayout: updatedSeatLayout,
        availableSeats: Math.max(0, newAvailableSeats),
        updatedAt: new Date()
      });
      
      // 5. Create booking document
      const bookingRef = doc(collection(db, 'bookings'));
      const bookingData = {
        // Booking ID and basic info
        bookingId: paymentData.bookingId,
        transactionId: paymentData.transactionId,
        
        // Bus information
        busId: paymentData.busData.id,
        busData: {
          operatorName: paymentData.busData.operatorName || paymentData.busData.operator,
          busNumber: paymentData.busData.busNumber,
          busType: paymentData.busData.type,
          route: paymentData.busData.route,
          date: paymentData.busData.date,
          departureTime: paymentData.busData.departureTime,
          arrivalTime: paymentData.busData.arrivalTime,
          duration: paymentData.busData.duration
        },
        
        // Seat details
        selectedSeats: paymentData.selectedSeats,
        totalSeats: paymentData.selectedSeats.length,
        seatNames: paymentData.selectedSeats.map(seatId => {
          const [deck, rowStr, colStr] = seatId.split('-');
          const row = parseInt(rowStr);
          const col = parseInt(colStr);
          return `${String.fromCharCode(65 + row)}${col + 1}`;
        }),
        
        // Boarding/Dropping points
        boardingPoint: paymentData.selectedBoardingPoint,
        droppingPoint: paymentData.selectedDroppingPoint,
        
        // Passenger information
        passengers: paymentData.passengers || [],
        totalPassengers: paymentData.totalPassengers || paymentData.selectedSeats.length,
        
        // Contact details
        contactDetails: {
          phone: paymentData.contactDetails?.phone || '',
          email: paymentData.contactDetails?.email || '',
          state: paymentData.contactDetails?.state || 'Rajasthan',
          whatsappEnabled: paymentData.contactDetails?.whatsappEnabled || false
        },
        
        // Payment information
        paymentDetails: {
          method: paymentData.paymentMethod,
          amount: paymentData.totalAmount || paymentData.paidAmount,
          status: 'completed',
          timestamp: new Date(),
          ...paymentData.paymentDetails
        },
        
        // Booking status and timestamps
        bookingStatus: 'confirmed',
        bookingDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Additional metadata
        totalAmount: paymentData.totalAmount || paymentData.paidAmount,
        currency: 'INR',
        isActive: true
      };
      
      transaction.set(bookingRef, bookingData);
      
      return {
        bookingId: paymentData.bookingId,
        bookingRef: bookingRef.id,
        updatedSeats: paymentData.selectedSeats.length
      };
    });
    
    console.log('✅ Booking completed successfully:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Booking completion failed:', error);
    throw new Error(`Booking failed: ${error.message}`);
  }
};

// Get booking details by booking ID
export const getBookingDetails = async (bookingId) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const querySnapshot = await getDocs(query(bookingsRef, where('bookingId', '==', bookingId)));
    
    if (querySnapshot.empty) {
      throw new Error('Booking not found');
    }
    
    const bookingDoc = querySnapshot.docs[0];
    return { id: bookingDoc.id, ...bookingDoc.data() };
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
};
