import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRightIcon, 
  CalendarIcon, 
  UserIcon, 
  EyeIcon, 
  HeartIcon, 
  ShareIcon, 
  SearchIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  TagIcon,
  ClockIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  StarIcon,
  TrendingUpIcon,
  FireIcon,
  NewspaperIcon,
  MapPinIcon,
  ShieldCheckIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  Bars3Icon,
  BellIcon,
  EnvelopeIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  CameraIcon,
  GlobeAltIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  ChevronUpIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolid, 
  BookmarkIcon as BookmarkSolid,
  StarIcon as StarSolid,
  FireIcon as FireSolid
} from '@heroicons/react/24/solid';
import Navbar from '../components/Navbar';

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [viewMode, setViewMode] = useState('grid');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [showNewsletter, setShowNewsletter] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const searchInputRef = useRef(null);

  const categories = [
    { 
      id: 'all', 
      name: 'All Posts', 
      icon: NewspaperIcon, 
      color: 'bg-red-500',
      gradient: 'from-red-500 to-red-600'
    },
    { 
      id: 'travel-tips', 
      name: 'Travel Tips', 
      icon: MapPinIcon, 
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'destinations', 
      name: 'Destinations', 
      icon: GlobeAltIcon, 
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600'
    },
    { 
      id: 'bus-safety', 
      name: 'Bus Safety', 
      icon: ShieldCheckIcon, 
      color: 'bg-yellow-500',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    { 
      id: 'offers', 
      name: 'Special Offers', 
      icon: GiftIcon, 
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600'
    },
    { 
      id: 'guides', 
      name: 'Travel Guides', 
      icon: BookOpenIcon, 
      color: 'bg-indigo-500',
      gradient: 'from-indigo-500 to-indigo-600'
    }
  ];

  const blogPosts = [
    {
      id: 1,
      title: 'Complete Guide to Rajasthan\'s Most Beautiful Places',
      content: `Rajasthan, the land of kings, is one of India's most captivating destinations. From the golden sands of the Thar Desert to the magnificent palaces of Jaipur, this state offers an incredible blend of history, culture, and natural beauty.

      **Top Destinations to Visit:**
      
      1. **Jaipur - The Pink City**: Known for its stunning architecture including Hawa Mahal, City Palace, and Amber Fort.
      
      2. **Udaipur - The City of Lakes**: Famous for Lake Palace, City Palace, and romantic boat rides on Lake Pichola.
      
      3. **Jodhpur - The Blue City**: Home to the magnificent Mehrangarh Fort and the blue-painted houses of the old city.
      
      4. **Jaisalmer - The Golden City**: Experience the magic of the Thar Desert, camel safaris, and the stunning Jaisalmer Fort.
      
      5. **Pushkar - The Holy City**: Sacred lakes, Brahma Temple, and vibrant camel fairs.
      
      6. **Mount Abu - Hill Station**: Cool retreat with Dilwara Temples and scenic viewpoints.
      
      **Best Time to Visit**: October to March when the weather is pleasant for sightseeing.
      
      **Travel Tips**:
      - Book bus tickets in advance during peak season
      - Carry sufficient water and sunscreen
      - Respect local customs and traditions
      - Try local Rajasthani cuisine like Dal Baati Churma
      - Bargain respectfully at local markets
      - Dress modestly when visiting temples
      
      **Getting Around**:
      Our luxury bus services connect all major cities in Rajasthan with comfortable seating, AC facilities, and professional drivers. Book your Rajasthan adventure today!
      
      Plan your Rajasthan trip with our comfortable bus services and create memories that will last a lifetime!`,
      author: 'Priya Sharma',
      date: '2024-01-15',
      category: 'destinations',
      image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&h=600&fit=crop',
      readTime: '8 min read',
      views: 1250,
      likes: 89,
      tags: ['Rajasthan', 'Travel Guide', 'Tourism', 'India', 'Palace', 'Desert'],
      featured: true,
      trending: true,
      rating: 4.8
    },
    {
      id: 2,
      title: 'Top 10 Bus Safety Tips for Comfortable Long-Distance Travel',
      content: `Traveling by bus for long distances can be comfortable and safe if you follow the right precautions. Here are our comprehensive safety tips:

      **Before Boarding:**
      1. **Choose Reputable Operators**: Always book with well-known, licensed bus operators with good safety records
      2. **Check Bus Condition**: Look for well-maintained vehicles with proper safety equipment and clean interiors
      3. **Verify Documents**: Ensure the driver has valid licenses, permits, and the bus has proper insurance
      4. **Seat Selection**: Choose seats near emergency exits but away from the engine for comfort
      
      **During Travel:**
      5. **Seatbelt Safety**: Always wear your seatbelt when available and keep it fastened during travel
      6. **Emergency Exits**: Locate emergency exits, fire extinguishers, and first aid kits upon boarding
      7. **Stay Hydrated**: Carry sufficient water but avoid excessive liquids before long stretches without stops
      8. **Secure Belongings**: Keep valuables in front pockets or secure bags, never leave items unattended
      
      **Comfort Tips:**
      9. **Proper Seating**: Adjust your seat for good lumbar support and legroom
      10. **Pack Smart**: Keep essentials like medications, snacks, and entertainment in easy reach
      11. **Rest Stops**: Use scheduled breaks to stretch, walk around, and refresh yourself
      12. **Communication**: Keep family informed about your journey status and expected arrival times
      
      **Health & Wellness:**
      - Carry basic medications for motion sickness, headaches, and stomach issues
      - Wear comfortable, breathable clothing
      - Use neck pillows and eye masks for better rest
      - Avoid heavy meals before travel
      
      **Emergency Preparedness:**
      - Keep emergency contacts easily accessible
      - Carry basic first aid supplies
      - Know how to contact local authorities and emergency services
      - Have backup transportation plans
      
      Your safety is our top priority. Our buses undergo regular maintenance checks, and our drivers receive professional safety training to ensure your secure and comfortable journey.`,
      author: 'Rajesh Kumar',
      date: '2024-01-12',
      category: 'bus-safety',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop',
      readTime: '6 min read',
      views: 890,
      likes: 67,
      tags: ['Safety', 'Bus Travel', 'Tips', 'Long Distance', 'Comfort'],
      featured: false,
      trending: true,
      rating: 4.6
    },
    {
      id: 3,
      title: 'Incredible India: Hidden Gems You Must Visit This Year',
      content: `India is full of hidden treasures waiting to be discovered. While popular destinations have their charm, these hidden gems offer unique experiences away from the crowds:

      **Unexplored Hill Stations:**
      - **Tirthan Valley, Himachal Pradesh**: Perfect for nature lovers, trekkers, and those seeking peace in the Himalayas
      - **Chopta, Uttarakhand**: Known as the "Mini Switzerland of India" with stunning meadows and rhododendron forests
      - **Ziro Valley, Arunachal Pradesh**: UNESCO World Heritage site with unique Apatani culture and stunning landscapes
      - **Dzukou Valley, Nagaland**: Famous for seasonal flowers and pristine natural beauty
      
      **Hidden Coastal Destinations:**
      - **Gokarna, Karnataka**: Peaceful beaches, ancient temples, and bohemian vibes away from Goa's crowds
      - **Varkala, Kerala**: Dramatic cliffs meeting the Arabian Sea with natural springs and Ayurvedic treatments
      - **Neil Island, Andaman**: Crystal clear waters, coral reefs, and untouched beaches perfect for diving
      - **Dhanushkodi, Tamil Nadu**: Ghost town with beautiful beaches and historical significance
      
      **Off-the-Beaten-Path Cultural Sites:**
      - **Hampi, Karnataka**: Ancient Vijayanagara ruins set among surreal boulder landscapes
      - **Khajuraho, Madhya Pradesh**: Exquisite temple architecture with intricate carvings and sculptures
      - **Mandu, Madhya Pradesh**: Abandoned city with beautiful Indo-Islamic architecture
      - **Orchha, Madhya Pradesh**: Medieval town with palaces, temples, and cenotaphs
      
      **Unique Natural Wonders:**
      - **Valley of Flowers, Uttarakhand**: UNESCO site with rare alpine flowers and stunning mountain views
      - **Living Root Bridges, Meghalaya**: Natural bridges grown from rubber tree roots by local tribes
      - **Magnetic Hill, Ladakh**: Mysterious hill where vehicles appear to roll uphill against gravity
      - **Loktak Lake, Manipur**: Floating islands and unique ecosystem with endangered deer species
      
      **Planning Your Hidden Gem Adventure:**
      - Research local customs, weather patterns, and seasonal accessibility
      - Book accommodations well in advance as options may be limited
      - Choose reliable transportation and consider hiring local guides
      - Pack according to the destination climate and terrain
      - Respect local communities and environmental conservation efforts
      - Learn basic local phrases to enhance your experience
      
      **Getting There:**
      Our extensive bus network connects you to these amazing destinations with comfortable rides and experienced drivers who know the routes well. Many of these places are accessible via our partner networks, ensuring you reach even the most remote locations safely.
      
      Book your tickets today and start your adventure to discover India's best-kept secrets!`,
      author: 'Anjali Verma',
      date: '2024-01-10',
      category: 'destinations',
      image: 'https://media.istockphoto.com/id/1135820309/photo/amber-fort-and-maota-lake-jaipur-rajasthan-india.jpg?s=612x612&w=0&k=20&c=raUKDB1Mris9Z7SjvuuTieZRzF2-CaKukGvTC8t1kuo=',
      readTime: '7 min read',
      views: 1100,
      likes: 78,
      tags: ['Hidden Gems', 'Travel', 'India', 'Adventure', 'Nature', 'Culture'],
      featured: true,
      trending: false,
      rating: 4.7
    },
    {
      id: 4,
      title: 'Budget Travel Hacks: How to Save Money on Your Next Trip',
      excerpt: 'Smart strategies to travel more while spending less. Learn insider tips for affordable accommodation, transport, food, and experiences that will stretch your travel budget...',
      content: `Traveling doesn't have to break the bank. With smart planning and these proven budget hacks, you can explore amazing places without overspending:

      **Transportation Savings:**
      - Book bus tickets during off-peak hours and mid-week for significantly better rates
      - Use advance booking discounts and early bird offers (save up to 40%)
      - Consider overnight journeys to save on accommodation costs
      - Group bookings often come with substantial discounts for 4+ passengers
      - Look for combo deals that include multiple destinations
      - Use student, senior citizen, or military discounts when applicable
      
      **Smart Accommodation Tips:**
      - Stay in budget hotels, hostels, or guesthouses with good reviews
      - Consider homestays for authentic local experiences at lower costs
      - Book accommodations with kitchen facilities to prepare your own meals
      - Use loyalty programs and booking apps for exclusive deals and cashbacks
      - Stay slightly outside city centers for lower rates with good transport links
      - Consider dormitory accommodations for solo travelers
      
      **Food & Dining Strategies:**
      - Eat at local restaurants and street food stalls instead of tourist-oriented places
      - Try street food from clean, busy stalls with high turnover (fresher food)
      - Pack snacks and meals for long bus journeys to avoid expensive highway stops
      - Drink filtered or bottled water and avoid expensive beverages
      - Look for lunch specials and thali meals for better value
      - Shop at local markets for fresh fruits and local specialties
      
      **Activity and Sightseeing Savings:**
      - Research free attractions, parks, temples, and cultural sites
      - Buy combo tickets for multiple attractions in the same city
      - Visit during free or discounted hours (many museums have free days)
      - Take self-guided walking tours instead of expensive guided tours
      - Use city tourism cards for discounts on multiple attractions
      - Attend free cultural events, festivals, and local celebrations
      
      **Money Management Tips:**
      - Set a realistic daily budget and track expenses with mobile apps
      - Use local public transportation instead of taxis or private vehicles
      - Bargain respectfully at markets and with auto-rickshaw drivers
      - Carry a mix of cash and cards for better exchange rates
      - Avoid tourist traps and overpriced souvenir shops
      - Use ATMs affiliated with your bank to minimize fees
      
      **Seasonal and Timing Strategies:**
      - Travel during shoulder seasons for lower prices and fewer crowds
      - Book accommodations and transport well in advance for better rates
      - Be flexible with dates to take advantage of last-minute deals
      - Avoid peak holiday periods and festival seasons
      
      **Technology and Apps:**
      - Use price comparison websites and apps for best deals
      - Download offline maps to avoid data roaming charges
      - Use translation apps to communicate with locals
      - Book through official websites to avoid booking fees
      
      Remember, the best travel experiences often come from genuine local interactions, simple pleasures, and immersive cultural experiences rather than expensive tourist attractions!`,
      author: 'Vikram Singh',
      date: '2024-01-08',
      category: 'travel-tips',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
      readTime: '5 min read',
      views: 2100,
      likes: 156,
      tags: ['Budget Travel', 'Money Saving', 'Tips', 'Backpacking', 'Planning'],
      featured: false,
      trending: true,
      rating: 4.9
    },
    {
      id: 5,
      title: 'Special Festive Season Offers: Up to 40% Off on All Routes',
      excerpt: 'Celebrate this festive season with our biggest discount offers. Book now and save big on your travel plans with family and friends during this special celebration period...',
      content: `This festive season, we're bringing you incredible savings on all your travel plans! Whether you're visiting family, going on vacation, or planning a spiritual journey, our special offers make travel more affordable than ever.

      **Current Mega Offers:**
      
      **Festive Bonanza - Up to 40% Off**
      - Valid on all AC and Non-AC buses across our entire network
      - Applicable on bookings made before month-end
      - Minimum 2 passengers required for discount activation
      - Additional 5% off for online bookings and mobile app users
      
      **Family Pack Super Deal**
      - Book for 4+ family members and get automatic 25% off
      - Complimentary snacks, water bottles, and travel pillows included
      - Priority boarding for families with children and senior citizens
      - Free rescheduling options up to 24 hours before departure
      
      **Group Booking Mega Special**
      - Groups of 10+ passengers get incredible 30% discount
      - Free rescheduling and flexible cancellation policies
      - Dedicated customer support executive assigned to your group
      - Complimentary group travel insurance coverage
      
      **Early Bird Super Saver**
      - Book 15 days in advance for additional 10% off on top of other offers
      - Flexible cancellation policies with minimal charges
      - Free seat selection and preferred boarding
      - Complimentary meal vouchers for journeys over 8 hours
      
      **Student & Senior Citizen Special**
      - Extra 15% discount for students (with valid ID) and senior citizens (60+)
      - Valid throughout the year, not just during festive season
      - Stackable with other ongoing offers for maximum savings
      
      **Popular Festive Routes with Special Pricing:**
      - Delhi to Haridwar/Rishikesh - Starting from ₹599
      - Mumbai to Pune/Shirdi - Starting from ₹299  
      - Bangalore to Chennai/Tirupati - Starting from ₹799
      - Jaipur to Pushkar/Ajmer - Starting from ₹199
      - Kolkata to Puri/Bhubaneswar - Starting from ₹899
      - Ahmedabad to Dwarka/Somnath - Starting from ₹699
      
      **How to Book and Save:**
      1. Visit our website or download our mobile app for exclusive app-only deals
      2. Select your route and preferred travel date/time
      3. Apply the appropriate promo code at checkout (codes sent via SMS/email)
      4. Complete secure payment using multiple payment options
      5. Receive instant confirmation with e-tickets and travel details
      
      **Additional Benefits:**
      - 24/7 customer support during your journey
      - Real-time bus tracking and updates
      - Clean, sanitized buses with safety protocols
      - Professional, trained drivers with safety certifications
      - Onboard entertainment and WiFi on select routes
      - Emergency assistance and travel insurance options
      
      **Payment Options:**
      - All major credit and debit cards accepted
      - UPI payments (Google Pay, PhonePe, Paytm)
      - Net banking from all major banks
      - EMI options available for bookings over ₹2000
      - Digital wallets and buy-now-pay-later options
      
      **Terms & Conditions:**
      - Offers cannot be combined with other promotional campaigns
      - Subject to seat availability and route-specific terms
      - Valid for limited time only (check website for exact dates)
      - Cancellation and refund policies apply as per standard terms
      - Photo ID required during travel for verification
      
      Don't miss out on these amazing deals! Book now and make your festive travel memorable, comfortable, and incredibly affordable. Limited seats available at these special prices!`,
      author: 'Marketing Team',
      date: '2024-01-05',
      category: 'offers',
      image: 'https://media.istockphoto.com/id/1822247032/photo/aerial-view-of-serpentine-road-in-swiss-alps-in-autumn.jpg?s=612x612&w=0&k=20&c=NCL-I5tlWaQ1HDnTGxIHgtvxDvbXlEgS_YUfC0-TxFc=',
      readTime: '4 min read',
      views: 3200,
      likes: 245,
      tags: ['Offers', 'Discounts', 'Festive', 'Booking', 'Family', 'Travel'],
      featured: true,
      trending: true,
      rating: 4.5
    },
    {
      id: 6,
      title: 'Complete Guide to Backpacking in South India',
      excerpt: 'From Kerala\'s backwaters to Tamil Nadu\'s temples, discover the perfect backpacking route through South India with comprehensive budget tips and must-visit places...',
      content: `South India offers an incredible backpacking experience with its diverse landscapes, rich cultural heritage, delicious cuisine, and warm hospitality. Here's your comprehensive guide to exploring this amazing region:

      **Perfect 3-Week Backpacking Route:**
      
      **Week 1: Kerala - God's Own Country**
      - **Kochi (2 days)**: Start your journey in Fort Kochi, explore Chinese fishing nets, colonial architecture, spice markets, and local art galleries
      - **Munnar (3 days)**: Tea plantations, trekking trails, Eravikulam National Park, and cool mountain weather
      - **Alleppey (2 days)**: Backwater houseboats, canoe rides through villages, traditional Kerala cuisine, and serene lake experiences
      
      **Week 2: Karnataka - Land of Palaces**
      - **Hampi (3 days)**: Ancient Vijayanagara ruins, boulder climbing, sunrise at Hemakuta Hill, and cycling through historical sites
      - **Gokarna (2 days)**: Beach hopping, Om Beach, Kudle Beach, beach cafes, and sunset views
      - **Coorg (2 days)**: Coffee plantations, Abbey Falls, Raja's Seat viewpoint, and adventure activities
      
      **Week 3: Tamil Nadu - Temple Trail**
      - **Mahabalipuram (2 days)**: Shore temples, stone carvings, Five Rathas, and beach relaxation
      - **Pondicherry (2 days)**: French colonial architecture, Auroville, beachside cafes, and spiritual experiences
      - **Madurai (2 days)**: Meenakshi Temple, local culture, street food tours, and traditional crafts
      - **Kodaikanal (1 day)**: Hill station retreat, lake activities, and cool climate
      
      **Detailed Budget Breakdown (per day):**
      - **Accommodation**: ₹500-800 (hostels, budget hotels, homestays)
      - **Food & Beverages**: ₹300-500 (local restaurants, street food, cafes)
      - **Local Transportation**: ₹200-400 (buses, auto-rickshaws, local trains)
      - **Activities & Entry Fees**: ₹200-500 (museums, parks, tours, adventure activities)
      - **Miscellaneous**: ₹100-200 (shopping, tips, emergency expenses)
      - **Total Daily Budget**: ₹1,300-2,400 per day
      
      **Essential Backpacking Kit:**
      - **Backpack**: Lightweight 40-50L with good back support and multiple compartments
      - **Clothing**: Quick-dry clothes, comfortable walking shoes, flip-flops, rain jacket
      - **Electronics**: Power bank, universal adapter, camera, headphones, torch
      - **Health Kit**: First aid supplies, medications, water purification tablets, sunscreen
      - **Documents**: Passport/ID copies, travel insurance, emergency contacts, itinerary
      - **Comfort Items**: Travel pillow, eye mask, earplugs, universal sink plug
      
      **Cultural Etiquette & Local Customs:**
      - Dress modestly, especially when visiting temples and religious sites
      - Remove shoes before entering temples, homes, and certain restaurants
      - Use your right hand for eating, greeting, and giving/receiving items
      - Learn basic local phrases in Malayalam, Kannada, and Tamil
      - Respect photography restrictions at religious and heritage sites
      - Be mindful of local customs and traditions during festivals
      
      **Safety Tips for Solo & Group Travelers:**
      - Keep digital and physical copies of important documents
      - Inform family/friends about your detailed itinerary and check-in regularly
      - Use reputable accommodation booking platforms with verified reviews
      - Trust your instincts about people and situations
      - Keep emergency contacts for local police, tourist helpline, and embassy
      - Carry adequate cash as ATMs may not be available in remote areas
      
      **Best Time to Visit South India:**
      - **October to March**: Pleasant weather across the region, perfect for sightseeing
      - **April to June**: Hot but good for hill stations like Munnar and Kodaikanal
      - **July to September**: Monsoon season with beautiful landscapes but heavy rains
      - **Festival Seasons**: Experience local culture during Onam, Diwali, and regional festivals
      
      **Transportation Tips & Hacks:**
      - Book interstate bus tickets online for better deals and seat selection
      - Use state transport buses for budget-friendly travel between cities
      - Consider overnight buses to save on accommodation costs
      - Keep digital and physical copies of all tickets
      - Download offline maps and transportation apps
      - Learn basic phrases to communicate with drivers and conductors
      
      **Food & Culinary Experiences:**
      - Try regional specialties: Kerala's appam and stew, Karnataka's dosa varieties, Tamil Nadu's Chettinad cuisine
      - Eat at local restaurants and street food stalls for authentic flavors
      - Always drink bottled or filtered water
      - Carry digestive medications for spicy food
      - Don't miss filter coffee, fresh coconut water, and regional sweets
      
      **Must-Have Experiences:**
      - Sunrise at Hampi's boulder landscapes
      - Backwater sunset cruise in Alleppey
      - Temple architecture tour in Madurai
      - Coffee plantation walk in Coorg
      - Beach hopping in Gokarna
      - French heritage walk in Pondicherry
      
      South India's warmth extends far beyond its tropical climate to its incredibly hospitable people. Embrace the local culture, try regional cuisines, learn a few local words, and create unforgettable memories on your backpacking adventure through this diverse and beautiful region!`,
      author: 'Arjun Patel',
      date: '2024-01-03',
      category: 'guides',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&h=600&fit=crop',
      readTime: '12 min read',
      views: 1800,
      likes: 134,
      tags: ['Backpacking', 'South India', 'Budget Travel', 'Guide', 'Culture', 'Adventure'],
      featured: false,
      trending: false,
      rating: 4.8
    },
    {
      id: 7,
      title: 'Mumbai to Goa: Best Bus Routes and Travel Tips',
      excerpt: 'Comprehensive guide to traveling from Mumbai to Goa by bus. Compare routes, timings, prices, and get insider tips for a comfortable journey to India\'s favorite beach destination...',
      content: `The Mumbai to Goa route is one of India's most popular bus journeys, offering scenic coastal views and convenient travel options. Here's everything you need to know for a perfect trip:

      **Route Options & Duration:**
      - **Direct Route**: Mumbai to Panaji (12-14 hours)
      - **Via Pune**: Mumbai-Pune-Goa (14-16 hours) 
      - **Coastal Route**: Via Ratnagiri (15-17 hours with scenic views)
      
      **Best Bus Operators:**
      - Luxury AC sleeper buses with reclining seats
      - Semi-luxury AC buses with comfortable seating
      - State transport buses for budget travelers
      - Private operators with entertainment and WiFi
      
      **Booking Tips:**
      - Book 7-15 days in advance for better prices
      - Choose sleeper buses for overnight comfort
      - Window seats on the right side offer better coastal views
      - Avoid booking during peak season without advance planning
      
      **What to Pack:**
      - Light cotton clothes and swimwear
      - Sunscreen and sunglasses
      - Comfortable walking shoes and flip-flops
      - Light jacket for AC bus travel
      - Entertainment devices with downloaded content
      
      **Journey Highlights:**
      - Stunning coastal scenery along the Konkan coast
      - Clean rest stops with good food options
      - Professional drivers familiar with the route
      - Safe and secure travel with 24/7 support
      
      Make your Mumbai to Goa journey memorable with our comfortable bus services!`,
      author: 'Rahul Desai',
      date: '2024-01-01',
      category: 'travel-tips',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
      readTime: '5 min read',
      views: 1950,
      likes: 178,
      tags: ['Mumbai', 'Goa', 'Bus Route', 'Coastal', ],
      featured: false,
      trending: false,
      rating: 4.6
    },
    {
      id: 8,
      title: 'Digital Nomad Guide: Working While Traveling in India',
      excerpt: 'Complete guide for digital nomads exploring India. Find the best co-working spaces, internet connectivity, accommodation options, and travel-friendly destinations...',
      content: `India is becoming a hotspot for digital nomads with its affordable living costs, diverse cultures, and improving infrastructure. Here's your complete guide:

      **Best Digital Nomad Destinations:**
      - **Goa**: Beach vibes, co-working spaces, expat community
      - **Bangalore**: Tech hub, excellent internet, modern amenities
      - **Rishikesh**: Spiritual atmosphere, yoga, mountain views
      - **Hampi**: Historical sites, laid-back vibe, budget-friendly
      - **Dharamshala**: Mountain retreat, Tibetan culture, peaceful environment
      
      **Essential Requirements:**
      - Reliable internet connection (4G/5G coverage)
      - Comfortable workspace setup
      - Power backup solutions
      - Time zone considerations for client calls
      - Banking and payment solutions
      
      **Co-working Spaces:**
      - Major cities have numerous co-working options
      - Day passes available for short stays
      - High-speed internet and professional environment
      - Networking opportunities with other nomads
      - Meeting rooms and printing facilities
      
      **Accommodation Tips:**
      - Choose places with dedicated work areas
      - Ensure stable WiFi and power supply
      - Consider monthly rentals for longer stays
      - Homestays offer cultural immersion
      - Hotels with business centers for short trips
      
      **Connectivity Solutions:**
      - Multiple SIM cards for backup internet
      - Portable WiFi devices for remote areas
      - International roaming plans
      - Local internet cafes as backup
      - Power banks and portable chargers
      
      **Legal Considerations:**
      - Tourist visa limitations on work
      - Tax implications for extended stays
      - Business visa requirements for longer periods
      - Local registration requirements
      - Health insurance coverage
      
      **Cost Breakdown:**
      - Accommodation: ₹15,000-50,000/month
      - Food: ₹8,000-15,000/month
      - Transportation: ₹3,000-8,000/month
      - Co-working: ₹3,000-10,000/month
      - Total: ₹30,000-85,000/month
      
      India offers an incredible opportunity to combine work with travel, experiencing diverse cultures while maintaining your professional commitments!`,
      author: 'Sarah Johnson',
      date: '2023-12-28',
      category: 'travel-tips',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop',
      readTime: '9 min read',
      views: 1420,
      likes: 95,
      tags: ['Digital Nomad', 'Remote Work', 'Co-working', 'Technology', 'Lifestyle'],
      featured: false,
      trending: true,
      rating: 4.4
    }
  ];

  const postsPerPage = 6;

  useEffect(() => {
    setFeaturedPosts(blogPosts.filter(post => post.featured));
    setTrendingPosts(blogPosts.filter(post => post.trending).slice(0, 5));
  }, []);

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'latest':
        return new Date(b.date) - new Date(a.date);
      case 'popular':
        return b.views - a.views;
      case 'most-liked':
        return b.likes - a.likes;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);
  const currentPosts = sortedPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handleLike = (postId) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
  };

  const handleBookmark = (postId) => {
    const newBookmarkedPosts = new Set(bookmarkedPosts);
    if (newBookmarkedPosts.has(postId)) {
      newBookmarkedPosts.delete(postId);
    } else {
      newBookmarkedPosts.add(postId);
    }
    setBookmarkedPosts(newBookmarkedPosts);
  };

  const handleShare = (post) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const openModal = (post) => {
    setSelectedPost(post);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPost(null);
    document.body.style.overflow = 'unset';
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      alert('Thank you for subscribing to our newsletter!');
      setNewsletterEmail('');
      setShowNewsletter(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarSolid key={i} className="h-4 w-4 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarIcon key="half" className="h-4 w-4 text-yellow-400" />);
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    
    return stars;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
          <Navbar/>
      {/* Enhanced Header Section */}
      <div className="relative bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Enhanced Title */}
            <div className="flex items-center justify-center mb-6">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white to-red-100 bg-clip-text text-transparent">
                EasyTrip Blog
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Discover amazing destinations, expert travel tips, and exclusive offers for your next adventure
            </p>
            
            {/* Enhanced Search Bar */}
            <div className="max-w-3xl mx-auto relative">
              <div className={`relative transition-all duration-500 ${isSearchFocused ? 'transform scale-105 shadow-2xl' : 'shadow-xl'}`}>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search destinations, travel tips, guides, safety info..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="w-full px-8 py-5 pl-14 pr-20 text-gray-900 bg-white/95 backdrop-blur-sm rounded-2xl border-0 shadow-lg focus:outline-none focus:ring-4 focus:ring-red-300/50 transition-all duration-300 text-lg"
                  />
                  <MagnifyingGlassIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-red-500" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-5 top-1/2 transform -translate-y-1/2 p-2 hover:bg-red-50 rounded-full transition-colors group"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
                    </button>
                  )}
                </div>
                
                {/* Search Suggestions */}
                {isSearchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-10">
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-3">Popular Searches:</p>
                      <div className="flex flex-wrap gap-2">
                        {['Rajasthan', 'Bus Safety', 'Budget Travel', 'Goa', 'Hill Stations'].map((term) => (
                          <button
                            key={term}
                            onClick={() => setSearchTerm(term)}
                            className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm hover:bg-red-100 transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex justify-center items-center space-x-8 mt-12 text-white/80">
              <div className="text-center">
                <div className="text-2xl font-bold">{blogPosts.length}</div>
                <div className="text-sm">Travel Articles</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold">50+</div>
                <div className="text-sm">Destinations</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold">1M+</div>
                <div className="text-sm">Happy Travelers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Featured Posts Section */}
        {featuredPosts.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl mr-4">
                  <FireSolid className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-gray-900">Featured Posts</h2>
                  <p className="text-gray-600 mt-1">Hand-picked articles for your next adventure</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <div className="px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-medium">
                  {featuredPosts.length} Featured
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => (
                <div key={post.id} className="group cursor-pointer" onClick={() => openModal(post)}>
                  <div className="relative overflow-hidden rounded-2xl shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-3 bg-white">
                    <div className="relative">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg">
                          <StarSolid className="h-3 w-3 mr-1" />
                          FEATURED
                        </span>
                      </div>

                      {/* Rating */}
                      {post.rating && (
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                          <div className="flex items-center space-x-1">
                            <StarSolid className="h-3 w-3 text-yellow-400" />
                            <span className="text-xs font-semibold text-gray-900">{post.rating}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Content Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-red-200 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm opacity-90 line-clamp-2 mb-4">{post.excerpt}</p>
                        
                        {/* Meta Info */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <UserIcon className="h-3 w-3 mr-1" />
                              {post.author}
                            </span>
                            <span className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {post.readTime}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center">
                              <EyeIcon className="h-3 w-3 mr-1" />
                              {post.views}
                            </span>
                            <span className="flex items-center">
                              <HeartIcon className="h-3 w-3 mr-1" />
                              {post.likes}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Content Layout */}
        <div className="flex flex-col xl:flex-row gap-12">
          {/* Enhanced Sidebar */}
          <div className="xl:w-1/3">
            {/* Categories Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mr-3">
                  <TagIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Categories</h3>
              </div>
              
              <div className="space-y-3">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  const postCount = category.id === 'all' ? blogPosts.length : blogPosts.filter(post => post.category === category.id).length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setCurrentPage(1);
                      }}
                      className={`w-full group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${
                        selectedCategory === category.id
                          ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg transform scale-[1.02]`
                          : 'bg-gray-50 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 text-gray-700 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-3 transition-colors ${
                            selectedCategory === category.id ? 'bg-white/20' : 'bg-white shadow-sm'
                          }`}>
                            <IconComponent className={`h-5 w-5 ${
                              selectedCategory === category.id ? 'text-white' : 'text-gray-600'
                            }`} />
                          </div>
                          <span className="font-semibold">{category.name}</span>
                        </div>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                          selectedCategory === category.id 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white shadow-sm text-gray-600'
                        }`}>
                          {postCount}
                        </span>
                      </div>
                      
                      {/* Animated background for hover effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-600/0 group-hover:from-red-500/5 group-hover:to-red-600/5 transition-all duration-300"></div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Trending Posts */}
            {trendingPosts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
                <div className="flex items-center mb-8">
                  <div className="p-2.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mr-3">
                    <FireIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Trending Now</h3>
                </div>
                
                <div className="space-y-4">
                  {trendingPosts.map((post, index) => (
                    <div
                      key={post.id}
                      onClick={() => openModal(post)}
                      className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 cursor-pointer transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                            index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                            'bg-gradient-to-r from-red-500 to-red-600'
                          }`}>
                            {index + 1}
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1">
                              <FireSolid className="h-4 w-4 text-orange-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                          {post.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <EyeIcon className="h-3 w-3 mr-1" />
                              {post.views.toLocaleString()}
                            </span>
                            <span className="flex items-center">
                              <HeartIcon className="h-3 w-3 mr-1" />
                              {post.likes}
                            </span>
                          </div>
                          {post.rating && (
                            <div className="flex items-center">
                              <StarSolid className="h-3 w-3 text-yellow-400 mr-1" />
                              <span className="font-semibold">{post.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Newsletter Signup */}
            {showNewsletter && (
              <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white mb-8 overflow-hidden shadow-xl">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v-40c11.046 0 20 8.954 20 20zM0 0v40c11.046 0 20-8.954 20-20S11.046 0 0 0z'/%3E%3C/g%3E%3C/svg%3E")`
                  }}></div>
                </div>
                
                <div className="relative z-10">
                  <button
                    onClick={() => setShowNewsletter(false)}
                    className="absolute -top-2 -right-2 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                  
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-white/20 rounded-lg mr-3">
                      <BellIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">Stay Updated!</h3>
                  </div>
                  
                  <p className="text-white/90 mb-6 leading-relaxed">
                    Get the latest travel tips, destination guides, and exclusive offers delivered straight to your inbox.
                  </p>
                  
                  <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 text-gray-900 bg-white rounded-xl border-0 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-white text-red-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors transform hover:scale-[1.02] shadow-lg"
                    >
                      Subscribe Now
                    </button>
                  </form>
                  
                  <p className="text-xs text-white/70 mt-4 text-center">
                    No spam, unsubscribe anytime. We respect your privacy.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
                Blog Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Articles</span>
                  <span className="font-bold text-blue-600">{blogPosts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Featured Posts</span>
                  <span className="font-bold text-red-600">{featuredPosts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Categories</span>
                  <span className="font-bold text-green-600">{categories.length - 1}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-bold text-purple-600">
                    {blogPosts.reduce((sum, post) => sum + post.views, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="xl:w-2/3">
            {/* Enhanced Sort & View Options */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                    >
                      <option value="latest">Latest Posts</option>
                      <option value="popular">Most Popular</option>
                      <option value="most-liked">Most Liked</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === 'grid' 
                          ? 'bg-red-600 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      <Squares2X2Icon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === 'list' 
                          ? 'bg-red-600 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      <Bars3Icon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>
                    Showing {((currentPage - 1) * postsPerPage) + 1} - {Math.min(currentPage * postsPerPage, sortedPosts.length)} of {sortedPosts.length} posts
                  </span>
                  {searchTerm && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Search: "{searchTerm}"
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Blog Posts Grid/List */}
            {currentPosts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="p-4 bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <NewspaperIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No posts found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We couldn't find any posts matching your search criteria. 
                  Try adjusting your search terms or browse our categories.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                  View All Posts
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-8' : 'space-y-8'}>
                  {currentPosts.map((post) => (
                    <article
                      key={post.id}
                      className={`group cursor-pointer transition-all duration-500 hover:shadow-2xl ${
                        viewMode === 'list' ? 'flex space-x-6 bg-white rounded-2xl p-6 shadow-lg border border-gray-100' : ''
                      }`}
                      onClick={() => openModal(post)}
                    >
                      <div className={`relative overflow-hidden ${
                        viewMode === 'list' ? 'w-1/3 flex-shrink-0 rounded-xl' : 'rounded-2xl shadow-lg bg-white border border-gray-100'
                      }`}>
                        <div className="relative">
                          <img
                            src={post.image}
                            alt={post.title}
                            className={`object-cover transition-transform duration-700 group-hover:scale-110 ${
                              viewMode === 'list' ? 'w-full h-48' : 'w-full h-64'
                            }`}
                          />
                          
                          {/* Image Overlay Badges */}
                          <div className="absolute top-4 left-4 flex flex-col space-y-2">
                            {post.featured && (
                              <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg">
                                <StarSolid className="h-3 w-3 mr-1" />
                                Featured
                              </span>
                            )}
                            {post.trending && (
                              <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                                <FireSolid className="h-3 w-3 mr-1" />
                                Trending
                              </span>
                            )}
                          </div>

                          {/* Rating Badge */}
                          {post.rating && (
                            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
                              <div className="flex items-center space-x-1">
                                <StarSolid className="h-4 w-4 text-yellow-400" />
                                <span className="text-sm font-bold text-gray-900">{post.rating}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {viewMode === 'grid' && (
                          <div className="p-6">
                            {/* Category & Date */}
                            <div className="flex items-center justify-between mb-4">
                              <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                                {categories.find(cat => cat.id === post.category)?.name}
                              </span>
                              <time className="text-sm text-gray-500 flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {formatDate(post.date)}
                              </time>
                            </div>
                            
                            {/* Title & Excerpt */}
                            <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors line-clamp-2">
                              {post.title}
                            </h2>
                            <p className="text-gray-600 mb-4 line-clamp-3">
                              {post.excerpt}
                            </p>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-red-50 hover:text-red-600 transition-colors">
                                  #{tag}
                                </span>
                              ))}
                              {post.tags.length > 2 && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-500 text-xs rounded-full">
                                  +{post.tags.length - 3} more
                                </span>
                              )}
                            </div>
                            
                            {/* Meta Info & Actions */}
                           <div className="flex items-center justify-between pt-4 border-t border-gray-100 group">
  {/* Left Side - Post Meta Info */}
  <div className="flex items-center space-x-3 text-sm text-gray-500 min-w-0 flex-1 mr-4 overflow-x-auto scrollbar-hide">
    <span className="flex items-center whitespace-nowrap flex-shrink-0">
      <UserIcon className="h-4 w-4 mr-1" />
      <span className="max-w-[80px] truncate">{post.author}</span>
    </span>
    <span className="text-gray-300">•</span>
    <span className="flex items-center whitespace-nowrap flex-shrink-0">
      <ClockIcon className="h-4 w-4 mr-1" />
      <span>{post.readTime}</span>
    </span>
    <span className="text-gray-300">•</span>
    <span className="flex items-center whitespace-nowrap flex-shrink-0">
      <EyeIcon className="h-4 w-4 mr-1" />
      <span>{post.views.toLocaleString()}</span>
    </span>
  </div>
  
  {/* Right Side - Scrollable Action Buttons */}
  <div className="relative">
    {/* Custom Scrollable Container */}
    <div 
      className="flex items-center space-x-1 overflow-x-auto scrollbar-hide max-w-[180px] sm:max-w-[240px] md:max-w-none pb-2 pt-2 px-1"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitScrollbar: { display: 'none' }
      }}
    >
      {/* Like Button */}
      <div className="flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike(post.id);
          }}
          className="flex items-center space-x-1.5 text-gray-500 hover:text-red-600 transition-all duration-200 px-3 py-2 rounded-lg hover:bg-red-50 group/btn"
        >
          {likedPosts.has(post.id) ? (
            <HeartSolid className="h-4 w-4 text-red-600" />
          ) : (
            <HeartIcon className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
          )}
          <span className="text-xs font-medium whitespace-nowrap">
            {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
          </span>
        </button>
      </div>
      
      {/* Bookmark Button */}
      <div className="flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleBookmark(post.id);
          }}
          className="text-gray-500 hover:text-blue-600 transition-all duration-200 p-2 rounded-lg hover:bg-blue-50 group/btn"
          title="Bookmark this post"
        >
          {bookmarkedPosts.has(post.id) ? (
            <BookmarkSolid className="h-4 w-4 text-blue-600" />
          ) : (
            <BookmarkIcon className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
          )}
        </button>
      </div>
      
      {/* Share Button */}
      <div className="flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShare(post);
          }}
          className="text-gray-500 hover:text-green-600 transition-all duration-200 p-2 rounded-lg hover:bg-green-50 group/btn"
          title="Share this post"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
        </button>
      </div>
      
      {/* Comment Button */}
      <div className="flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Handle comment action
          }}
          className="text-gray-500 hover:text-purple-600 transition-all duration-200 p-2 rounded-lg hover:bg-purple-50 group/btn"
          title="Comment on this post"
        >
          <ChatBubbleLeftIcon className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
        </button>
      </div>
      
      {/* More Options Button */}
      <div className="flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Handle more options
          }}
          className="text-gray-500 hover:text-gray-700 transition-all duration-200 p-2 rounded-lg hover:bg-gray-50 group/btn"
          title="More options"
        >
          <EllipsisHorizontalIcon className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
        </button>
      </div>
    </div>
    
    {/* Gradient Fade Indicators */}
    <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity sm:hidden"></div>
    
    {/* Mobile Scroll Hint */}
    <div className="absolute -bottom-1 right-0 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity sm:hidden">
      <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px]">Scroll →</span>
    </div>
  </div>
</div>

{/* Add this CSS to your global styles or styled-jsx */}
<style jsx>{`
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`}</style>

                          </div>
                        )}
                      </div>
                      
                      {viewMode === 'list' && (
                        <div className="flex-1 flex flex-col justify-between">
                          {/* Category & Date */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                              {categories.find(cat => cat.id === post.category)?.name}
                            </span>
                            <time className="text-sm text-gray-500 flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {formatDate(post.date)}
                            </time>
                          </div>
                          
                          {/* Title & Excerpt */}
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors line-clamp-2">
                              {post.title}
                            </h2>
                            <p className="text-gray-600 mb-4 line-clamp-3">
                              {post.excerpt}
                            </p>
                          </div>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 4).map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                          
                          {/* Meta Info & Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <UserIcon className="h-4 w-4 mr-1" />
                                {post.author}
                              </span>
                              <span className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {post.readTime}
                              </span>
                              <span className="flex items-center">
                                <EyeIcon className="h-4 w-4 mr-1" />
                                {post.views.toLocaleString()}
                              </span>
                              {post.rating && (
                                <span className="flex items-center">
                                  <StarSolid className="h-4 w-4 mr-1 text-yellow-400" />
                                  {post.rating}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(post.id);
                                }}
                                className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                              >
                                {likedPosts.has(post.id) ? (
                                  <HeartSolid className="h-5 w-5 text-red-600" />
                                ) : (
                                  <HeartIcon className="h-5 w-5" />
                                )}
                                <span className="text-sm">{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookmark(post.id);
                                }}
                                className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                              >
                                {bookmarkedPosts.has(post.id) ? (
                                  <BookmarkSolid className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <BookmarkIcon className="h-5 w-5" />
                                )}
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(post);
                                }}
                                className="text-gray-500 hover:text-green-600 transition-colors p-2 rounded-lg hover:bg-green-50"
                              >
                                <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-16">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-3 rounded-xl border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors flex items-center space-x-2"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 2 && page <= currentPage + 2)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                                currentPage === page
                                  ? 'bg-red-600 text-white shadow-lg transform scale-105'
                                  : 'border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 3 || page === currentPage + 3) {
                          return <span key={page} className="px-2 text-gray-400">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-3 rounded-xl border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors flex items-center space-x-2"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ArrowRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Blog Post Modal */}
      {showModal && selectedPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black/80 backdrop-blur-sm" onClick={closeModal}></div>
            
            <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl">
              {/* Modal Header */}
              <div className="relative p-8 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-8">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="inline-block px-4 py-2 bg-red-100 text-red-800 text-sm font-bold rounded-full">
                        {categories.find(cat => cat.id === selectedPost.category)?.name}
                      </span>
                      {selectedPost.featured && (
                        <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full">
                          <StarSolid className="h-3 w-3 mr-1" />
                          Featured
                        </span>
                      )}
                      {selectedPost.trending && (
                        <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full">
                          <FireSolid className="h-3 w-3 mr-1" />
                          Trending
                        </span>
                      )}
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                      {selectedPost.title}
                    </h1>
                    
                    <div className="flex items-center flex-wrap gap-6 text-sm text-gray-600">
                      <span className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-2" />
                        <span className="font-semibold">{selectedPost.author}</span>
                      </span>
                      <span className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {formatDate(selectedPost.date)}
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        {selectedPost.readTime}
                      </span>
                      <span className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-2" />
                        {selectedPost.views.toLocaleString()} views
                      </span>
                      {selectedPost.rating && (
                        <span className="flex items-center">
                          <div className="flex items-center mr-2">
                            {renderStarRating(selectedPost.rating)}
                          </div>
                          <span className="font-semibold">{selectedPost.rating}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={closeModal}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="max-h-96 overflow-y-auto">
                {/* Featured Image */}
                <div className="relative">
                  <img
                    src={selectedPost.image}
                    alt={selectedPost.title}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Article Content */}
                <div className="p-8">
                  <div className="prose prose-lg max-w-none mb-8">
                    {selectedPost.content.split('\n').map((paragraph, index) => {
                      if (paragraph.trim() === '') return null;
                      
                      if (paragraph.includes('**') && paragraph.includes(':**')) {
                        const parts = paragraph.split('**');
                        return (
                          <h3 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center">
                            <div className="w-1 h-8 bg-red-600 rounded mr-3"></div>
                            {parts[1]?.replace(':', '')}
                          </h3>
                        );
                      }
                      
                      if (paragraph.includes('**')) {
                        const parts = paragraph.split('**');
                        return (
                          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                            {parts.map((part, partIndex) =>
                              partIndex % 2 === 1 ? (
                                <strong key={partIndex} className="font-bold text-gray-900">{part}</strong>
                              ) : (
                                part
                              )
                            )}
                          </p>
                        );
                      }
                      
                      if (paragraph.trim().match(/^\d+\./)) {
                        return (
                          <div key={index} className="mb-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                            <p className="font-semibold text-gray-900">{paragraph}</p>
                          </div>
                        );
                      }
                      
                      if (paragraph.trim().startsWith('-')) {
                        return (
                          <ul key={index} className="mb-4 ml-6">
                            <li className="list-disc text-gray-700 mb-2 leading-relaxed">
                              {paragraph.replace(/^-\s*/, '')}
                            </li>
                          </ul>
                        );
                      }
                      
                      return (
                        <p key={index} className="mb-4 text-gray-700 leading-relaxed text-lg">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>

                  {/* Tags Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <TagIcon className="h-5 w-5 mr-2 text-red-600" />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedPost.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 text-sm font-semibold rounded-full border border-red-200 hover:shadow-md transition-all cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(selectedPost.id)}
                        className="flex items-center space-x-3 px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all group"
                      >
                        {likedPosts.has(selectedPost.id) ? (
                          <HeartSolid className="h-6 w-6 text-red-600" />
                        ) : (
                          <HeartIcon className="h-6 w-6 text-gray-600 group-hover:text-red-600" />
                        )}
                        <span className="font-semibold text-gray-700 group-hover:text-red-600">
                          Like ({selectedPost.likes + (likedPosts.has(selectedPost.id) ? 1 : 0)})
                        </span>
                      </button>

                      <button
                        onClick={() => handleBookmark(selectedPost.id)}
                        className="flex items-center space-x-3 px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                      >
                        {bookmarkedPosts.has(selectedPost.id) ? (
                          <BookmarkSolid className="h-6 w-6 text-blue-600" />
                        ) : (
                          <BookmarkIcon className="h-6 w-6 text-gray-600 group-hover:text-blue-600" />
                        )}
                        <span className="font-semibold text-gray-700 group-hover:text-blue-600">
                          Bookmark
                        </span>
                      </button>

                      <button
                        onClick={() => handleShare(selectedPost)}
                        className="flex items-center space-x-3 px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
                      >
                        <ArrowTopRightOnSquareIcon className="h-6 w-6 text-gray-600 group-hover:text-green-600" />
                        <span className="font-semibold text-gray-700 group-hover:text-green-600">
                          Share
                        </span>
                      </button>
                    </div>

                    {/* Rating Display */}
                    {selectedPost.rating && (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div className="flex items-center">
                          {renderStarRating(selectedPost.rating)}
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {selectedPost.rating} / 5.0
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Related Posts Section */}
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <BookOpenIcon className="h-6 w-6 mr-2 text-red-600" />
                      Related Articles
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {blogPosts
                        .filter(post => 
                          post.id !== selectedPost.id && 
                          (post.category === selectedPost.category || 
                           post.tags.some(tag => selectedPost.tags.includes(tag)))
                        )
                        .slice(0, 4)
                        .map((relatedPost) => (
                          <div
                            key={relatedPost.id}
                            onClick={() => {
                              setSelectedPost(relatedPost);
                            }}
                            className="group cursor-pointer p-4 rounded-xl border border-gray-200 hover:shadow-lg hover:border-red-300 transition-all"
                          >
                            <div className="flex space-x-3">
                              <img
                                src={relatedPost.image}
                                alt={relatedPost.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors mb-1">
                                  {relatedPost.title}
                                </h5>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span>{relatedPost.readTime}</span>
                                  <span>•</span>
                                  <span>{relatedPost.views} views</span>
                                  {relatedPost.rating && (
                                    <>
                                      <span>•</span>
                                      <div className="flex items-center">
                                        <StarSolid className="h-3 w-3 text-yellow-400 mr-1" />
                                        <span>{relatedPost.rating}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 left-8 p-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 hover:shadow-xl transition-all transform hover:scale-110 z-40"
      >
        <ChevronUpIcon className="h-6 w-6" />
      </button>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
            <span className="text-lg font-semibold text-gray-900">Loading amazing content...</span>
          </div>
        </div>
      )}

      {/* Footer CTA Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-16 mt-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-6">
            <TruckIcon className="h-12 w-12 mr-4" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready for Your Next Adventure?
            </h2>
            <GlobeAltIcon className="h-12 w-12 ml-4" />
          </div>
          <p className="text-xl mb-8 opacity-90">
            Book your bus tickets now and start exploring incredible destinations across India
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-red-600 font-bold rounded-xl hover:bg-gray-100 transition-colors transform hover:scale-105 shadow-lg flex items-center justify-center">
              <CurrencyRupeeIcon className="h-5 w-5 mr-2" />
              Book Bus Tickets
            </button>
            <button className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-red-600 transition-colors transform hover:scale-105 flex items-center justify-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Explore Routes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
