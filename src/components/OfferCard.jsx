import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Tag, Calendar, Percent } from 'lucide-react';

const CardSlider = () => {
  const topRowRef = useRef(null);
  const bottomRowRef = useRef(null);

  const scroll = (ref, direction) => {
    const scrollAmount = 300;
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Top row data - Offers
  const offers = [
    {
      id: 1,
      title: "Save up to Rs 100 on bus tickets",
      code: "RKTBUS",
      validTill: "31 Jul",
      bgColor: "bg-gradient-to-br from-blue-300 to-blue-500",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop"
    },
    {
      id: 2,
      title: "Save Flat Rs.100 Discount on Prasanna Purple Mobility",
      code: "PURPLE100",
      validTill: "31 Jul",
      bgColor: "bg-gradient-to-br from-pink-300 to-pink-500",
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=200&fit=crop"
    },
    {
      id: 3,
      title: "Save up to Rs 50 on bus tickets",
      code: "WELCOME50",
      validTill: "30 Nov",
      bgColor: "bg-gradient-to-br from-purple-300 to-purple-500",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop"
    },
    {
      id: 4,
      title: "Save Flat Rs.100 Discount on Atamaram Travels",
      code: "ATMARAM100",
      validTill: "31 Jul",
      bgColor: "bg-gradient-to-br from-orange-300 to-orange-500",
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=200&fit=crop"
    },
    {
      id: 5,
      title: "Special Weekend Offer",
      code: "WEEKEND75",
      validTill: "15 Aug",
      bgColor: "bg-gradient-to-br from-green-300 to-green-500",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop"
    },
    {
      id: 6,
      title: "Monsoon Special Deal",
      code: "RAIN200",
      validTill: "30 Sep",
      bgColor: "bg-gradient-to-br from-teal-300 to-teal-500",
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=200&fit=crop"
    }
  ];

  // Bottom row data - What's new
  const whatsNew = [
    {
      id: 1,
      title: "JAW-DROPPING PRICES ON BRAND-NEW CARS",
      subtitle: "Book your new car with us today at unbeatable discounts",
      bgColor: "bg-gradient-to-br from-slate-700 to-slate-900",
      image: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=400&h=150&fit=crop",
      textColor: "text-white"
    },
    {
      id: 2,
      title: "Free Cancellation",
      subtitle: "Get 100% refund on cancellation",
      bgColor: "bg-gradient-to-br from-red-600 to-red-800",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=150&fit=crop",
      textColor: "text-white"
    },
    {
      id: 3,
      title: "Introducing Bus timetable",
      subtitle: "Get local bus timings between cities in your state",
      bgColor: "bg-gradient-to-br from-orange-400 to-orange-600",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=150&fit=crop",
      textColor: "text-white"
    },
    {
      id: 4,
      title: "FlexiTicket",
      subtitle: "Get amazing benefits on Date Change & Cancellation",
      bgColor: "bg-gradient-to-br from-blue-400 to-blue-600",
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=150&fit=crop",
      textColor: "text-white"
    },
    {
      id: 5,
      title: "Smart Booking",
      subtitle: "AI-powered seat selection for best comfort",
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-700",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=150&fit=crop",
      textColor: "text-white"
    },
    {
      id: 6,
      title: "Express Routes",
      subtitle: "Fastest routes to your destination",
      bgColor: "bg-gradient-to-br from-green-500 to-green-700",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=150&fit=crop",
      textColor: "text-white"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Offers for you section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Offers for you</h2>
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            View more
          </button>
        </div>
        
        {/* Filter buttons */}
        <div className="flex gap-3 mb-2">
          <button className="px-4 py-2 bg-pink-100 text-pink-800 rounded-full font-medium">
            All
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
            Bus
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
            Train
          </button>
        </div>

        {/* Top row slider */}
        <div className="relative">
          <button 
            onClick={() => scroll(topRowRef, 'left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div 
            ref={topRowRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {offers.map((offer) => (
              <div 
                key={offer.id}
                className={`min-w-80 h-48 ${offer.bgColor} rounded-2xl p-6 relative overflow-hidden flex-shrink-0 cursor-pointer hover:scale-105 transition-transform`}
              >
                <div className="relative z-10">
                  <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium mb-3 w-fit">
                    Bus
                  </div>
                  <h3 className="text-white font-bold text-lg mb-4 leading-tight">
                    {offer.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-white bg-opacity-20 px-3 py-1 rounded-full">
                      <Tag className="w-4 h-4 text-white" />
                      <span className="text-white font-medium text-sm">{offer.code}</span>
                    </div>
                    <div className="text-white text-sm">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Valid till {offer.validTill}
                    </div>
                  </div>
                </div>
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `url(${offer.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => scroll(topRowRef, 'right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* What's new section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">What's new</h2>
        </div>

        {/* Bottom row slider */}
        <div className="relative">
          <button 
            onClick={() => scroll(bottomRowRef, 'left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div 
            ref={bottomRowRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {whatsNew.map((item) => (
              <div 
                key={item.id}
                className={`min-w-80 h-32 ${item.bgColor} rounded-2xl p-6 relative overflow-hidden flex-shrink-0 cursor-pointer hover:scale-105 transition-transform`}
              >
                <div className="relative z-10 flex items-center h-full">
                  <div className="flex-1">
                    <h3 className={`${item.textColor} font-bold text-lg mb-2 leading-tight`}>
                      {item.title}
                    </h3>
                    <p className={`${item.textColor} opacity-90 text-sm`}>
                      {item.subtitle}
                    </p>
                  </div>
                  {item.id === 2 && (
                    <div className="ml-4">
                      <div className="bg-white bg-opacity-20 rounded-full p-3">
                        <Percent className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => scroll(bottomRowRef, 'right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardSlider;