import { useState, useEffect } from 'react';
import { 
  FiMessageCircle, FiPhone, FiSearch, FiSend, FiUser,
  FiClock, FiCheckCircle, FiHelpCircle, 
  FiFileText, FiStar,
  FiThumbsUp, FiThumbsDown, FiX, FiChevronDown, FiChevronUp,
  FiCalendar, FiTag
} from 'react-icons/fi';
import { 
  BiSupport, BiChat
  } from 'react-icons/bi';
import { 
  MdOutlineHeadsetMic, MdOutlineVideoCall, MdOutlineEmail,
  MdOutlineWhatsapp, MdOutlineFeedback} from 'react-icons/md';
import { 
  
  RiCustomerService2Fill} from 'react-icons/ri';
import Navbar from '../components/Navbar';

const Support = () => {
  const [activeTab, setActiveTab] = useState('help');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [] = useState('open');
  const [isTyping, setIsTyping] = useState(false);

  // Support statistics
  const supportStats = [
    {
      icon: <MdOutlineHeadsetMic className="w-8 h-8" />,
      title: "24/7 Support",
      value: "Always Available",
      description: "Round the clock assistance",
      color: "from-red-500 to-red-600"
    },
    {
      icon: <FiClock className="w-8 h-8" />,
      title: "Response Time",
      value: "< 2 minutes",
      description: "Average response time",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <FiCheckCircle className="w-8 h-8" />,
      title: "Resolution Rate",
      value: "98.5%",
      description: "Issues resolved successfully",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <FiStar className="w-8 h-8" />,
      title: "Satisfaction",
      value: "4.9/5",
      description: "Customer satisfaction rating",
      color: "from-yellow-500 to-yellow-600"
    }
  ];

  // Contact methods
  const contactMethods = [
    {
      icon: <FiMessageCircle className="w-8 h-8" />,
      title: "Live Chat",
      description: "Chat with our support team instantly",
      availability: "24/7 Available",
      action: "Start Chat",
      color: "bg-red-500 hover:bg-red-600",
      popular: true
    },
    {
      icon: <FiPhone className="w-8 h-8" />,
      title: "Phone Support",
      description: "Speak directly with our experts",
      availability: "+91-1800-123-4567",
      action: "Call Now",
      color: "bg-blue-500 hover:bg-blue-600",
      popular: false
    },
    {
      icon: <MdOutlineEmail className="w-8 h-8" />,
      title: "Email Support",
      description: "Send us detailed queries via email",
      availability: "support@busapp.com",
      action: "Send Email",
      color: "bg-green-500 hover:bg-green-600",
      popular: false
    },
    {
      icon: <MdOutlineWhatsapp className="w-8 h-8" />,
      title: "WhatsApp",
      description: "Quick support via WhatsApp",
      availability: "+91-98765-43210",
      action: "Message",
      color: "bg-emerald-500 hover:bg-emerald-600",
      popular: true
    },
    {
      icon: <MdOutlineVideoCall className="w-8 h-8" />,
      title: "Video Call",
      description: "Face-to-face support session",
      availability: "Book appointment",
      action: "Schedule",
      color: "bg-purple-500 hover:bg-purple-600",
      popular: false
    },
    {
      icon: <RiCustomerService2Fill className="w-8 h-8" />,
      title: "Help Center",
      description: "Browse our comprehensive guides",
      availability: "Self-service portal",
      action: "Browse",
      color: "bg-orange-500 hover:bg-orange-600",
      popular: false
    }
  ];

  // FAQ categories
  const faqCategories = [
    { id: 'all', name: 'All Topics', icon: <FiHelpCircle className="w-5 h-5" /> },
    { id: 'booking', name: 'Booking', icon: <FiCalendar className="w-5 h-5" /> },
    { id: 'payment', name: 'Payment', icon: <FiFileText className="w-5 h-5" /> },
    { id: 'cancellation', name: 'Cancellation', icon: <FiX className="w-5 h-5" /> },
    { id: 'refund', name: 'Refund', icon: <FiTag className="w-5 h-5" /> },
    { id: 'account', name: 'Account', icon: <FiUser className="w-5 h-5" /> }
  ];

  // FAQ data
  const faqs = [
    {
      id: 1,
      category: 'booking',
      question: "How do I book a bus ticket online?",
      answer: "To book a bus ticket: 1) Enter your source and destination cities, 2) Select travel date, 3) Choose your preferred bus, 4) Select seats, 5) Enter passenger details, 6) Make payment. You'll receive confirmation via SMS and email.",
      helpful: 245,
      notHelpful: 12
    },
    {
      id: 2,
      category: 'booking',
      question: "Can I modify my booking after confirmation?",
      answer: "Yes, you can modify your booking up to 2 hours before departure. Go to 'My Bookings', select the ticket, and click 'Modify'. Additional charges may apply for date/time changes.",
      helpful: 189,
      notHelpful: 8
    },
    {
      id: 3,
      category: 'payment',
      question: "What payment methods do you accept?",
      answer: "We accept all major payment methods including Credit/Debit cards, UPI, Net Banking, Mobile Wallets (Paytm, PhonePe, Google Pay), and EMI options for bookings above ₹3000.",
      helpful: 156,
      notHelpful: 5
    },
    {
      id: 4,
      category: 'cancellation',
      question: "What is your cancellation policy?",
      answer: "Free cancellation up to 24 hours before departure. 50% refund for cancellations 12-24 hours before. 25% refund for cancellations 6-12 hours before. No refund for cancellations within 6 hours.",
      helpful: 203,
      notHelpful: 15
    },
    {
      id: 5,
      category: 'refund',
      question: "How long does it take to process refunds?",
      answer: "Refunds are processed within 5-7 business days to the original payment method. For UPI/Wallet payments, refunds are instant. You'll receive confirmation via email once processed.",
      helpful: 178,
      notHelpful: 9
    },
    {
      id: 6,
      category: 'account',
      question: "How do I create an account?",
      answer: "Click 'Sign Up' on our homepage, enter your mobile number, verify with OTP, complete your profile with name and email. You can also sign up using Google or Facebook accounts.",
      helpful: 134,
      notHelpful: 6
    }
  ];

  // Sample chat messages
  const initialChatMessages = [
    {
      id: 1,
      sender: 'support',
      message: "Hello! Welcome to BusApp Support. How can I help you today?",
      time: "10:30 AM",
      avatar: 'S'
    },
    {
      id: 2,
      sender: 'user',
      message: "Hi, I need help with my booking cancellation",
      time: "10:31 AM",
      avatar: 'U'
    },
    {
      id: 3,
      sender: 'support',
      message: "I'd be happy to help you with the cancellation. Could you please provide your booking ID?",
      time: "10:31 AM",
      avatar: 'S'
    }
  ];

  useEffect(() => {
    setChatMessages(initialChatMessages);
  }, []);

  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Send message function
  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: chatMessages.length + 1,
        sender: 'user',
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: 'U'
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
      
      // Simulate typing and response
      setIsTyping(true);
      setTimeout(() => {
        const response = {
          id: chatMessages.length + 2,
          sender: 'support',
          message: "Thank you for your message. I'm looking into this for you. Please give me a moment.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: 'S'
        };
        setChatMessages(prev => [...prev, response]);
        setIsTyping(false);
      }, 2000);
    }
  };

  // Handle FAQ helpful votes
  const handleFaqVote = (faqId, isHelpful) => {
    // In real app, this would update the database
    console.log(`FAQ ${faqId} voted as ${isHelpful ? 'helpful' : 'not helpful'}`);
  };

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 animate-bounce">
              <BiSupport className="w-10 h-10" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Customer Support</h1>
            <p className="text-xl text-red-100 max-w-3xl mx-auto mb-8">
              We're here to help! Get instant support, find answers, or connect with our expert team 24/7.
            </p>
          </div>
        </div>
      </div>

      {/* Support Stats */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {supportStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-all duration-300 animate-fadeInUp"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${stat.color} rounded-xl text-white mb-4`}>
                {stat.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{stat.value}</h3>
              <p className="text-gray-600 font-semibold mb-1">{stat.title}</p>
              <p className="text-sm text-gray-500">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-wrap border-b border-gray-200">
            {[
              { id: 'help', name: 'Help Center', icon: <FiHelpCircle className="w-5 h-5" /> },
              { id: 'contact', name: 'Contact Us', icon: <FiMessageCircle className="w-5 h-5" /> },
              { id: 'chat', name: 'Live Chat', icon: <BiChat className="w-5 h-5" /> },
              { id: 'feedback', name: 'Feedback', icon: <MdOutlineFeedback className="w-5 h-5" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Help Center Tab */}
        {activeTab === 'help' && (
          <div className="space-y-8">
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">How can we help you?</h2>
                <p className="text-gray-600">Search our knowledge base or browse categories</p>
              </div>
              
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for help articles, guides, or questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                  />
                </div>
              </div>

              {/* FAQ Categories */}
              <div className="flex flex-wrap gap-3 justify-center">
                {faqCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    {category.icon}
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                {selectedCategory === 'all' ? 'Frequently Asked Questions' : `${faqCategories.find(cat => cat.id === selectedCategory)?.name} Questions`}
              </h3>
              
              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors duration-200"
                    >
                      <h4 className="text-lg font-semibold text-gray-800 pr-4">{faq.question}</h4>
                      {expandedFaq === faq.id ? (
                        <FiChevronUp className="w-5 h-5 text-red-500 flex-shrink-0" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    
                    {expandedFaq === faq.id && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <p className="text-gray-600 mb-4 leading-relaxed">{faq.answer}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">Was this helpful?</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleFaqVote(faq.id, true)}
                                className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                              >
                                <FiThumbsUp className="w-4 h-4" />
                                <span>{faq.helpful}</span>
                              </button>
                              <button
                                onClick={() => handleFaqVote(faq.id, false)}
                                className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              >
                                <FiThumbsDown className="w-4 h-4" />
                                <span>{faq.notHelpful}</span>
                              </button>
                            </div>
                          </div>
                          
                          <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                            Need more help?
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contact Us Tab */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeInUp ${
                  method.popular ? 'ring-2 ring-red-200' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {method.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      Popular
                    </span>
                  </div>
                )}
                
                <div className={`inline-flex items-center justify-center w-16 h-16 ${method.color} rounded-xl text-white mb-6`}>
                  {method.icon}
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-3">{method.title}</h3>
                <p className="text-gray-600 mb-4">{method.description}</p>
                <p className="text-sm text-gray-500 mb-6">{method.availability}</p>
                
                <button className={`w-full ${method.color} text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105`}>
                  {method.action}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Live Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <FiMessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Live Chat Support</h3>
                  <p className="text-red-100">Our team is online and ready to help</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Online</span>
                </div>
              </div>
            </div>

            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    message.sender === 'user' ? 'bg-blue-500' : 'bg-red-500'
                  }`}>
                    {message.avatar}
                  </div>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-br-lg'
                      : 'bg-gray-100 text-gray-800 rounded-bl-lg'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-lg">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition-colors duration-200"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Share Your Feedback</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Your feedback helps us improve our service. Let us know about your experience.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Feedback Type
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option>General Feedback</option>
                    <option>Bug Report</option>
                    <option>Feature Request</option>
                    <option>Complaint</option>
                    <option>Compliment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rate Your Experience
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="text-2xl text-yellow-400 hover:text-yellow-500 transition-colors duration-200"
                      >
                        <FiStar className="w-8 h-8 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    rows="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Tell us about your experience..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
                >
                  Submit Feedback
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-3xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-lg text-red-100 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-red-600 py-3 px-8 rounded-xl font-bold hover:bg-red-50 transition-all duration-200 transform hover:scale-105">
                Start Live Chat
              </button>
              <button className="bg-red-700 text-white py-3 px-8 rounded-xl font-bold hover:bg-red-800 transition-all duration-200 transform hover:scale-105">
                Call Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
    </>
  );
};

export default Support;
