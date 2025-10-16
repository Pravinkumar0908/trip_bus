import { useState, useEffect } from 'react';
import { 
    onAuthStateChanged, 
    signOut 
} from 'firebase/auth';
import { 
    doc, 
    getDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaGlobe, 
  FaKey, 
  FaShieldAlt, 
  FaHistory, 
  FaSignOutAlt,
  FaHome,
  FaBus,
  FaCreditCard,
  FaBell,
  FaSms,
  FaPlane,
  FaTicketAlt,
  FaChair,
  FaSnowflake,
  FaVenus,
  FaBan,
  FaEye,
  FaUserSlash,
  FaFileContract,
  FaTrash,
  FaHeadset,
  FaComments,
  FaQuestionCircle,
  FaExclamationTriangle,
  FaUserTimes,
  FaChevronRight,
  FaEdit,
  FaTimes,
  FaToggleOn,
  FaToggleOff,
  FaSave,
  FaCamera,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaBars,
  FaUserCog,
  FaLock,
  FaAddressBook} from 'react-icons/fa';
import Navbar from '../components/Navbar';

const Profile = () => {
    // Authentication states
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    // UI states
    const [activeSection, setActiveSection] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Settings states
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        language: 'English',
        gender: 'Male',
        dateOfBirth: ''
    });

    const [notifications, setNotifications] = useState({
        sms: true,
        email: true,
        push: true,
        tripReminder: true
    });

    const [bookingPrefs, setBookingPrefs] = useState({
        seatPreference: 'Window',
        busType: 'AC Sleeper',
        genderSeating: true,
        blockedOperators: []
    });

    const [privacy, setPrivacy] = useState({
        profileVisibility: 'Friends Only',
        targetedAds: false,
        termsAccepted: true
    });

    const [savedAddresses] = useState([
        { id: 1, label: 'Home', address: '123 Main St, Mumbai' },
        { id: 2, label: 'Work', address: '456 Business Park, Pune' }
    ]);

    const [savedPayments] = useState([
        { id: 1, type: 'Card', last4: '4321', name: 'HDFC Credit Card' },
        { id: 2, type: 'UPI', name: 'john@paytm' }
    ]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setIsLoggedIn(true);
                fetchUserProfile(currentUser.uid);
            } else {
                setUser(null);
                setUserProfile(null);
                setIsLoggedIn(false);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchUserProfile = async (userId) => {
        try {
            setLoading(true);
            
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = { id: userDoc.id, ...userDoc.data() };
                setUserProfile(userData);
                
                setProfileData({
                    name: userData.name || '',
                    email: userData.email || user?.email || '',
                    phone: userData.phone || '',
                    language: userData.language || 'English',
                    gender: userData.gender || 'Male',
                    dateOfBirth: userData.dateOfBirth || ''
                });
            } else {
                const usersCollection = collection(db, 'users');
                const q = query(usersCollection, where('uid', '==', userId));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0];
                    const data = { id: userData.id, ...userData.data() };
                    setUserProfile(data);
                    
                    setProfileData({
                        name: data.name || '',
                        email: data.email || user?.email || '',
                        phone: data.phone || '',
                        language: data.language || 'English',
                        gender: data.gender || 'Male',
                        dateOfBirth: data.dateOfBirth || ''
                    });
                } else {
                    setError('User profile not found');
                }
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setError('Failed to fetch user profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            if (window.confirm('Are you sure you want to logout from all devices?')) {
                await signOut(auth);
                setUser(null);
                setUserProfile(null);
                setIsLoggedIn(false);
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const updateProfile = async (updates) => {
        try {
            if (userProfile?.id) {
                const userDocRef = doc(db, 'users', userProfile.id);
                await updateDoc(userDocRef, updates);
                setUserProfile(prev => ({ ...prev, ...updates }));
                setProfileData(prev => ({ ...prev, ...updates }));
                alert('Profile updated successfully!');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    // Modal and UI handlers
    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    const openModal = (content) => {
        setModalContent(content);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalContent(null);
    };

    const handleNotificationToggle = (type) => {
        setNotifications(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const handleBookingPrefChange = (type, value) => {
        setBookingPrefs(prev => ({
            ...prev,
            [type]: value
        }));
    };

    const handlePrivacyToggle = (type) => {
        setPrivacy(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const handleAccountAction = (action) => {
        if (action === 'deactivate') {
            if (window.confirm('Are you sure you want to deactivate your account temporarily?')) {
                alert('Account deactivated successfully!');
            }
        } else if (action === 'delete') {
            if (window.confirm('This will permanently delete your account. This action cannot be undone. Are you sure?')) {
                alert('Account deletion request submitted!');
            }
        }
    };

    // Settings data
    const settingsData = [
        {
            id: 'personal',
            title: 'Personal Information',
            icon: <FaUser className="text-red-500" />,
            mobileIcon: <FaUserCog className="text-red-500" />,
            items: [
                { 
                    icon: <FaEdit />, 
                    text: 'Edit Profile', 
                    subtitle: 'Name, Photo, Gender, Date of Birth',
                    action: () => openModal('editProfile')
                },
                { 
                    icon: <FaPhone />, 
                    text: 'Mobile Number', 
                    subtitle: profileData.phone || 'Not provided',
                    action: () => openModal('editPhone')
                },
                { 
                    icon: <FaEnvelope />, 
                    text: 'Email ID', 
                    subtitle: profileData.email,
                    action: () => openModal('editEmail')
                },
                { 
                    icon: <FaGlobe />, 
                    text: 'Preferred Language', 
                    subtitle: profileData.language,
                    action: () => openModal('editLanguage')
                }
            ]
        },
        {
            id: 'security',
            title: 'Account & Security',
            icon: <FaShieldAlt className="text-red-500" />,
            mobileIcon: <FaLock className="text-red-500" />,
            items: [
                { 
                    icon: <FaKey />, 
                    text: 'Change Password', 
                    subtitle: 'Update your password',
                    action: () => openModal('changePassword')
                },
                { 
                    icon: <FaShieldAlt />, 
                    text: 'Two-Factor Authentication (2FA)', 
                    subtitle: 'Currently: Disabled',
                    action: () => openModal('setup2FA')
                },
                { 
                    icon: <FaHistory />, 
                    text: 'Login History / Active Devices', 
                    subtitle: 'View recent login activities',
                    action: () => openModal('loginHistory')
                },
                { 
                    icon: <FaSignOutAlt />, 
                    text: 'Logout from All Devices', 
                    subtitle: 'Sign out everywhere',
                    action: handleLogout
                }
            ]
        },
        {
            id: 'address',
            title: 'Address & Saved Info',
            icon: <FaHome className="text-red-500" />,
            mobileIcon: <FaAddressBook className="text-red-500" />,
            items: [
                { 
                    icon: <FaHome />, 
                    text: 'Saved Addresses', 
                    subtitle: `${savedAddresses.length} addresses saved`,
                    action: () => openModal('savedAddresses')
                },
                { 
                    icon: <FaBus />, 
                    text: 'Saved Boarding & Dropping Points', 
                    subtitle: 'Quick access points',
                    action: () => openModal('savedPoints')
                },
                { 
                    icon: <FaCreditCard />, 
                    text: 'Saved Payment Methods', 
                    subtitle: `${savedPayments.length} methods saved`,
                    action: () => openModal('savedPayments')
                }
            ]
        },
        {
            id: 'notifications',
            title: 'Notification Preferences',
            icon: <FaBell className="text-red-500" />,
            mobileIcon: <FaBell className="text-red-500" />,
            items: [
                { 
                    icon: <FaSms />, 
                    text: 'SMS Notifications', 
                    subtitle: 'Text message alerts',
                    toggle: true,
                    value: notifications.sms,
                    action: () => handleNotificationToggle('sms')
                },
                { 
                    icon: <FaEnvelope />, 
                    text: 'Email Notifications', 
                    subtitle: 'Email alerts',
                    toggle: true,
                    value: notifications.email,
                    action: () => handleNotificationToggle('email')
                },
                { 
                    icon: <FaBell />, 
                    text: 'App Push Notifications', 
                    subtitle: 'Mobile app notifications',
                    toggle: true,
                    value: notifications.push,
                    action: () => handleNotificationToggle('push')
                },
                { 
                    icon: <FaPlane />, 
                    text: 'Trip Reminder Settings', 
                    subtitle: 'Journey reminders',
                    toggle: true,
                    value: notifications.tripReminder,
                    action: () => handleNotificationToggle('tripReminder')
                }
            ]
        },
        {
            id: 'booking',
            title: 'Booking Preferences',
            icon: <FaTicketAlt className="text-red-500" />,
            mobileIcon: <FaTicketAlt className="text-red-500" />,
            items: [
                { 
                    icon: <FaChair />, 
                    text: 'Seat Preference', 
                    subtitle: bookingPrefs.seatPreference,
                    action: () => openModal('seatPreference')
                },
                { 
                    icon: <FaSnowflake />, 
                    text: 'Bus Type Preference', 
                    subtitle: bookingPrefs.busType,
                    action: () => openModal('busType')
                },
                { 
                    icon: <FaVenus />, 
                    text: 'Gender-based Seating Preference', 
                    subtitle: 'Safety preferences',
                    toggle: true,
                    value: bookingPrefs.genderSeating,
                    action: () => handleBookingPrefChange('genderSeating', !bookingPrefs.genderSeating)
                },
                { 
                    icon: <FaBan />, 
                    text: 'Block certain operators or routes', 
                    subtitle: `${bookingPrefs.blockedOperators.length} operators blocked`,
                    action: () => openModal('blockedOperators')
                }
            ]
        },
        {
            id: 'privacy',
            title: 'Privacy & Permissions',
            icon: <FaEye className="text-red-500" />,
            mobileIcon: <FaEye className="text-red-500" />,
            items: [
                { 
                    icon: <FaEye />, 
                    text: 'Profile Visibility', 
                    subtitle: privacy.profileVisibility,
                    action: () => openModal('profileVisibility')
                },
                { 
                    icon: <FaUserSlash />, 
                    text: 'Disable targeted ads', 
                    subtitle: 'Data sharing preferences',
                    toggle: true,
                    value: privacy.targetedAds,
                    action: () => handlePrivacyToggle('targetedAds')
                },
                { 
                    icon: <FaFileContract />, 
                    text: 'Terms & Conditions', 
                    subtitle: privacy.termsAccepted ? 'Accepted' : 'Pending',
                    action: () => openModal('terms')
                }
            ]
        },
        {
            id: 'support',
            title: 'Support & Help',
            icon: <FaHeadset className="text-red-500" />,
            mobileIcon: <FaHeadset className="text-red-500" />,
            items: [
                { 
                    icon: <FaHeadset />, 
                    text: 'Contact Support', 
                    subtitle: 'Get help from our team',
                    action: () => openModal('contactSupport')
                },
                { 
                    icon: <FaComments />, 
                    text: 'Chat with Bot or Agent', 
                    subtitle: 'Live assistance',
                    action: () => alert('Opening chat window...')
                },
                { 
                    icon: <FaQuestionCircle />, 
                    text: 'FAQs / Help Docs', 
                    subtitle: 'Common questions',
                    action: () => openModal('faqs')
                }
            ]
        },
        {
            id: 'account',
            title: 'Deactivate / Delete Account',
            icon: <FaExclamationTriangle className="text-red-500" />,
            mobileIcon: <FaExclamationTriangle className="text-red-500" />,
            items: [
                { 
                    icon: <FaExclamationTriangle />, 
                    text: 'Deactivate Account', 
                    subtitle: 'Temporarily disable account',
                    action: () => handleAccountAction('deactivate')
                },
                { 
                    icon: <FaUserTimes />, 
                    text: 'Delete Account Permanently', 
                    subtitle: 'This action cannot be undone',
                    action: () => handleAccountAction('delete')
                }
            ]
        }
    ];

    const renderModalContent = () => {
        switch (modalContent) {
            case 'editProfile':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Edit Profile</h3>
                        <div className="text-center mb-4">
                            <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <FaUser className="text-gray-600 text-2xl" />
                            </div>
                            <button className="text-red-500 text-sm flex items-center gap-1 mx-auto">
                                <FaCamera /> Change Photo
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            className="w-full p-3 border rounded-lg text-sm sm:text-base"
                        />
                        <select
                            value={profileData.gender}
                            onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                            className="w-full p-3 border rounded-lg text-sm sm:text-base"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        <input
                            type="date"
                            value={profileData.dateOfBirth}
                            onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                            className="w-full p-3 border rounded-lg text-sm sm:text-base"
                        />
                        <button 
                            onClick={() => {
                                updateProfile({
                                    name: profileData.name,
                                    gender: profileData.gender,
                                    dateOfBirth: profileData.dateOfBirth
                                });
                                closeModal();
                            }}
                            className="w-full bg-red-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
                        >
                            <FaSave /> Save Changes
                        </button>
                    </div>
                );

            case 'editPhone':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Update Mobile Number</h3>
                        <input
                            type="tel"
                            placeholder="Enter new mobile number"
                            className="w-full p-3 border rounded-lg text-sm sm:text-base"
                        />
                        <button className="w-full bg-red-500 text-white p-3 rounded-lg text-sm sm:text-base font-medium">Send OTP</button>
                    </div>
                );

            case 'editEmail':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Update Email ID</h3>
                        <input
                            type="email"
                            placeholder="Enter new email"
                            className="w-full p-3 border rounded-lg text-sm sm:text-base"
                        />
                        <button className="w-full bg-red-500 text-white p-3 rounded-lg text-sm sm:text-base font-medium">Send Verification</button>
                    </div>
                );

            case 'editLanguage':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Preferred Language</h3>
                        {['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali'].map(lang => (
                            <label key={lang} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="language"
                                    value={lang}
                                    checked={profileData.language === lang}
                                    onChange={() => {
                                        setProfileData({...profileData, language: lang});
                                        updateProfile({ language: lang });
                                        closeModal();
                                    }}
                                    className="text-red-500"
                                />
                                <span className="text-sm sm:text-base">{lang}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'changePassword':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Change Password</h3>
                        <input type="password" placeholder="Current Password" className="w-full p-3 border rounded-lg text-sm sm:text-base" />
                        <input type="password" placeholder="New Password" className="w-full p-3 border rounded-lg text-sm sm:text-base" />
                        <input type="password" placeholder="Confirm New Password" className="w-full p-3 border rounded-lg text-sm sm:text-base" />
                        <button className="w-full bg-red-500 text-white p-3 rounded-lg text-sm sm:text-base font-medium">Update Password</button>
                    </div>
                );

            case 'setup2FA':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Setup Two-Factor Authentication</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
                                <input type="radio" name="2fa" value="sms" />
                                <FaSms className="text-blue-500" />
                                <span className="text-sm sm:text-base">SMS OTP</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
                                <input type="radio" name="2fa" value="app" />
                                <FaShieldAlt className="text-green-500" />
                                <span className="text-sm sm:text-base">Authenticator App</span>
                            </label>
                        </div>
                        <button className="w-full bg-red-500 text-white p-3 rounded-lg text-sm sm:text-base font-medium">Enable 2FA</button>
                    </div>
                );

            case 'loginHistory':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Login History</h3>
                        <div className="space-y-3">
                            {[
                                { device: 'Chrome on Windows', location: 'Mumbai', time: 'Today 2:30 PM', active: true },
                                { device: 'Mobile App', location: 'Mumbai', time: 'Yesterday 8:15 AM', active: false },
                                { device: 'Firefox on Mac', location: 'Pune', time: '2 days ago', active: false }
                            ].map((login, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-sm sm:text-base">{login.device}</p>
                                            <p className="text-xs sm:text-sm text-gray-600">{login.location} • {login.time}</p>
                                        </div>
                                        {login.active && <span className="text-green-500 text-xs sm:text-sm">Active</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'savedAddresses':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Saved Addresses</h3>
                        <div className="space-y-3">
                            {savedAddresses.map(address => (
                                <div key={address.id} className="p-3 border rounded-lg flex justify-between items-center">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm sm:text-base truncate">{address.label}</p>
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">{address.address}</p>
                                    </div>
                                    <button className="text-red-500 ml-2 flex-shrink-0"><FaEdit /></button>
                                </div>
                            ))}
                        </div>
                        <button className="w-full bg-red-500 text-white p-3 rounded-lg text-sm sm:text-base font-medium">Add New Address</button>
                    </div>
                );

            case 'savedPayments':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Saved Payment Methods</h3>
                        <div className="space-y-3">
                            {savedPayments.map(payment => (
                                <div key={payment.id} className="p-3 border rounded-lg flex justify-between items-center">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <FaCreditCard className="text-blue-500 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm sm:text-base truncate">{payment.name}</p>
                                            {payment.last4 && <p className="text-xs sm:text-sm text-gray-600">**** {payment.last4}</p>}
                                        </div>
                                    </div>
                                    <button className="text-red-500 ml-2 flex-shrink-0"><FaTrash /></button>
                                </div>
                            ))}
                        </div>
                        <button className="w-full bg-red-500 text-white p-3 rounded-lg text-sm sm:text-base font-medium">Add Payment Method</button>
                    </div>
                );

            case 'seatPreference':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Seat Preference</h3>
                        {['Window', 'Aisle', 'No Preference'].map(pref => (
                            <label key={pref} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="seatPref"
                                    value={pref}
                                    checked={bookingPrefs.seatPreference === pref}
                                    onChange={() => handleBookingPrefChange('seatPreference', pref)}
                                />
                                <span className="text-sm sm:text-base">{pref}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'busType':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Bus Type Preference</h3>
                        {['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater', 'No Preference'].map(type => (
                            <label key={type} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="busType"
                                    value={type}
                                    checked={bookingPrefs.busType === type}
                                    onChange={() => handleBookingPrefChange('busType', type)}
                                />
                                <span className="text-sm sm:text-base">{type}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'contactSupport':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Contact Support</h3>
                        <div className="space-y-3">
                            <button className="w-full p-3 border rounded-lg text-left flex items-center gap-3 hover:bg-gray-50">
                                <FaPhone className="text-green-500 flex-shrink-0" />
                                <span className="text-sm sm:text-base">Call Support: 1800-123-4567</span>
                            </button>
                            <button className="w-full p-3 border rounded-lg text-left flex items-center gap-3 hover:bg-gray-50">
                                <FaEnvelope className="text-blue-500 flex-shrink-0" />
                                <span className="text-sm sm:text-base">Email: support@tripeasy.com</span>
                            </button>
                            <button className="w-full p-3 border rounded-lg text-left flex items-center gap-3 hover:bg-gray-50">
                                <FaComments className="text-purple-500 flex-shrink-0" />
                                <span className="text-sm sm:text-base">Live Chat (9 AM - 9 PM)</span>
                            </button>
                        </div>
                    </div>
                );

            case 'faqs':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
                        <div className="space-y-3">
                            {[
                                'How to cancel my booking?',
                                'What is the refund policy?',
                                'How to change my seat?',
                                'Payment failed, what to do?',
                                'How to contact driver?'
                            ].map((faq, index) => (
                                <div key={index} className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <p className="font-medium text-sm sm:text-base">{faq}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return <div>Content not available</div>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh] px-4">
                    <div className="text-center">
                        <FaSpinner className="animate-spin text-red-500 text-4xl mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">Loading Profile...</h3>
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh] px-4">
                    <div className="text-center bg-white p-6 sm:p-8 rounded-xl shadow-sm max-w-md mx-auto w-full">
                        <FaUser className="text-gray-400 text-4xl sm:text-6xl mx-auto mb-4" />
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600 mb-6 text-sm sm:text-base">Please log in to view your profile.</p>
                        <button 
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto"
                            onClick={() => window.location.href = '/login'}
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh] px-4">
                    <div className="text-center bg-white p-6 sm:p-8 rounded-xl shadow-sm max-w-md mx-auto w-full">
                        <FaExclamationTriangle className="text-red-500 text-4xl sm:text-6xl mx-auto mb-4" />
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Error</h2>
                        <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            {/* Header - Responsive */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FaUser className="text-red-500 text-xl sm:text-2xl" />
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Profile</h1>
                        </div>
                        {/* Mobile Menu Toggle */}
                        <button 
                            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <FaBars className="text-xl" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation - Responsive */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
                        <button
                            onClick={() => {
                                setActiveTab('profile');
                                setIsMobileMenuOpen(false);
                            }}
                            className={`py-3 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                                activeTab === 'profile' 
                                    ? 'border-red-500 text-red-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Profile Info
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('settings');
                                setIsMobileMenuOpen(false);
                            }}
                            className={`py-3 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                                activeTab === 'settings' 
                                    ? 'border-red-500 text-red-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Responsive */}
            <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
                {activeTab === 'profile' ? (
                    /* Profile Tab Content */
                    <div className="space-y-4 sm:space-y-6">
                        {/* Profile Header Card - Mobile Optimized */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0">
                                    {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{profileData.name || 'User'}</h2>
                                    <p className="text-gray-600 text-sm sm:text-base break-all">{profileData.email}</p>
                                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2">
                                        <span className="text-xs sm:text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                            {user?.emailVerified ? 'Verified' : 'Verified'}
                                        </span>
                                        <span className="text-xs sm:text-sm text-gray-500">
                                            Member since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => openModal('editProfile')}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                                >
                                    <FaEdit />
                                    Edit Profile
                                </button>
                            </div>
                        </div>

                        {/* Firebase Auth Info - Mobile Optimized */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FaShieldAlt className="text-red-500" />
                                Authentication Info
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs sm:text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-gray-900 text-sm sm:text-base break-all">{user?.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs sm:text-sm font-medium text-gray-500">User ID</label>
                                    <p className="text-gray-900 font-mono text-xs sm:text-sm break-all">{user?.uid}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs sm:text-sm font-medium text-gray-500">Email Verified</label>
                                    <p className="text-gray-900 text-sm sm:text-base">{user?.emailVerified ? 'Yes' : 'YES'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs sm:text-sm font-medium text-gray-500">Last Sign In</label>
                                    <p className="text-gray-900 text-xs sm:text-sm">{user?.metadata?.lastSignInTime || 'Unknown'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Firestore Profile Data - Mobile Optimized */}
                        {userProfile && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <FaUser className="text-red-500" />
                                    Profile Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs sm:text-sm font-medium text-gray-500">Name</label>
                                        <p className="text-gray-900 text-sm sm:text-base">{userProfile.name || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs sm:text-sm font-medium text-gray-500">Phone</label>
                                        <p className="text-gray-900 text-sm sm:text-base">{userProfile.phone || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs sm:text-sm font-medium text-gray-500">Gender</label>
                                        <p className="text-gray-900 text-sm sm:text-base">{userProfile.gender || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs sm:text-sm font-medium text-gray-500">Date of Birth</label>
                                        <p className="text-gray-900 text-sm sm:text-base">{userProfile.dateOfBirth || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs sm:text-sm font-medium text-gray-500">Language</label>
                                        <p className="text-gray-900 text-sm sm:text-base">{userProfile.language || 'English'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs sm:text-sm font-medium text-gray-500">Created At</label>
                                        <p className="text-gray-900 text-xs sm:text-sm">
                                            {userProfile.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                                {userProfile.profileImage && (
                                    <div className="mt-4">
                                        <label className="text-xs sm:text-sm font-medium text-gray-500">Profile Image</label>
                                        <img 
                                            src={userProfile.profileImage} 
                                            alt="Profile" 
                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mt-2"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Settings Tab Content - Mobile Optimized */
                    <div className="space-y-3 sm:space-y-4">
                        {settingsData.map((section) => (
                            <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Section Header - Mobile Optimized */}
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="text-lg sm:text-xl">
                                            {/* Show mobile icon on small screens if available */}
                                            <span className="block sm:hidden">{section.mobileIcon || section.icon}</span>
                                            <span className="hidden sm:block">{section.icon}</span>
                                        </div>
                                        <h2 className="text-sm sm:text-lg font-semibold text-gray-900 text-left">{section.title}</h2>
                                    </div>
                                    {activeSection === section.id ? 
                                        <FaChevronUp className="text-gray-400 text-sm flex-shrink-0" /> :
                                        <FaChevronDown className="text-gray-400 text-sm flex-shrink-0" />
                                    }
                                </button>

                                {/* Section Items - Mobile Optimized */}
                                {activeSection === section.id && (
                                    <div className="border-t border-gray-100">
                                        {section.items.map((item, index) => (
                                            <div
                                                key={index}
                                                onClick={item.action}
                                                className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-red-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                        <div className="text-gray-500 flex-shrink-0">
                                                            {item.icon}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="font-medium text-gray-900 text-sm sm:text-base">{item.text}</h3>
                                                            <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{item.subtitle}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                        {item.toggle ? (
                                                            item.value ? 
                                                                <FaToggleOn className="text-red-500 text-xl sm:text-2xl" /> : 
                                                                <FaToggleOff className="text-gray-400 text-xl sm:text-2xl" />
                                                        ) : (
                                                            <FaChevronRight className="text-gray-300 text-xs sm:text-sm" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Footer - Mobile Optimized */}
                        <div className="mt-6 sm:mt-8 text-center text-gray-500 text-xs sm:text-sm px-4">
                            <p>App Version 2.4.1 • Last Updated: August 2025</p>
                            <p className="mt-2">Need help? <span className="text-red-500 cursor-pointer hover:underline" onClick={() => openModal('contactSupport')}>Contact Support</span></p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal - Mobile Optimized */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg sm:text-xl font-semibold">Profile Settings</h2>
                                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 p-1">
                                    <FaTimes className="text-lg" />
                                </button>
                            </div>
                            {renderModalContent()}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button (Mobile Only) */}
            <div className="lg:hidden fixed bottom-6 right-6 z-40">
                <button 
                    onClick={() => openModal('contactSupport')}
                    className="bg-red-500 hover:bg-red-600 text-white p-3 sm:p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
                >
                    <FaHeadset className="text-lg sm:text-xl" />
                </button>
            </div>
        </div>
    );
};

export default Profile;
