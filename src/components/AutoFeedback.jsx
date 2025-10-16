import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc, 
  updateDoc, 
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../config/firebase';

const AutoFeedback = () => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Check for completed journeys
  const checkCompletedJourneys = async () => {
    if (!currentUser?.uid) return;

    try {
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', currentUser.uid),
        where('paymentStatus', '==', 'completed')
      );

      const snapshot = await getDocs(paymentsQuery);
      
      // Find first eligible booking for feedback
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        if (isJourneyCompleted(data) && !data.feedbackGiven && !data.feedbackSkipped) {
          setCurrentBooking({ ...data, docId: docSnapshot.id });
          setShowFeedback(true);
          break; // Show only one feedback at a time
        }
      }
    } catch (error) {
      console.error('Error checking completed journeys:', error);
    }
  };

  // Check if journey is completed
  const isJourneyCompleted = (bookingData) => {
    try {
      const currentTime = new Date();
      const journeyDate = new Date(bookingData.busDetails?.date);
      const arrivalTime = bookingData.droppingPoint?.time;

      if (!arrivalTime) return false;

      // Handle both 12-hour and 24-hour formats
      let [hours, minutes] = arrivalTime.split(':');
      
      // Check for PM indicator
      if (arrivalTime.toLowerCase().includes('pm') && parseInt(hours) !== 12) {
        hours = parseInt(hours) + 12;
      } else if (arrivalTime.toLowerCase().includes('am') && parseInt(hours) === 12) {
        hours = 0;
      }

      journeyDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Add 15 minutes buffer after arrival
      const completionTime = new Date(journeyDate.getTime() + 15 * 60 * 1000);
      
      return currentTime >= completionTime;
    } catch (error) {
      console.error('Error checking journey completion:', error);
      return false;
    }
  };

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Add feedback to collection
      await addDoc(collection(db, 'feedbacks'), {
        bookingId: currentBooking.bookingId,
        userId: currentBooking.userId,
        userEmail: currentBooking.userEmail,
        userName: currentBooking.userName,
        busId: currentBooking.busId,
        busNumber: currentBooking.busNumber,
        operatorId: currentBooking.operatorId,
        operatorName: currentBooking.operatorName,
        rating: rating,
        comment: comment.trim(),
        journeyDate: currentBooking.busDetails.date,
        from: currentBooking.busDetails.from,
        to: currentBooking.busDetails.to,
        boardingPoint: currentBooking.boardingPoint?.name || 'N/A',
        droppingPoint: currentBooking.droppingPoint?.name || 'N/A',
        seatNumbers: currentBooking.seatNumbers,
        createdAt: serverTimestamp(),
        status: 'submitted'
      });

      // Update booking status
      const bookingRef = doc(db, 'payments', currentBooking.docId);
      await updateDoc(bookingRef, {
        feedbackGiven: true,
        feedbackDate: serverTimestamp(),
        feedbackRating: rating
      });

      alert('Thank you for your feedback! 🙏');
      closeFeedback();
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    }
    
    setIsSubmitting(false);
  };

  // Close feedback modal
  const closeFeedback = () => {
    setShowFeedback(false);
    setRating(0);
    setComment('');
    setCurrentBooking(null);
  };

  // Skip feedback
  const skipFeedback = async () => {
    try {
      const bookingRef = doc(db, 'payments', currentBooking.docId);
      await updateDoc(bookingRef, {
        feedbackSkipped: true,
        feedbackSkippedDate: serverTimestamp()
      });
      closeFeedback();
    } catch (error) {
      console.error('Error skipping feedback:', error);
      closeFeedback();
    }
  };

  // Auto check every 2 minutes
  useEffect(() => {
    if (!currentUser?.uid) return;

    checkCompletedJourneys();
    const interval = setInterval(checkCompletedJourneys, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [currentUser]);

  // Star Rating Component
  const StarRating = () => (
    <div className="flex justify-center space-x-2 my-6">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setRating(star)}
          className={`text-4xl transition-all duration-300 transform hover:scale-110 ${
            star <= rating 
              ? 'text-yellow-400 drop-shadow-lg' 
              : 'text-gray-300 hover:text-yellow-200'
          }`}
        >
          ⭐
        </button>
      ))}
    </div>
  );

  // Rating Text
  const getRatingText = () => {
    const texts = {
      1: "Poor Experience 😞",
      2: "Below Average 😕", 
      3: "Average 😐",
      4: "Good Experience 😊",
      5: "Excellent! 😍"
    };
    return texts[rating] || "Please select a rating";
  };

  if (!showFeedback || !currentBooking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto transform transition-all duration-300 scale-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
          <div className="text-center">
            <div className="text-5xl mb-3">🚌</div>
            <h2 className="text-2xl font-bold mb-2">How was your journey?</h2>
            <p className="text-red-100 text-sm">Your feedback helps us improve our service</p>
          </div>
        </div>

        {/* Journey Details Card */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              🎫 Journey Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Bus Number:</span>
                <p className="font-medium text-gray-800">{currentBooking.busNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Operator:</span>
                <p className="font-medium text-gray-800">{currentBooking.operatorName}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Route:</span>
                <p className="font-medium text-gray-800">
                  {currentBooking.busDetails.from} → {currentBooking.busDetails.to}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>
                <p className="font-medium text-gray-800">{currentBooking.busDetails.date}</p>
              </div>
              <div>
                <span className="text-gray-500">Arrival Time:</span>
                <p className="font-medium text-gray-800">{currentBooking.droppingPoint?.time}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Section */}
        <div className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Rate Your Experience
            </h3>
            <StarRating />
            <p className={`text-lg font-medium mb-6 ${
              rating > 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {getRatingText()}
            </p>
          </div>

          {/* Comment Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Share your experience (Optional):
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about service quality, punctuality, staff behavior, cleanliness, etc..."
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-all duration-200"
              rows="4"
              maxLength="500"
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">Your feedback is valuable to us</span>
              <span className="text-xs text-gray-500">{comment.length}/500</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSubmitFeedback}
              disabled={isSubmitting || rating === 0}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform ${
                isSubmitting || rating === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-lg hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Submitting Feedback...
                </div>
              ) : (
                'Submit Feedback ✨'
              )}
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={skipFeedback}
                className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Maybe Later
              </button>
              <button
                onClick={closeFeedback}
                className="flex-1 py-3 px-4 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-2xl text-center">
          <p className="text-xs text-gray-500">
            Thank you for choosing our service! 🚌💙
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutoFeedback;
