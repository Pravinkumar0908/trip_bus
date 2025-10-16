import React, { useState, useEffect } from 'react';
import { 
  Star, Clock, MapPin, Wifi, X, Zap, Wind, Tv, Droplets, ChevronDown, Camera,
  MessageSquare, FileText, Bus, ShieldCheck, Armchair, UserCheck, Utensils, Route,
  ChevronLeft, ChevronRight, Award, MapPinned, Flag, Coffee
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper for smooth content animation
const AnimatedContent = ({ children, key }) => (
  <div key={key} className="animate-fadeIn">{children}</div>
);

const BusInfoCard = ({ 
  isModal = false, 
  onClose, 
  selectedSeats = [], 
  busData = null, 
  operatorDetails = null,
  boardingDropPoints = null 
}) => {
  const [activeTab, setActiveTab] = useState('whyBook');
  const [openPolicy, setOpenPolicy] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [busImages, setBusImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [reviews, setReviews] = useState({
    average: 4.5,
    total: 0,
    categoryRatings: [],
    comments: [],
    isLoading: true
  });

  // **MAIN FUNCTION: Fetch Reviews WITHOUT Complex Index**
  useEffect(() => {
    const fetchOperatorReviews = async () => {
      console.log('🚀 Starting review fetch process...');
      
      if (!busData) {
        console.log('❌ No busData provided');
        setReviews(prev => ({ ...prev, isLoading: false }));
        return;
      }

      console.log(`📋 BusData received:`, {
        operatorId: busData.operatorId,
        operatorName: busData.operatorName,
        busId: busData.busId,
        busNumber: busData.busNumber
      });

      if (!busData.operatorId) {
        console.log('❌ No operatorId found in busData');
        setReviews(prev => ({ 
          ...prev, 
          isLoading: false,
          average: busData?.rating || 4.5,
          total: 0,
          comments: []
        }));
        return;
      }

      try {
        setReviews(prev => ({ ...prev, isLoading: true }));
        
        console.log(`🔍 Querying feedbacks for operatorId: ${busData.operatorId}`);

        // **SIMPLIFIED QUERY - Only operatorId filter (no multiple where + orderBy)**
        const feedbackQuery = query(
          collection(db, 'feedbacks'),
          where('operatorId', '==', busData.operatorId),
          limit(100) // Get more data to filter manually
        );

        console.log('📡 Executing simplified Firestore query...');
        const querySnapshot = await getDocs(feedbackQuery);
        console.log(`📦 Query completed. Found ${querySnapshot.size} documents`);

        const reviewsData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // **CLIENT-SIDE FILTERING** for 'status' and sorting
          if (data.status === 'submitted') {
            console.log(`📄 Processing review: ${doc.id} - Rating: ${data.rating} - User: ${data.userName}`);
            
            reviewsData.push({
              id: doc.id,
              userName: data.userName || 'Anonymous Traveller',
              userEmail: data.userEmail || '',
              rating: data.rating || 4,
              comment: data.comment || 'Good service',
              bookingId: data.bookingId,
              busNumber: data.busNumber,
              operatorName: data.operatorName,
              journeyDate: data.journeyDate,
              from: data.from,
              to: data.to,
              boardingPoint: data.boardingPoint,
              droppingPoint: data.droppingPoint,
              seatNumbers: data.seatNumbers,
              createdAt: data.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Recent',
              timestamp: data.createdAt?.toDate?.()?.getTime?.() || Date.now()
            });
          }
        });

        // **CLIENT-SIDE SORTING** by timestamp (newest first)
        reviewsData.sort((a, b) => b.timestamp - a.timestamp);

        console.log(`✅ Processed ${reviewsData.length} valid reviews`);

        // Calculate average rating from actual reviews
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = reviewsData.length > 0 ? totalRating / reviewsData.length : (busData.rating || 4.5);

        console.log(`📊 Rating calculation: Total: ${totalRating}, Count: ${reviewsData.length}, Average: ${avgRating}`);

        // Generate category ratings based on overall average
        const categoryRatings = [
          { 
            name: 'Punctuality', 
            rating: Math.min(5, Math.max(1, avgRating + (Math.random() * 0.6 - 0.3)))
          },
          { 
            name: 'Cleanliness', 
            rating: Math.min(5, Math.max(1, avgRating + (Math.random() * 0.6 - 0.3)))
          },
          { 
            name: 'Staff Behaviour', 
            rating: Math.min(5, Math.max(1, avgRating + (Math.random() * 0.6 - 0.3)))
          },
          { 
            name: 'Comfort', 
            rating: Math.min(5, Math.max(1, avgRating + (Math.random() * 0.6 - 0.3)))
          },
          { 
            name: 'Value for Money', 
            rating: Math.min(5, Math.max(1, avgRating + (Math.random() * 0.6 - 0.3)))
          }
        ];

        // Take top 8 reviews for display
        const displayReviews = reviewsData.slice(0, 8);

        const finalReviewState = {
          average: Math.round(avgRating * 10) / 10,
          total: reviewsData.length,
          categoryRatings: categoryRatings,
          comments: displayReviews,
          isLoading: false
        };

        console.log(`🎉 Final reviews state:`, {
          average: finalReviewState.average,
          total: finalReviewState.total,
          commentsCount: finalReviewState.comments.length
        });

        setReviews(finalReviewState);

      } catch (error) {
        console.error(`❌ Error fetching reviews: ${error.message}`);
        
        // Fallback to default reviews on error
        setReviews({
          average: busData?.rating || operatorDetails?.rating || 4.5,
          total: 0,
          categoryRatings: [
            { name: 'Punctuality', rating: busData?.rating || 4.5 },
            { name: 'Cleanliness', rating: busData?.rating || 4.5 },
            { name: 'Staff Behaviour', rating: busData?.rating || 4.5 }
          ],
          comments: [],
          isLoading: false
        });
      }
    };

    fetchOperatorReviews();
  }, [busData?.operatorId, busData?.operatorName]);

  // Fetch bus images
  useEffect(() => {
    const fetchBusImages = () => {
      if (!busData) {
        setIsLoadingImages(false);
        return;
      }

      setIsLoadingImages(true);

      try {
        const images = [];
        
        if (busData.images) {
          const imageFields = [
            'exteriorFrontUrl',
            'exteriorSideUrl', 
            'interiorMainUrl',
            'interiorSleeperUrl',
            'seatLayoutUrl',
            'entryDoorUrl',
            'luggageAreaUrl'
          ];

          const imageLabels = {
            'exteriorFrontUrl': 'Front Exterior View',
            'exteriorSideUrl': 'Side Exterior View',
            'interiorMainUrl': 'Interior Main Area',
            'interiorSleeperUrl': 'Sleeper Area',
            'seatLayoutUrl': 'Seat Layout',
            'entryDoorUrl': 'Entry Door',
            'luggageAreaUrl': 'Luggage Area'
          };

          imageFields.forEach(field => {
            if (busData.images[field]) {
              images.push({
                url: busData.images[field],
                title: `${busData.operator || busData.operatorName || 'Premium'} - ${imageLabels[field]}`
              });
            }
          });
        }

        // Fallback images if none found
        if (images.length === 0) {
          images.push(
            { 
              url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop", 
              title: `${busData.operator || busData.operatorName || 'Premium'} Bus - Exterior View` 
            },
            { 
              url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&h=400&fit=crop", 
              title: `${busData.operator || busData.operatorName || 'Premium'} Bus - Interior Layout` 
            },
            { 
              url: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?w=800&h=400&fit=crop", 
              title: `${busData.operator || busData.operatorName || 'Premium'} Bus - Comfort Features` 
            }
          );
        }

        setBusImages(images);
        setCurrentImageIndex(0);
      } catch (error) {
        console.error('Error processing bus images:', error);
        setBusImages([
          { 
            url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop", 
            title: "Premium Bus Service" 
          }
        ]);
      } finally {
        setIsLoadingImages(false);
      }
    };

    fetchBusImages();
  }, [busData]);

  // TIME FORMATTING HELPER
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    const hourInt = parseInt(hour, 10);
    const ampm = hourInt >= 12 ? 'PM' : 'AM';
    let formattedHour = hourInt % 12;
    if (formattedHour === 0) {
      formattedHour = 12;
    }
    return `${String(formattedHour).padStart(2, '0')}:${minute} ${ampm}`;
  };

  // Auto-sliding images
  useEffect(() => {
    if (busImages.length <= 1) return;
    
    const sliderInterval = setInterval(() => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % busImages.length);
    }, 5000);
    
    return () => clearInterval(sliderInterval);
  }, [busImages.length]);

  const nextImage = () => setCurrentImageIndex(prevIndex => (prevIndex + 1) % busImages.length);
  const prevImage = () => setCurrentImageIndex(prevIndex => (prevIndex - 1 + busImages.length) % busImages.length);
  const goToSlide = (index) => setCurrentImageIndex(index);

  // BUS DETAILS
  const busDetails = {
    name: busData?.operatorName || busData?.operator || "PREMIUM TRAVELS",
    type: busData?.busType || busData?.type || "Multi-Axle A/C Sleeper",
    tags: busData?.features || busData?.tags || ["Premium", "GPS Trackable", "Top Rated"],
    rating: reviews.average,
    totalRatings: reviews.total,
    schedule: {
      departure: busData?.departureTime || busData?.departure || "18:10",
      arrival: busData?.arrivalTime || busData?.arrival || "06:30", 
      duration: busData?.duration || busData?.journeyDuration || "12h 20m",
      departureCity: busData?.route?.from || busData?.source || "Bangalore",
      arrivalCity: busData?.route?.to || busData?.destination || "Hyderabad",
    },
    liveStatus: {
      status: "On Time",
      message: `Departed from ${busData?.route?.from || busData?.source || 'Bangalore'}`,
      nextStop: "Next stop in 2h 15m", 
      progress: 15
    },
    price: busData?.baseFare || busData?.price || 1299,
    totalFare: busData?.totalFare || (busData?.price ? busData.price + Math.floor(busData.price * 0.12) : 1455)
  };

  // ROUTE STOPS GENERATION
  const generateRouteStops = () => {
    const stops = [];
    
    if (busData?.boardingPoints?.length > 0) {
      busData.boardingPoints.forEach(point => {
        stops.push({
          type: 'boarding',
          time: point.time,
          city: point.name?.split(',')[0] || point.name || 'City',
          point: point.address || point.landmark || point.name,
          status: 'upcoming'
        });
      });
    } else if (boardingDropPoints?.boarding?.length > 0) {
      boardingDropPoints.boarding.forEach(point => {
        stops.push({
          type: 'boarding',
          time: point.time,
          city: point.name?.split(',')[0] || point.city || 'City',
          point: point.address || point.name,
          status: 'upcoming'
        });
      });
    } else {
      stops.push(
        { type: 'boarding', time: busDetails.schedule.departure, city: busDetails.schedule.departureCity, point: "Main Bus Stand", status: 'upcoming' }
      );
    }

    stops.push(
      { type: 'stop', time: "21:30", city: "Highway Stop", point: "Rest Area", status: 'upcoming' },
      { type: 'rest', time: "00:15", city: "Midway", point: "Rest Stop (20 mins)", status: 'upcoming' }
    );

    if (busData?.droppingPoints?.length > 0) {
      busData.droppingPoints.forEach(point => {
        stops.push({
          type: 'dropping',
          time: point.time,
          city: point.name?.split(',')[0] || point.name || 'City',
          point: point.address || point.landmark || point.name,
          status: 'upcoming'
        });
      });
    } else if (boardingDropPoints?.dropping?.length > 0) {
      boardingDropPoints.dropping.forEach(point => {
        stops.push({
          type: 'dropping',
          time: point.time,
          city: point.name?.split(',')[0] || point.city || 'City',
          point: point.address || point.name,
          status: 'upcoming'
        });
      });
    } else {
      stops.push(
        { type: 'dropping', time: busDetails.schedule.arrival, city: busDetails.schedule.arrivalCity, point: "Main Bus Terminal", status: 'upcoming' }
      );
    }

    return stops;
  };

  const routeStops = generateRouteStops();

  // AMENITIES GENERATION
  const generateAmenities = () => {
    const busAmenities = busData?.amenities || [];
    
    const defaultAmenities = {
      comfort: [
        { name: "A/C", icon: Wind, available: busAmenities.includes('ac') || busDetails.type.includes('AC') },
        { name: "Sleeper", icon: Armchair, available: busDetails.type.includes('Sleeper') },
        { name: "Water Bottle", icon: Droplets, available: true },
        { name: "Snacks", icon: Coffee, available: false }
      ],
      safety: [
        { name: "Live Tracking", icon: MapPin, available: busDetails.tags.includes('GPS Trackable') || true },
        { name: "Verified Staff", icon: UserCheck, available: true },
        { name: "CCTV", icon: Camera, available: true }
      ],
      entertainment: [
        { name: "WiFi", icon: Wifi, available: busAmenities.includes('wifi') },
        { name: "Charging Point", icon: Zap, available: busAmenities.includes('charging') },
        { name: "Live TV", icon: Tv, available: false }
      ]
    };

    return defaultAmenities;
  };

  const amenities = generateAmenities();

  // POLICIES
  const policies = busData?.policies?.cancellation ? [
    {
      title: "Cancellation Policy",
      content: busData.policies.cancellation.join(". ")
    },
    {
      title: "Partial Cancellation",
      content: busData.policies.partial_cancellation?.join(". ") || "Partial cancellation allowed with applicable charges."
    },
    {
      title: "Baggage Allowance", 
      content: "1 piece of luggage (up to 15kg) and one personal bag allowed. Extra luggage will be charged."
    },
    {
      title: "Child Fare",
      content: "Children above 5 years need a full ticket. No charges for children below 5 if no separate seat is required."
    }
  ] : [
    { title: "Cancellation Policy", content: "Tickets can be cancelled up to 4 hours before departure. Cancellation charges apply based on time." },
    { title: "Baggage Allowance", content: "1 piece of luggage (up to 15kg) and one personal bag allowed. Extra luggage will be charged." },
    { title: "Child Fare", content: "Children above 5 years need a full ticket. No charges for children below 5 if no separate seat is required." },
  ];

  // Selected seats info
  const selectedSeatsInfo = {
    count: selectedSeats.length,
    totalAmount: selectedSeats.length * busDetails.price,
    seatNumbers: selectedSeats.map(seatId => {
      const [deck, row, col] = seatId.split('-');
      const rowLetter = String.fromCharCode(65 + parseInt(row));
      const seatNumber = parseInt(col) + 1;
      return `${rowLetter}${seatNumber}`;
    })
  };

  // RENDER FUNCTIONS
  const renderWhyBook = () => (
    <AnimatedContent key="whyBook">
      <div className="space-y-4">
        {selectedSeats.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-bold text-blue-800 text-lg mb-2">Your Selection</h4>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-700">Selected Seats: {selectedSeatsInfo.seatNumbers.join(', ')}</span>
              <span className="font-bold text-blue-800">₹{selectedSeatsInfo.totalAmount}</span>
            </div>
            <p className="text-sm text-gray-600">{selectedSeats.length} seat(s) selected</p>
          </div>
        )}

        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-bold text-red-800 text-lg mb-2">
            {busDetails.tags.includes('Primo') ? 'Primo Bus Guarantee' : 'Premium Service Guarantee'}
          </h4>
          <p className="text-sm text-gray-700">
            Enjoy {busDetails.tags.includes('Primo') ? 'premium' : 'quality'} services with {busDetails.name}. 
            We guarantee on-time departure, clean vehicles, and professional staff.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Star className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="font-semibold text-gray-800">Top Rated</p>
              <p className="text-sm text-gray-600">{reviews.average}/5 stars from {reviews.total} travellers.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <ShieldCheck className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-semibold text-gray-800">Safety First</p>
              <p className="text-sm text-gray-600">Live tracking, CCTV, and verified staff.</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-bold text-green-800 text-lg mb-2">Fare Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base Fare:</span>
              <span>₹{busDetails.price}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes & Fees:</span>
              <span>₹{busDetails.totalFare - busDetails.price}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total Fare:</span>
              <span>₹{busDetails.totalFare}</span>
            </div>
          </div>
        </div>
      </div>
    </AnimatedContent>
  );

  const PointList = ({ points, type }) => {
    const groupedByCity = points.reduce((acc, point) => {
      acc[point.city] = acc[point.city] || [];
      acc[point.city].push(point);
      return acc;
    }, {});
  
    const Icon = type === 'boarding' ? Flag : MapPinned;
  
    return (
      <div className="space-y-4">
        {Object.entries(groupedByCity).map(([city, cityPoints]) => (
          <div key={city}>
            <h4 className="font-bold text-gray-800 mb-2 pb-2 border-b">{city}</h4>
            <div className="space-y-1">
              {cityPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-4 p-3 hover:bg-gray-100 rounded-lg">
                  <Icon className="w-5 h-5 text-red-500 mt-1 shrink-0"/>
                  <div>
                    <p className="font-semibold text-gray-800">{formatTime(point.time)}</p>
                    <p className="text-sm text-gray-600">{point.point}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderBoardingPoints = () => (
    <AnimatedContent key="boarding">
      <PointList points={routeStops.filter(s => s.type === 'boarding')} type="boarding" />
    </AnimatedContent>
  );

  const renderDroppingPoints = () => (
    <AnimatedContent key="dropping">
      <PointList points={routeStops.filter(s => s.type === 'dropping')} type="dropping" />
    </AnimatedContent>
  );
  
  const renderRestStops = () => (
    <AnimatedContent key="restStops">
      <div className="space-y-2">
        {routeStops.filter(s => s.type === 'rest').length > 0 ? (
          routeStops.filter(s => s.type === 'rest').map((stop, i) =>
            <div key={i} className="flex items-start gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Coffee className="w-6 h-6 text-blue-600 mt-1 shrink-0"/>
              <div>
                <p className="font-semibold text-gray-800">{formatTime(stop.time)} - {stop.point}</p>
                <p className="text-sm text-gray-600">Located in {stop.city}. A short break to freshen up.</p>
              </div>
            </div>
          )
        ) : (
          <p className="text-center text-gray-500 p-4">No rest stops on this route.</p>
        )}
      </div>
    </AnimatedContent>
  );
  
  const renderRoute = () => {
    const lastDepartedIndex = routeStops.map(s => s.status).lastIndexOf('departed');
    return (
      <AnimatedContent key="route">
        <div className="relative space-y-2">
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200 border-l-2 border-dotted border-gray-400"></div>
          {lastDepartedIndex !== -1 && (
            <div className="absolute left-4 top-4 w-0.5 bg-red-500 animate-route-progress" style={{ height: `calc(${lastDepartedIndex * 6}rem)` }}></div>
          )}
          {routeStops.map((stop, index) => {
            const isDeparted = stop.status === 'departed';
            const Icon = stop.type === 'rest' ? Utensils : Bus;
            return (
              <div key={index} className="flex gap-4 items-start relative z-10 pl-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isDeparted ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="pb-8 -mt-1 w-full">
                  <p className={`font-semibold ${isDeparted ? 'text-gray-800' : 'text-gray-600'}`}>{formatTime(stop.time)} - {stop.city}</p>
                  <p className="text-sm text-gray-500">{stop.point}</p>
                </div>
              </div>
            );
          })}
        </div>
      </AnimatedContent>
    );
  };
  
  const renderAmenities = () => (
    <AnimatedContent key="amenities">
      <div className="space-y-6">
        {Object.entries(amenities).map(([category, items]) => (
          <div key={category}>
            <h4 className="text-lg font-bold text-gray-800 mb-3 capitalize border-b pb-2">{category}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
              {items.map(amenity => {
                const Icon = amenity.icon;
                return (
                  <div key={amenity.name} className={`flex items-center gap-3 ${!amenity.available ? 'opacity-40' : ''}`}>
                    <Icon className="w-6 h-6 text-red-500" />
                    <span className="font-medium text-gray-700">{amenity.name}</span>
                    {!amenity.available && <span className="text-xs text-gray-400">(N/A)</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AnimatedContent>
  );

  // **UPDATED REVIEWS RENDER WITHOUT INDEX REQUIREMENT**
  const renderReviews = () => (
    <AnimatedContent key="reviews">
      <div className="space-y-6">
        {reviews.isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-3"></div>
            <p className="text-gray-600">Loading reviews for {busData?.operatorName}...</p>
            <p className="text-sm text-gray-400 mt-1">Fetching from database...</p>
          </div>
        ) : (
          <>
            {/* Overall Rating Card */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border">
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">{reviews.average}</p>
                <div className="flex justify-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < Math.round(reviews.average) ? 'text-green-500' : 'text-gray-300'}`} 
                      fill="currentColor" 
                    />
                  ))}
                </div>
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-800 text-lg">
                  {reviews.average >= 4.5 ? 'Excellent Service' : 
                   reviews.average >= 4.0 ? 'Very Good' : 
                   reviews.average >= 3.5 ? 'Good Service' : 'Average Service'}
                </h4>
                <p className="text-sm text-gray-600 font-medium">
                  {busData?.operatorName || 'This Operator'}
                </p>
                <p className="text-xs text-gray-500">
                  {reviews.total > 0 ? (
                    <>Based on {reviews.total} passenger {reviews.total === 1 ? 'review' : 'reviews'}</>
                  ) : (
                    'No reviews yet - be the first to review!'
                  )}
                </p>
              </div>
            </div>

            {/* Category Ratings */}
            {reviews.categoryRatings.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h5 className="font-semibold text-gray-800 mb-3">Service Quality</h5>
                {reviews.categoryRatings.map(cat => (
                  <div key={cat.name} className="flex items-center justify-between mb-3 last:mb-0">
                    <span className="text-sm text-gray-600 font-medium">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${(cat.rating / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 font-bold w-8 text-right">
                        {cat.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Individual Reviews */}
            <div className="space-y-4 pt-4 border-t">
              <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Recent Reviews
                {reviews.total > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    (Showing {Math.min(reviews.comments.length, 8)} of {reviews.total})
                  </span>
                )}
              </h5>
              
              {reviews.comments.length > 0 ? (
                <div className="grid gap-4">
                  {reviews.comments.map((comment, index) => (
                    <div key={comment.id || index} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-800">{comment.userName}</p>
                          {comment.journeyDate && (
                            <p className="text-xs text-gray-500">
                              {comment.from} → {comment.to} | {comment.journeyDate}
                            </p>
                          )}
                          {comment.busNumber && (
                            <p className="text-xs text-gray-500">Bus: {comment.busNumber}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          <Star className="w-3 h-3" /> {comment.rating}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        "{comment.comment}"
                      </p>
                      <p className="text-xs text-gray-400 mt-2">{comment.createdAt}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h6 className="font-medium text-gray-600 mb-1">No Reviews Yet</h6>
                  <p className="text-sm text-gray-500">
                    Be the first to review {busData?.operatorName || 'this operator'}!
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Your feedback helps other travelers make better decisions
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AnimatedContent>
  );

  const renderPolicies = () => (
    <AnimatedContent key="policies">
      <div className="space-y-2">
        {policies.map((policy, index) => (
          <div key={policy.title} className="border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setOpenPolicy(openPolicy === index ? null : index)} className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-800 hover:bg-gray-50">
              <span>{policy.title}</span>
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openPolicy === index ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${openPolicy === index ? 'max-h-96' : 'max-h-0'}`}>
              <div className="p-4 pt-0 text-gray-600 text-sm">{policy.content}</div>
            </div>
          </div>
        ))}
      </div>
    </AnimatedContent>
  );

  // TABS CONFIGURATION
  const TABS = {
    'whyBook': { label: 'Why Book?', component: renderWhyBook, icon: Award },
    'route': { label: 'Bus Route', component: renderRoute, icon: Route },
    'boarding': { label: 'Boarding', component: renderBoardingPoints, icon: Flag },
    'dropping': { label: 'Dropping', component: renderDroppingPoints, icon: MapPinned },
    'restStops': { label: 'Rest Stops', component: renderRestStops, icon: Coffee },
    'amenities': { label: 'Amenities', component: renderAmenities, icon: Armchair },
    'reviews': { label: 'Reviews', component: renderReviews, icon: MessageSquare },
    'policies': { label: 'Policies', component: renderPolicies, icon: FileText },
  };

  return (
    <div className={`w-full font-sans ${isModal ? '' : 'bg-gray-100 lg:p-6 min-h-screen'}`}>
      <div className={`bg-white rounded-none sm:rounded-xl shadow-lg overflow-hidden relative max-w-3xl mx-auto ${isModal ? '' : 'h-full'}`}>
        
        {isModal && (
          <button onClick={onClose} className="absolute top-3 right-3 z-50 bg-white/80 hover:bg-white text-gray-700 hover:text-red-600 p-2 rounded-full shadow-md" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Professional Header */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{busDetails.name}</h3>
              <p className="text-sm text-gray-500">{busDetails.type}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {busDetails.tags.map(tag => (
                  <span key={tag} className="text-xs font-semibold bg-red-50 text-red-700 px-2 py-1 rounded">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              <Star className="w-4 h-4" /> {busDetails.rating}
              {reviews.total > 0 && (
                <span className="text-xs opacity-90">({reviews.total})</span>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-x-4 gap-y-2 flex-wrap text-gray-700 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{formatTime(busDetails.schedule.departure)} → {formatTime(busDetails.schedule.arrival)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{busDetails.schedule.departureCity} to {busDetails.schedule.arrivalCity}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-medium">{busDetails.schedule.duration}</span>
            </div>
          </div>
        </div>
        
        {/* Dynamic Image Slider */}
        <div className="relative h-48 sm:h-56 group bg-gray-200">
          {isLoadingImages ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-3"></div>
                <p className="text-gray-600">Loading bus images...</p>
              </div>
            </div>
          ) : busImages.length > 0 ? (
            <>
              <div className="w-full h-full overflow-hidden">
                <img 
                  src={busImages[currentImageIndex].url} 
                  alt={busImages[currentImageIndex].title} 
                  className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="absolute bottom-4 left-4 text-white z-10">
                <h4 className="font-bold text-lg">{busImages[currentImageIndex].title}</h4>
                <p className="text-sm opacity-90">
                  {busData?.images ? 'Real Bus Image' : 'Representative Image'} 
                  {busImages.length > 1 && ` (${currentImageIndex + 1} of ${busImages.length})`}
                </p>
              </div>
              
              {busImages.length > 1 && (
                <>
                  <button 
                    onClick={prevImage} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={nextImage} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
                    {busImages.map((_, index) => (
                      <button 
                        key={index} 
                        onClick={() => goToSlide(index)} 
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${currentImageIndex === index ? 'bg-white scale-125' : 'bg-white/50'}`}
                      ></button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No images available for this bus</p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Tabs with Horizontal Scroll */}
        <div className="border-b border-gray-200 sticky top-0 bg-white z-40">
          <div className="px-1 sm:px-2 flex items-center overflow-x-auto no-scrollbar">
            {Object.entries(TABS).map(([key, { label, icon: Icon }]) => (
              <button key={key} onClick={() => setActiveTab(key)} className={`flex items-center shrink-0 gap-2 py-3 px-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 border-b-2 ${activeTab === key ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {key === 'reviews' && reviews.total > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs px-1 py-0.5 rounded-full font-bold">
                    {reviews.total}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="p-4 sm:p-6 bg-gray-50">
          {TABS[activeTab].component()}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes route-progress-anim {
            from { height: 0; }
        }
        .animate-route-progress {
            animation: route-progress-anim 1.5s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default BusInfoCard;
