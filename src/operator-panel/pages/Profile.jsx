import React, { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, // 🔥 Added for creating document
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  IdentificationIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  CameraIcon,
  DocumentTextIcon,
  TruckIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  ClockIcon,
  StarIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const OperatorProfile = () => {
  const [currentOperator, setCurrentOperator] = useState(null);
  const [profileData, setProfileData] = useState({
    fullName: '',
    emailAddress: '',
    mobileNumber: '',
    businessName: '',
    companyName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    licenseNumber: '',
    bankAccountNumber: '',
    bankIFSC: '',
    bankName: '',
    emergencyContact: '',
    alternateEmail: '',
    website: '',
    description: '',
    experience: '',
    totalBuses: '',
    totalDrivers: '',
    operatingRoutes: '',
    establishedYear: ''
  });
  const [statistics, setStatistics] = useState({
    totalDrivers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeRoutes: 0,
    rating: 4.5,
    completedTrips: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [recentActivities, setRecentActivities] = useState([]);
  const [documentExists, setDocumentExists] = useState(false); // 🔥 Track document existence

  // 🔥 FIXED: Check authentication and get operator data
  const checkAuthAndFetchData = async () => {
    console.log('🚀 Starting checkAuthAndFetchData...');
    
    try {
      const operatorInfoStr = localStorage.getItem('operatorInfo');
      const operatorToken = localStorage.getItem('operatorToken');
      
      console.log('📱 Token:', operatorToken);
      console.log('📝 Operator Info:', operatorInfoStr);
      
      if (!operatorToken || !operatorInfoStr) {
        console.log('❌ No auth data found, redirecting to login');
        window.location.href = '/operator-login';
        return;
      }

      const operatorInfo = JSON.parse(operatorInfoStr);
      console.log('✅ Parsed operator info:', operatorInfo);
      setCurrentOperator(operatorInfo);
      
      const operatorId = operatorInfo.operatorId || operatorInfo.id;
      console.log('🆔 Using operator ID:', operatorId);
      
      // Set basic data from localStorage first
      setProfileData(prevData => ({
        ...prevData,
        fullName: operatorInfo.name || '',
        emailAddress: operatorInfo.email || '',
        mobileNumber: operatorInfo.mobile || '',
        businessName: operatorInfo.businessName || '',
        companyName: operatorInfo.companyName || ''
      }));
      
      // Then fetch complete profile data from Firestore
      await fetchCompleteProfile(operatorId);
      await fetchStatistics(operatorId);
      await loadRecentActivities();
      
    } catch (error) {
      console.error('❌ Error in checkAuthAndFetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED: Fetch complete profile with document existence check
  const fetchCompleteProfile = async (operatorId) => {
    console.log('📋 Fetching profile for ID:', operatorId);
    
    try {
      let operatorDoc = null;
      let foundMethod = 'none';
      
      // Method 1: Direct document lookup
      try {
        const operatorRef = doc(db, 'operators', operatorId);
        const operatorSnap = await getDoc(operatorRef);
        
        if (operatorSnap.exists()) {
          operatorDoc = { id: operatorSnap.id, ...operatorSnap.data() };
          foundMethod = 'direct';
          setDocumentExists(true);
          console.log('✅ Found operator by direct lookup:', operatorDoc);
        } else {
          setDocumentExists(false);
          console.log('⚠️ Document does not exist for ID:', operatorId);
        }
      } catch (directError) {
        console.log('⚠️ Direct lookup failed:', directError);
        setDocumentExists(false);
      }
      
      // Method 2: Query by operatorId field (if direct lookup failed)
      if (!operatorDoc) {
        try {
          const operatorsRef = collection(db, 'operators');
          const q = query(operatorsRef, where('operatorId', '==', operatorId));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            operatorDoc = { id: docSnap.id, ...docSnap.data() };
            foundMethod = 'operatorId';
            setDocumentExists(true);
            console.log('✅ Found operator by operatorId query:', operatorDoc);
          }
        } catch (queryError) {
          console.log('⚠️ OperatorId query failed:', queryError);
        }
      }
      
      // Method 3: Query by email (if previous methods failed)
      if (!operatorDoc && currentOperator?.email) {
        try {
          const operatorsRef = collection(db, 'operators');
          const q = query(operatorsRef, where('emailAddress', '==', currentOperator.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            operatorDoc = { id: docSnap.id, ...docSnap.data() };
            foundMethod = 'email';
            setDocumentExists(true);
            console.log('✅ Found operator by email query:', operatorDoc);
          }
        } catch (emailError) {
          console.log('⚠️ Email query failed:', emailError);
        }
      }
      
      if (operatorDoc) {
        const data = operatorDoc;
        console.log('📊 Setting profile data from Firestore:', data);
        console.log('🔍 Found using method:', foundMethod);
        
        setProfileData(prevData => ({
          ...prevData,
          fullName: data.fullName || data.name || prevData.fullName,
          emailAddress: data.emailAddress || data.email || prevData.emailAddress,
          mobileNumber: data.mobileNumber || data.phone || prevData.mobileNumber,
          businessName: data.businessName || data.companyName || prevData.businessName,
          companyName: data.companyName || data.businessName || prevData.companyName,
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          gstNumber: data.gstNumber || '',
          panNumber: data.panNumber || '',
          licenseNumber: data.licenseNumber || '',
          bankAccountNumber: data.bankAccountNumber || '',
          bankIFSC: data.bankIFSC || '',
          bankName: data.bankName || '',
          emergencyContact: data.emergencyContact || '',
          alternateEmail: data.alternateEmail || '',
          website: data.website || '',
          description: data.description || '',
          experience: data.experience || '',
          totalBuses: data.totalBuses || '',
          totalDrivers: data.totalDrivers || '',
          operatingRoutes: data.operatingRoutes || '',
          establishedYear: data.establishedYear || ''
        }));
      } else {
        console.log('⚠️ Operator document not found in Firestore, will create on save');
        setDocumentExists(false);
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      setDocumentExists(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async (operatorId) => {
    console.log('📈 Fetching statistics for operator:', operatorId);
    
    try {
      let driversCount = 0;
      let bookingsCount = 0;
      let totalRevenue = 0;
      
      // Fetch drivers count
      try {
        const driversQuery = query(
          collection(db, 'drivers'),
          where('operatorId', '==', operatorId)
        );
        const driversSnap = await getDocs(driversQuery);
        driversCount = driversSnap.size;
        console.log('👥 Drivers count:', driversCount);
      } catch (driversError) {
        console.log('⚠️ Error fetching drivers:', driversError);
      }
      
      // Fetch bookings count (if collection exists)
      try {
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('operatorId', '==', operatorId)
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        bookingsCount = bookingsSnap.size;
        
        // Calculate total revenue
        bookingsSnap.forEach(doc => {
          const booking = doc.data();
          totalRevenue += booking.totalAmount || booking.fare || 0;
        });
        
        console.log('🎫 Bookings count:', bookingsCount);
        console.log('💰 Total revenue:', totalRevenue);
      } catch (bookingError) {
        console.log('⚠️ Bookings collection not found, using default values');
      }

      setStatistics({
        totalDrivers: driversCount,
        totalBookings: bookingsCount,
        totalRevenue: totalRevenue,
        activeRoutes: parseInt(profileData.operatingRoutes) || Math.floor(Math.random() * 10) + 1,
        rating: 4.5,
        completedTrips: Math.floor(bookingsCount * 0.9)
      });
      
      console.log('✅ Statistics updated');
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
    }
  };

  // Load recent activities
  const loadRecentActivities = () => {
    const activities = [
      {
        id: 1,
        type: 'driver_added',
        message: 'New driver added to your fleet',
        time: '2 hours ago',
        icon: UsersIcon,
        color: 'text-green-600'
      },
      {
        id: 2,
        type: 'booking_received',
        message: 'New booking received for Route',
        time: '4 hours ago',
        icon: TruckIcon,
        color: 'text-blue-600'
      },
      {
        id: 3,
        type: 'payment_received',
        message: 'Payment of ₹5,000 received',
        time: '1 day ago',
        icon: CurrencyRupeeIcon,
        color: 'text-green-600'
      },
      {
        id: 4,
        type: 'profile_updated',
        message: 'Profile information updated',
        time: '2 days ago',
        icon: UserIcon,
        color: 'text-gray-600'
      }
    ];
    setRecentActivities(activities);
    console.log('✅ Recent activities loaded');
  };

  // 🔥 FIXED: Update profile with create or update logic
  const updateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const operatorId = currentOperator.operatorId || currentOperator.id;
      console.log('💾 Updating profile for operator:', operatorId);
      console.log('📄 Document exists:', documentExists);
      
      const operatorRef = doc(db, 'operators', operatorId);
      
      // Prepare data to save
      const dataToSave = {
        // Basic info
        operatorId: operatorId,
        fullName: profileData.fullName,
        name: profileData.fullName, // Alternative field name
        emailAddress: profileData.emailAddress,
        email: profileData.emailAddress, // Alternative field name
        mobileNumber: profileData.mobileNumber,
        phone: profileData.mobileNumber, // Alternative field name
        
        // Business info
        businessName: profileData.businessName,
        companyName: profileData.companyName,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode,
        gstNumber: profileData.gstNumber,
        panNumber: profileData.panNumber,
        licenseNumber: profileData.licenseNumber,
        establishedYear: profileData.establishedYear,
        experience: profileData.experience,
        totalBuses: profileData.totalBuses,
        operatingRoutes: profileData.operatingRoutes,
        description: profileData.description,
        
        // Financial info
        bankAccountNumber: profileData.bankAccountNumber,
        bankIFSC: profileData.bankIFSC,
        bankName: profileData.bankName,
        
        // Contact info
        emergencyContact: profileData.emergencyContact,
        alternateEmail: profileData.alternateEmail,
        website: profileData.website,
        
        // Metadata
        updatedAt: new Date(),
        lastModified: new Date()
      };
      
      if (documentExists) {
        // Document exists, update it
        console.log('📝 Updating existing document...');
        await updateDoc(operatorRef, dataToSave);
        console.log('✅ Document updated successfully');
      } else {
        // Document doesn't exist, create it
        console.log('➕ Creating new document...');
        dataToSave.createdAt = new Date();
        dataToSave.status = 'approved'; // Set default status
        await setDoc(operatorRef, dataToSave);
        console.log('✅ New document created successfully');
        setDocumentExists(true);
      }

      // Update localStorage
      const updatedOperatorInfo = {
        ...currentOperator,
        name: profileData.fullName,
        businessName: profileData.businessName,
        email: profileData.emailAddress
      };
      localStorage.setItem('operatorInfo', JSON.stringify(updatedOperatorInfo));
      setCurrentOperator(updatedOperatorInfo);

      setIsEditing(false);
      alert('Profile updated successfully!');
      
      // Refresh statistics
      await fetchStatistics(operatorId);
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert('Error updating profile: ' + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('operatorToken');
      localStorage.removeItem('operatorInfo');
      localStorage.removeItem('operatorId');
      window.location.href = '/operator-login';
    }
  };

  // Initialize on component mount
  useEffect(() => {
    console.log('🎯 OperatorProfile component mounted');
    checkAuthAndFetchData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading Profile...</p>
        </div>
      </div>
    );
  }

  // Show login required if no operator data
  if (!currentOperator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to login to access your profile</p>
          <button
            onClick={() => window.location.href = '/operator-login'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with Document Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <UserIcon className="h-10 w-10 text-white" />
                </div>
                <button className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border-2 border-gray-200 hover:bg-gray-50">
                  <CameraIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {profileData.fullName || currentOperator.name || 'Operator Profile'}
                </h1>
                <p className="text-gray-600">{profileData.businessName || profileData.companyName || 'Business Name'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(statistics.rating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">
                      {statistics.rating} Rating
                    </span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className={`text-sm flex items-center gap-1 ${documentExists ? 'text-green-600' : 'text-yellow-600'}`}>
                    {documentExists ? (
                      <>
                        <ShieldCheckIcon className="h-4 w-4" />
                        Profile Synced
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4" />
                        Not Synced
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing (!isEditing)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition duration-200"
              >
                <PencilIcon className="h-5 w-5" />
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Document Status Alert */}
          {!documentExists && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Profile not synced with database. Click "Save Changes" to create your profile.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.totalDrivers}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.totalBookings}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TruckIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₹{statistics.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <CurrencyRupeeIcon className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Routes</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.activeRoutes}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <MapPinIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'profile', name: 'Profile Information', icon: UserIcon },
                { id: 'business', name: 'Business Details', icon: BuildingOfficeIcon },
                { id: 'financial', name: 'Financial Info', icon: BanknotesIcon },
                { id: 'activities', name: 'Recent Activities', icon: ClockIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                  {!documentExists && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Will create new document
                    </span>
                  )}
                </div>
                
                <form onSubmit={updateProfile}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        disabled={!isEditing}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={profileData.emailAddress}
                        onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                        disabled={!isEditing}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        value={profileData.mobileNumber}
                        onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                        disabled={!isEditing}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        value={profileData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        disabled={!isEditing}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact
                      </label>
                      <input
                        type="tel"
                        value={profileData.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alternate Email
                      </label>
                      <input
                        type="email"
                        value={profileData.alternateEmail}
                        onChange={(e) => handleInputChange('alternateEmail', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={profileData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={profileData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={profileData.pincode}
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-4 mt-8">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className={`px-6 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${
                          documentExists 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {updateLoading ? (
                          'Saving...'
                        ) : documentExists ? (
                          'Update Profile'
                        ) : (
                          'Create Profile'
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Business Details Tab */}
            {activeTab === 'business' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Business Information</h2>
                
                <form onSubmit={updateProfile}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={profileData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GST Number
                      </label>
                      <input
                        type="text"
                        value={profileData.gstNumber}
                        onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={profileData.panNumber}
                        onChange={(e) => handleInputChange('panNumber', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={profileData.licenseNumber}
                        onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Established Year
                      </label>
                      <input
                        type="number"
                        value={profileData.establishedYear}
                        onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Buses
                      </label>
                      <input
                        type="number"
                        value={profileData.totalBuses}
                        onChange={(e) => handleInputChange('totalBuses', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operating Routes
                    </label>
                    <textarea
                      value={profileData.operatingRoutes}
                      onChange={(e) => handleInputChange('operatingRoutes', e.target.value)}
                      disabled={!isEditing}
                      rows="3"
                      placeholder="Enter your operating routes separated by commas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    ></textarea>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Description
                    </label>
                    <textarea
                      value={profileData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      disabled={!isEditing}
                      rows="4"
                      placeholder="Describe your business and services"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    ></textarea>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-4 mt-8">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className={`px-6 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${
                          documentExists 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {updateLoading ? (
                          'Saving...'
                        ) : documentExists ? (
                          'Update Business Info'
                        ) : (
                          'Create Profile'
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Financial Information Tab */}
            {activeTab === 'financial' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Financial Information</h2>
                
                <form onSubmit={updateProfile}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        value={profileData.bankAccountNumber}
                        onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank IFSC Code
                      </label>
                      <input
                        type="text"
                        value={profileData.bankIFSC}
                        onChange={(e) => handleInputChange('bankIFSC', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={profileData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-700">
                              ₹{statistics.totalRevenue.toLocaleString()}
                            </p>
                          </div>
                          <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600">Monthly Avg</p>
                            <p className="text-2xl font-bold text-blue-700">
                              ₹{Math.floor(statistics.totalRevenue / 12).toLocaleString()}
                            </p>
                          </div>
                          <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-600">Growth Rate</p>
                            <p className="text-2xl font-bold text-purple-700">+15.2%</p>
                          </div>
                          <ArrowPathIcon className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-4 mt-8">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className={`px-6 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${
                          documentExists 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {updateLoading ? (
                          'Saving...'
                        ) : documentExists ? (
                          'Update Financial Info'
                        ) : (
                          'Create Profile'
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Recent Activities</h2>
                
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${activity.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                        <activity.icon className={`h-5 w-5 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View All Activities →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.href = '/driver-management'}
                  className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <UsersIcon className="h-5 w-5" />
                  Manage Drivers
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  <TruckIcon className="h-5 w-5" />
                  View Bookings
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                  <CurrencyRupeeIcon className="h-5 w-5" />
                  Revenue Reports
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors">
                  <DocumentTextIcon className="h-5 w-5" />
                  Documents
                </button>
              </div>
            </div>

            {/* Profile Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Database Sync</span>
                  <span className={`text-sm font-medium ${documentExists ? 'text-green-600' : 'text-yellow-600'}`}>
                    {documentExists ? '✓ Synced' : '⚠ Not Synced'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Basic Info</span>
                  <span className="text-sm font-medium text-green-600">✓ Complete</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Business Details</span>
                  <span className="text-sm font-medium text-yellow-600">⚠ Incomplete</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Financial Info</span>
                  <span className="text-sm font-medium text-red-600">✗ Missing</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: documentExists ? '75%' : '25%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{documentExists ? '75%' : '25%'} Complete</p>
              </div>
            </div>

            {/* Debug Info */}
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">Debug Info</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Operator ID: {currentOperator?.operatorId || currentOperator?.id}</p>
                <p>Doc Exists: {documentExists ? 'Yes' : 'No'}</p>
                <p>Name: {currentOperator?.name}</p>
                <p>Email: {currentOperator?.email}</p>
                <p>Drivers: {statistics.totalDrivers}</p>
                <p>Bookings: {statistics.totalBookings}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorProfile;
