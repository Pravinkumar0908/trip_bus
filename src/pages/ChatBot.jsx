import React, { useState, useEffect, useRef } from 'react';
import { 
  FaRobot, 
  FaUser, 
  FaPaperPlane, 
  FaTimes, 
  FaSpinner,
  FaPhone,
  FaEnvelope,
  FaComments,
  FaLightbulb,
  FaQuestionCircle,
  FaHeadset,
  FaExpand,
  FaCompress
} from 'react-icons/fa';

const ChatBot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef(null);

  // Check if mobile device
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Static FAQ Database with intelligent pattern matching
  const faqDatabase = [
    {
      id: 'booking_process',
      patterns: [
        'how to book bus', 'bus booking process', 'book ticket', 'reservation kaise kare',
        'ticket book karna', 'bus kaise book kare', 'booking kaise karen', 'bus ticket book',
        'how to reserve', 'reservation process', 'book bus online', 'ticket booking steps',
        'bus booking kaise kare', 'online booking', 'book karna hai', 'booking process'
      ],
      question: "Bus ticket कैसे book करते हैं?",
      answer: `🎫 **Bus Booking Process:**\n\n**Step by Step:**\n1️⃣ **Search Form** में details भरें:\n   • From: Departure city\n   • To: Destination city\n   • Date: Journey date\n\n2️⃣ "Search Buses" click करें\n\n3️⃣ Available buses में से choose करें:\n   • Price comparison देखें\n   • Amenities check करें\n   • Departure time देखें\n\n4️⃣ **Seat Selection:**\n   • Window/Aisle preference\n   • Upper/Lower berth (sleeper में)\n\n5️⃣ **Passenger Details** भरें\n\n6️⃣ **Payment** complete करें\n\n7️⃣ **E-ticket** email/SMS पर मिल जाएगा\n\n💡 **Pro Tip:** Advance booking करने से better prices मिलते हैं!`
    },
    
    {
      id: 'cancellation',
      patterns: [
        'cancel booking', 'cancellation policy', 'ticket cancel', 'booking cancel kaise kare',
        'cancel karna hai', 'refund kaise mile', 'cancellation charges', 'cancel process',
        'booking cancel', 'ticket cancellation', 'refund policy', 'money back',
        'cancel kaise kare', 'cancellation kaise kare', 'cancel ticket'
      ],
      question: "Booking cancel कैसे करें?",
      answer: `❌ **Booking Cancellation Process:**\n\n**Steps:**\n1️⃣ Website/App में **"My Bookings"** जाएं\n2️⃣ Cancel करने वाली booking select करें\n3️⃣ **"Cancel Booking"** option click करें\n4️⃣ Cancellation charges देखें\n5️⃣ Confirm cancellation\n\n💰 **Cancellation Charges:**\n• **24+ hours before:** ₹50-100\n• **12-24 hours:** ₹100-200\n• **2-12 hours:** ₹200-300\n• **Less than 2 hours:** ₹300-500\n\n🔄 **Refund Timeline:**\n• Credit/Debit Card: 5-7 days\n• UPI/Wallet: 1-2 days\n• Net Banking: 3-5 days\n\n⚠️ **Note:** Charges vary by operator और departure time`
    },

    {
      id: 'payment_methods',
      patterns: [
        'payment methods', 'payment options', 'pay kaise kare', 'payment failed',
        'paisa kaise de', 'payment process', 'online payment', 'pay options',
        'payment kaise kare', 'paytm chalega', 'upi payment', 'card payment',
        'net banking', 'wallet payment', 'payment problem'
      ],
      question: "Payment कैसे करें?",
      answer: `💳 **Payment Options Available:**\n\n**Digital Payments:**\n💳 Credit/Debit Cards (Visa, MasterCard, RuPay)\n📱 UPI (GPay, PhonePe, Paytm, BHIM)\n🏦 Net Banking (All major banks)\n💰 Digital Wallets (Paytm, Mobikwik, Freecharge)\n\n**Payment Failed?**\n🔍 **Troubleshooting:**\n• Internet connection check करें\n• Card details verify करें\n• Sufficient balance ensure करें\n• Different payment method try करें\n• Browser refresh करें\n\n🔒 **Security Features:**\n• 256-bit SSL encryption\n• PCI DSS compliant\n• OTP verification\n• CVV protection\n\n📞 **Payment Issues:** Call 1800-123-4567`
    },

    {
      id: 'seat_selection',
      patterns: [
        'seat selection', 'seat choose kaise kare', 'window seat', 'aisle seat',
        'seat preference', 'good seat kaha milega', 'best seat', 'seat booking',
        'upper berth', 'lower berth', 'sleeper seat', 'AC seat', 'non ac seat',
        'seat kaise select kare', 'seat types'
      ],
      question: "Best seat कैसे choose करें?",
      answer: `🪑 **Seat Selection Guide:**\n\n**Seater Buses:**\n🪟 **Window Seats:**\n   • Scenic views\n   • Wall support for sleeping\n   • Privacy\n   • Fresh air (in non-AC)\n\n🚪 **Aisle Seats:**\n   • Easy bathroom access\n   • Leg stretching space\n   • Quick exit\n\n**Sleeper Buses:**\n⬆️ **Upper Berth:**\n   • More privacy\n   • Better for tall people\n   • Less disturbance\n\n⬇️ **Lower Berth:**\n   • Easy access\n   • Good for elderly\n   • More luggage space\n\n💡 **Pro Tips:**\n• Front seats: Less bumpy ride\n• Middle section: Balanced comfort\n• Back seats: Might be noisy\n• Book early for best selection`
    },

    {
      id: 'refund_policy',
      patterns: [
        'refund policy', 'money back', 'refund kaise mile', 'paisa wapas',
        'refund process', 'refund time', 'refund amount', 'money return',
        'refund rules', 'paisa kab milega', 'refund status', 'refund check'
      ],
      question: "Refund policy क्या है?",
      answer: `💰 **Refund Policy Details:**\n\n**Refund Amount Calculation:**\n💵 **Refund = Ticket Price - Cancellation Charges - Service Fee**\n\n**Timeline Based Charges:**\n⏰ **More than 24 hours:** 5-10% of ticket price\n⏰ **12-24 hours:** 15-25% of ticket price\n⏰ **2-12 hours:** 25-50% of ticket price\n⏰ **Less than 2 hours:** 50-75% of ticket price\n\n**Refund Processing Time:**\n💳 **Credit/Debit Cards:** 5-7 business days\n📱 **UPI/Wallets:** 1-2 business days\n🏦 **Net Banking:** 3-5 business days\n\n**Refund Status Check:**\n• My Bookings → Refund Status\n• Email/SMS notifications\n• Customer support: 1800-123-4567\n\n⚠️ **No Refund Cases:**\n• No-show (didn't board bus)\n• After bus departure\n• Festival/peak season (as per T&C)`
    },

    {
      id: 'contact_support',
      patterns: [
        'contact support', 'help phone number', 'customer care', 'helpline',
        'support team', 'call center', 'help desk', 'contact details',
        'customer service', 'support number', 'help center', 'complaint'
      ],
      question: "Support team से contact कैसे करें?",
      answer: `📞 **24/7 Customer Support:**\n\n**Phone Support:**\n📱 **Helpline:** 1800-123-4567 (Toll Free)\n📱 **WhatsApp:** +91-9876543210\n🕒 **Available:** 24/7\n\n**Digital Support:**\n💬 **Live Chat:** Website पर available (9 AM - 9 PM)\n📧 **Email:** support@busapp.com\n⚡ **Response Time:** Within 2 hours\n\n**Social Media:**\n📘 **Facebook:** /BusAppSupport\n🐦 **Twitter:** @BusAppHelp\n📷 **Instagram:** @busapp_official\n\n**Self Service:**\n🤖 **AI Assistant:** यही मैं हूं! (Always available)\n❓ **FAQ Section:** Website पर detailed help\n📱 **Mobile App:** In-app support chat\n\n**Regional Support:**\n🗣️ **Languages:** Hindi, English, Tamil, Telugu, Bengali\n🌍 **Local Numbers:** Major cities में local support\n\n💡 **Quick Tip:** Booking ID ready रखें faster resolution के लिए!`
    },

    {
      id: 'offers_discounts',
      patterns: [
        'offers', 'discount', 'promo code', 'coupon', 'deal',
        'cashback', 'offer kya hai', 'discount code', 'cheap ticket',
        'sale', 'festival offer', 'first booking offer'
      ],
      question: "Current offers और discounts क्या हैं?",
      answer: `🎯 **Current Offers & Discounts:**\n\n**New User Offers:**\n🆕 **FIRST50:** First booking पर ₹50 off\n🎁 **WELCOME100:** ₹100 cashback (Min booking ₹500)\n\n**Regular Discounts:**\n💳 **SAVE20:** UPI payments पर 20% off (Max ₹200)\n🏦 **CARD15:** Credit card से 15% discount\n📱 **APP10:** Mobile app से booking पर ₹10 extra off\n\n**Festival Specials:**\n🎉 **FESTIVE30:** Festival seasons में 30% off\n🎆 **DIWALI50:** Diwali special - Up to ₹50 off\n🕉️ **HOLI25:** Holi offer - 25% discount\n\n**Group Bookings:**\n👥 **GROUP5:** 5+ tickets पर 10% group discount\n🎒 **FAMILY15:** Family packages में 15% off\n\n**Weekly Deals:**\n📅 **MONDAY:** Monday bookings पर extra 5% off\n🎯 **WEEKEND:** Weekend travel deals\n\n**How to Use:**\n• Checkout page पर promo code enter करें\n• Terms & conditions apply\n• Offers change regularly\n\n💡 **Subscribe करें:** Latest offers के लिए email/SMS alerts!`
    }
  ];

  // Quick questions for easy access - Mobile optimized
  const quickQuestions = [
    { text: "Bus booking कैसे करें?", query: "how to book bus ticket" },
    { text: "Cancellation policy", query: "booking cancel kaise kare" },
    { text: "Payment options", query: "payment methods" },
    { text: "Seat selection tips", query: "best seat kaise choose kare" },
    { text: "Current offers", query: "discount offers" },
    { text: "Contact support", query: "customer care number" },
    { text: "Refund policy", query: "refund kaise mile" },
    { text: "Best seats", query: "seat selection guide" }
  ];

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialMessage = {
        sender: 'bot',
        text: `नमस्ते! 🙏 मैं आपका AI Bus Booking Assistant हूं।\n\n🚌 **मैं आपकी कैसे मदद कर सकता हूं:**\n• Bus ticket booking\n• Cancellation & refunds\n• Payment issues\n• Seat selection\n• Current offers\n• General queries\n\nनीचे quick questions भी हैं या फिर अपना सवाल type करें! 😊`,
        timestamp: new Date(),
        id: 'initial'
      };
      setMessages([initialMessage]);
    }
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Animation for chat window
  const toggleChat = () => {
    if (!isOpen) {
      setIsAnimating(true);
      setIsOpen(true);
      setTimeout(() => setIsAnimating(false), 300);
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsFullScreen(false);
        setIsAnimating(false);
      }, 200);
    }
  };

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Smart pattern matching function
  const findBestMatch = (userInput) => {
    const input = userInput.toLowerCase().trim();
    
    // First, try exact pattern matching
    for (const faq of faqDatabase) {
      for (const pattern of faq.patterns) {
        if (input.includes(pattern.toLowerCase()) || 
            pattern.toLowerCase().includes(input) ||
            calculateSimilarity(input, pattern.toLowerCase()) > 0.7) {
          return faq;
        }
      }
    }

    // If no exact match, try fuzzy matching
    let bestMatch = null;
    let bestScore = 0;

    for (const faq of faqDatabase) {
      for (const pattern of faq.patterns) {
        const score = calculateSimilarity(input, pattern.toLowerCase());
        if (score > bestScore && score > 0.5) {
          bestScore = score;
          bestMatch = faq;
        }
      }
    }

    return bestMatch;
  };

  // Similarity calculation
  const calculateSimilarity = (str1, str2) => {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    
    let matchingWords = 0;
    const totalWords = Math.max(words1.length, words2.length);

    words1.forEach(word1 => {
      if (words2.some(word2 => 
          word2.includes(word1) || 
          word1.includes(word2) ||
          levenshteinDistance(word1, word2) <= 1
      )) {
        matchingWords++;
      }
    });

    return matchingWords / totalWords;
  };

  // Simple Levenshtein distance
  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  // Send message function
  const sendMessage = async (messageText = null) => {
    const userMessage = messageText || input.trim();
    if (!userMessage) return;

    const newMessage = { sender: 'user', text: userMessage };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setLoading(true);
    setShowQuickQuestions(false);

    // Find best matching response with realistic delay
    setTimeout(() => {
      const matchedFAQ = findBestMatch(userMessage);
      
      let response;
      if (matchedFAQ) {
        response = matchedFAQ.answer;
      } else {
        // Default response when no match found
        response = `माफ़ करें, मैं इस सवाल का exact answer नहीं दे पा रहा। 😅\n\n**आप ये try कर सकते हैं:**\n• नीचे दिए गए quick questions use करें\n• अपना सवाल differently phrase करें\n• Direct customer support से बात करें\n\n📞 **Immediate Help:** 1800-123-4567\n\n**Popular Topics:**\n• Bus booking process\n• Cancellation policy\n• Payment methods\n• Refund status\n• Current offers`;
      }

      setMessages(prev => [...prev, { sender: 'bot', text: response }]);
      setLoading(false);
    }, 1000 + Math.random() * 1000); // 1-2 seconds realistic delay
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      sender: 'bot',
      text: `Chat cleared! 🧹\n\nकैसे help करूं आपकी? नीचे quick questions हैं या अपना सवाल type करें।`,
      timestamp: new Date(),
      id: 'cleared'
    }]);
    setShowQuickQuestions(true);
  };

  const handleQuickQuestion = (questionQuery) => {
    sendMessage(questionQuery);
  };

  return (
    <>
      {/* Floating Chat Button - Mobile Center Positioned */}
      {!isOpen && (
        <div className={`fixed z-50 ${
          isMobile 
            ? 'bottom-4 left-10 transform -translate-x-1/2' // Center on mobile
            : 'bottom-6 right-6' // Right on desktop
        }`}>
          <button
            onClick={toggleChat}
            className="relative bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 sm:p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 transform animate-pulse"
          >
            <FaRobot className="text-xl sm:text-2xl" />
            
            {/* Notification Dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </button>
        </div>
      )}

      {/* Chat Window - Half Screen on Mobile */}
      {isOpen && (
        <div className={`fixed z-50 bg-white shadow-2xl border border-gray-200 p-2 flex flex-col transform transition-all duration-300 ${
          isAnimating ? 'scale-95 opacity-90' : 'scale-100 opacity-100'
        } ${
          isMobile 
            ? (isFullScreen 
              ? 'inset-0 rounded-none' // Full screen when expanded
              : 'bottom-0 left-0 right-0 rounded-t-xl' // Half screen by default
            )
            : 'bottom-6 right-6 w-80 sm:w-96 rounded-xl' // Desktop floating
        }`}
        style={{
          // 🔥 KEY CHANGE: Half screen height on mobile
          height: isMobile 
            ? (isFullScreen ? '100vh' : '60vh') // Half screen or full screen
            : '500px' // Fixed height on desktop
        }}
        >
          
          {/* Header with Gradient - Mobile Optimized */}
          <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white p-3 sm:p-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <FaRobot className="text-xl sm:text-2xl" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base sm:text-lg truncate">AI Assistant</h3>
                <p className="text-xs opacity-90 flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></span>
                  Online • Smart FAQ System
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Fullscreen Toggle - Mobile Only */}
              {isMobile && (
                <button
                  onClick={toggleFullScreen}
                  className="text-white hover:bg-red-600 p-1.5 sm:p-2 rounded-full transition-colors text-sm"
                  title={isFullScreen ? "Half Screen" : "Full Screen"}
                >
                  {isFullScreen ? <FaCompress /> : <FaExpand />}
                </button>
              )}
              
              <button
                onClick={clearChat}
                className="text-white hover:bg-red-600 p-1.5 sm:p-2 rounded-full transition-colors text-xs sm:text-sm"
                title="Clear Chat"
              >
                Clear
              </button>
              
              <button
                onClick={toggleChat}
                className="text-white hover:bg-red-600 p-1.5 sm:p-2 rounded-full transition-colors"
              >
                <FaTimes className="text-sm sm:text-base" />
              </button>
            </div>
          </div>

          {/* Messages Container - Mobile Optimized with Flex-1 */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-50 to-white custom-scrollbar min-h-0">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[300px] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white rounded-br-sm shadow-lg'
                      : 'bg-white text-gray-800 shadow-md border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {msg.sender === 'bot' && (
                      <FaRobot className="text-red-500 mt-1 flex-shrink-0 text-xs sm:text-sm animate-pulse" />
                    )}
                    {msg.sender === 'user' && (
                      <FaUser className="text-white mt-1 flex-shrink-0 text-xs sm:text-sm" />
                    )}
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white text-gray-800 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-md border border-gray-100 rounded-bl-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FaRobot className="text-red-500 animate-bounce text-sm" />
                    <FaSpinner className="animate-spin text-red-500 text-sm" />
                    <p className="text-xs sm:text-sm">Finding perfect answer...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Questions Grid - Mobile Optimized */}
            {showQuickQuestions && messages.length <= 1 && !loading && (
              <div className="space-y-2 sm:space-y-3 mt-2 sm:mt-4 animate-fadeIn">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2 sm:mb-3 flex items-center justify-center gap-1 font-medium">
                    <FaQuestionCircle className="text-red-500" /> 
                    Popular Questions - Click to ask:
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                  {quickQuestions.slice(0, isMobile && !isFullScreen ? 4 : 8).map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestion(question.query)}
                      className="text-xs bg-gradient-to-r from-red-50 to-red-100 text-red-700 p-2 sm:p-3 rounded-xl border border-red-200 hover:from-red-100 hover:to-red-200 transition-all duration-200 text-left hover:shadow-md transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <FaLightbulb className="text-yellow-500 animate-pulse flex-shrink-0" />
                      <span className="font-medium truncate">{question.text}</span>
                    </button>
                  ))}
                </div>
                
                <div className="text-center mt-2 sm:mt-4">
                  <p className="text-xs text-gray-400 italic">
                    💡 You can also type your own questions
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Section - Mobile Optimized, Flex-Shrink-0 */}
          <div className="flex-shrink-0 p-2 sm:p-4 border-t border-gray-200 bg-white rounded-b-xl">
            <div className="flex gap-2 sm:gap-3 mb-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="अपना सवाल यहाँ लिखें..."
                className="flex-1 border border-gray-300 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                rows={1}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg disabled:shadow-none flex-shrink-0"
              >
                {loading ? 
                  <FaSpinner className="animate-spin text-sm sm:text-base" /> : 
                  <FaPaperPlane className="text-sm sm:text-base" />
                }
              </button>
            </div>
            
            {/* Footer Info - Mobile Optimized */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 sm:gap-2 text-gray-500 min-w-0">
                <FaHeadset className="flex-shrink-0" />
                <span className="truncate">Powered by <span className="text-red-500">EasyTrip</span></span>
              </div>
              <button
                onClick={() => setShowQuickQuestions(!showQuickQuestions)}
                className="text-red-500 hover:text-red-700 font-medium transition-colors text-xs flex-shrink-0 ml-2"
              >
                {showQuickQuestions ? 'Hide' : 'Show'} Quick
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ef4444, #dc2626);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #dc2626, #b91c1c);
        }

        @media (max-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 2px;
          }
        }
      `}</style>
    </>
  );
};

export default ChatBot;
