import React, { useState } from 'react';
import Navbar from '../components/Navbar';

const MultiCouponPage = () => {
  const [copiedCode, setCopiedCode] = useState('');

  const coupons = [
    {
      id: 1,
      title: "Enjoy Your Gift",
      discount: "50% OFF",
      subtitle: "Welcome Coupon",
      validTill: "Dec 31, 2025",
      code: "GIFT50",
      bgColor: "gold",
      textColor: "text-black"
    },
    {
      id: 2,
      title: "Weekend Special",
      discount: "30% OFF",
      subtitle: "Weekend Deal",
      validTill: "Aug 31, 2025",
      code: "WEEKEND30",
      bgColor: "#FF6B6B",
      textColor: "text-white"
    },
    {
      id: 3,
      title: "First Time User",
      discount: "40% OFF",
      subtitle: "Welcome Offer",
      validTill: "Sep 15, 2025",
      code: "FIRST40",
      bgColor: "#4ECDC4",
      textColor: "text-white"
    },
    {
      id: 4,
      title: "Family Pack",
      discount: "35% OFF",
      subtitle: "Group Booking",
      validTill: "Sep 30, 2025",
      code: "FAMILY35",
      bgColor: "#45B7D1",
      textColor: "text-white"
    },
    {
      id: 5,
      title: "Student Special",
      discount: "45% OFF",
      subtitle: "Student Discount",
      validTill: "Dec 31, 2025",
      code: "STUDENT45",
      bgColor: "#96CEB4",
      textColor: "text-black"
    },
    {
      id: 6,
      title: "Premium Travel",
      discount: "25% OFF",
      subtitle: "Luxury Buses",
      validTill: "Oct 15, 2025",
      code: "LUXURY25",
      bgColor: "#FFEAA7",
      textColor: "text-black"
    },
    {
      id: 7,
      title: "Flash Sale",
      discount: "60% OFF",
      subtitle: "Limited Time",
      validTill: "Aug 5, 2025",
      code: "FLASH60",
      bgColor: "#FD79A8",
      textColor: "text-white"
    },
    {
      id: 8,
      title: "Night Travel",
      discount: "20% OFF",
      subtitle: "Overnight Journey",
      validTill: "Nov 30, 2025",
      code: "NIGHT20",
      bgColor: "#6C5CE7",
      textColor: "text-white"
    },
    {
      id: 9,
      title: "Holiday Special",
      discount: "55% OFF",
      subtitle: "Festival Offer",
      validTill: "Nov 30, 2025",
      code: "HOLIDAY55",
      bgColor: "#E17055",
      textColor: "text-white"
    }
  ];

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    });
  };

  const CouponCard = ({ coupon }) => {
    return (
      <div className="relative mb-6">
        {/* Desktop Version */}
        <div 
          className="hidden sm:flex w-full max-w-sm h-48 rounded-xl overflow-hidden mx-auto shadow-lg cursor-pointer relative items-stretch uppercase transition-all duration-300 hover:scale-105 hover:shadow-xl"
          onClick={() => handleCopyCode(coupon.code)}
          style={{
            filter: 'drop-shadow(0 3px 5px rgba(0, 0, 0, 0.3))',
            backgroundColor: coupon.bgColor
          }}
        >
          {/* Left Section */}
          <div className={`w-1/5 flex items-center justify-center border-r-2 border-dashed border-black border-opacity-20 ${coupon.textColor}`}>
            <div 
              className="whitespace-nowrap font-bold text-xs"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {coupon.title}
            </div>
          </div>

          {/* Center Section */}
          <div className="flex-grow flex items-center justify-center text-center px-2">
            <div>
              <h2 className="bg-black text-yellow-400 px-2 text-2xl md:text-3xl whitespace-nowrap font-bold rounded">
                {coupon.discount}
              </h2>
              <h3 className={`text-xl md:text-2xl font-bold mt-1 ${coupon.textColor}`}>
                {coupon.subtitle}
              </h3>
              <small className={`text-xs font-semibold tracking-wider ${coupon.textColor} opacity-80 block mt-1`}>
                Valid till {coupon.validTill}
              </small>
            </div>
          </div>

          {/* Right Section */}
          <div className="w-24 flex items-center justify-center bg-white rounded-l-full">
            <div 
              className="text-lg font-bold text-black"
              style={{ 
                fontFamily: '"Courier New", monospace',
                transform: 'rotate(-90deg)'
              }}
            >
              {coupon.code}
            </div>
          </div>
        </div>

        {/* Mobile Version */}
        <div 
          className="sm:hidden w-80 rounded-xl overflow-hidden mx-auto shadow-lg cursor-pointer relative uppercase transition-all duration-300 hover:scale-105"
          onClick={() => handleCopyCode(coupon.code)}
          style={{
            filter: 'drop-shadow(0 3px 5px rgba(0, 0, 0, 0.3))',
            backgroundColor: coupon.bgColor
          }}
        >
          <div className="p-4">
            {/* Title */}
            <div className={`text-center font-bold text-sm mb-3 ${coupon.textColor}`}>
              {coupon.title}
            </div>

            {/* Main Content */}
            <div className="text-center mb-3">
              <h2 className="bg-black text-yellow-400 px-3 py-1 text-3xl whitespace-nowrap font-bold inline-block rounded">
                {coupon.discount}
              </h2>
              <h3 className={`text-3xl font-bold mt-2 ${coupon.textColor}`}>
                {coupon.subtitle}
              </h3>
              <small className={`text-xs font-semibold tracking-wider block mt-1 ${coupon.textColor} opacity-80`}>
                Valid until {coupon.validTill}
              </small>
            </div>

            {/* Code */}
            <div className="text-center bg-white py-3 rounded">
              <div 
                className="text-xl font-bold text-black"
                style={{ 
                  fontFamily: '"Courier New", monospace'
                }}
              >
                {coupon.code}
              </div>
            </div>
          </div>
        </div>
        
        {/* Copy Feedback */}
        {copiedCode === coupon.code && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium animate-bounce z-10">
            Copied!
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white py-8 px-4 pt-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Exclusive Coupon Codes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Save big on your next bus booking with our amazing discount offers!
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4 rounded"></div>
        </div>

        {/* Stats Section */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white text-center transform hover:scale-105 transition-all duration-300">
            <h3 className="text-3xl font-bold">Up to 60%</h3>
            <p className="text-purple-100">Maximum Discount</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white text-center transform hover:scale-105 transition-all duration-300">
            <h3 className="text-3xl font-bold">{coupons.length}</h3>
            <p className="text-green-100">Active Coupons</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-6 text-white text-center transform hover:scale-105 transition-all duration-300">
            <h3 className="text-3xl font-bold">₹1000+</h3>
            <p className="text-blue-100">Total Savings</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white text-center transform hover:scale-105 transition-all duration-300">
            <h3 className="text-3xl font-bold">24/7</h3>
            <p className="text-orange-100">Available</p>
          </div>
        </div>

        {/* Main Coupons Grid - 3 Columns */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coupons.map((coupon, index) => (
              <div 
                key={coupon.id} 
                className="opacity-0 animate-fadeIn"
                style={{ 
                  animation: `fadeIn 0.6s ease-in-out forwards ${index * 100}ms` 
                }}
              >
                <CouponCard coupon={coupon} />
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl p-8 text-white">
            <h2 className="text-4xl font-bold mb-4">Don't Miss Out!</h2>
            <p className="text-lg text-purple-100 mb-6 max-w-2xl mx-auto">
              These amazing offers won't last forever. Click on any coupon to copy the code and start booking your bus tickets now!
            </p>
            <button className="bg-white text-purple-600 py-4 px-8 rounded-2xl font-bold text-lg hover:bg-purple-50 transition-all duration-200 transform hover:scale-105">
              Start Booking Now →
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="max-w-4xl mx-auto mt-12 p-6 bg-gray-50 rounded-2xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Click on Coupon</h4>
              <p className="text-gray-600 text-sm">Click on any coupon card to copy the code</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Code Copied</h4>
              <p className="text-gray-600 text-sm">The coupon code will be copied to your clipboard</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Apply & Save</h4>
              <p className="text-gray-600 text-sm">Paste the code during checkout and save money</p>
            </div>
          </div>
        </div>

        {/* Custom CSS Styles */}
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.6s ease-in-out forwards;
          }
        `}</style>
      </div>
    </>
  );
};

export default MultiCouponPage;
