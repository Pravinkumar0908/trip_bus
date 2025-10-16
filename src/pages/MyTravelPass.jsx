import React, { useState, useEffect } from 'react';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    addDoc,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { db, storage, auth } from '../config/firebase';
import Navbar from '../components/Navbar';
import {
    CreditCard, Calendar, MapPin, Download, Upload, CheckCircle,
    XCircle, Clock, User, Phone, FileText, QrCode, AlertCircle,
    Loader, ArrowRight, Eye, X, Plus, Shield, LogOut, Copy,
    Check, Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const MyTravelPass = () => {
    // Consolidated states
    const [loading, setLoading] = useState(true);
    const [userPass, setUserPass] = useState(null);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrCodeImage, setQrCodeImage] = useState(null);
    const [copied, setCopied] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [cities, setCities] = useState([]);
    const [busOperators, setBusOperators] = useState([]);
    const [buses, setBuses] = useState([]);
    const [searchBus, setSearchBus] = useState('');
    const [filteredBuses, setFilteredBuses] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [animateEntry, setAnimateEntry] = useState(false);

    const [formData, setFormData] = useState({
        source: '', destination: '', validFrom: '', validTo: '',
        busId: '', operatorId: '', idProof: null, reason: 'Regular Commuter',
        userName: '', userMobile: ''
    });

    // Authentication check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser({
                    uid: user.uid,
                    name: user.displayName || 'User',
                    phone: user.phoneNumber || '',
                    email: user.email || ''
                });
                setIsAuthenticated(true);
                setFormData(prev => ({
                    ...prev,
                    userName: user.displayName || '',
                    userMobile: user.phoneNumber || ''
                }));
                loadInitialData();
                setupPassListener(user.uid);
            } else {
                setCurrentUser(null);
                setIsAuthenticated(false);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Entry animation on load
    useEffect(() => {
        if (isAuthenticated) {
            setTimeout(() => setAnimateEntry(true), 500);
        }
    }, [isAuthenticated]);

    // Load initial data
    const loadInitialData = async () => {
        try {
            setLoading(true);
            setCities([
                { id: 'C1', name: 'Jaipur', state: 'Rajasthan', active: true },
                { id: 'C2', name: 'Kota', state: 'Rajasthan', active: true },
                { id: 'C3', name: 'Sawai Madhopur', state: 'Rajasthan', active: true },
                { id: 'C4', name: 'Ranthambore', state: 'Rajasthan', active: true },
                { id: 'C5', name: 'Gangapur', state: 'Rajasthan', active: true },
                { id: 'C6', name: 'Bharatpur', state: 'Rajasthan', active: true },
                { id: 'C7', name: 'Alwar', state: 'Rajasthan', active: true },
                { id: 'C8', name: 'Mumbai', state: 'Maharashtra', active: true },
                { id: 'C9', name: 'Kolkata', state: 'West Bengal', active: true },
                { id: 'C10', name: 'Bangalore', state: 'Karnataka', active: true }
            ]);
            await Promise.all([loadBusOperators(), loadBuses()]);
            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setLoading(false);
        }
    };

    // Load operators
    const loadBusOperators = async () => {
        try {
            const operatorsQuery = query(collection(db, 'operators'), orderBy('fullName', 'asc'));
            const querySnapshot = await getDocs(operatorsQuery);
            const operatorsData = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                operatorsData.push({
                    id: doc.id,
                    operatorId: data.operatorId || doc.id,
                    name: data.fullName || data.businessName || 'Unknown Operator',
                    contact: data.mobileNumber || '',
                    email: data.emailAddress || '',
                    active: data.isActive || false,
                    status: data.status || 'pending'
                });
            });

            const activeOperators = operatorsData.filter(op => 
                op.status === 'approved' || op.active === true
            );
            setBusOperators(activeOperators);
        } catch (error) {
            console.error('Error loading operators:', error);
            setBusOperators([]);
        }
    };

    // Load buses
    const loadBuses = async () => {
        try {
            const busesQuery = query(collection(db, 'buses, operators'), orderBy('busNumber', 'asc'));
            const querySnapshot = await getDocs(busesQuery);
            const busesData = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                busesData.push({
                    id: doc.id,
                    busId: data.busId || doc.id,
                    number: data.busNumber || 'N/A',
                    type: data.type || 'Standard',
                    operatorId: data.operatorId || '',
                    operator: data.operator || 'Unknown Operator',
                    active: data.isActive || false,
                    fare: data.price || 0
                });
            });

            const activeBuses = busesData.filter(bus => bus.active === true);
            setBuses(activeBuses);
            setFilteredBuses(activeBuses);
        } catch (error) {
            console.error('Error loading buses:', error);
            setBuses([]);
            setFilteredBuses([]);
        }
    };

    // Search functionality
    useEffect(() => {
        if (searchBus.trim() === '') {
            setFilteredBuses(buses);
        } else {
            const filtered = buses.filter(bus => 
                bus.number?.toLowerCase().includes(searchBus.toLowerCase()) ||
                bus.type?.toLowerCase().includes(searchBus.toLowerCase()) ||
                bus.operator?.toLowerCase().includes(searchBus.toLowerCase())
            );
            setFilteredBuses(filtered);
        }
    }, [searchBus, buses]);

    // Setup pass listener
    const setupPassListener = (userId) => {
        const q = query(collection(db, 'travelPasses'), where('userId', '==', userId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const passDoc = snapshot.docs[0];
                setUserPass({ id: passDoc.id, ...passDoc.data() });
            } else {
                setUserPass(null);
            }
        });
        return unsubscribe;
    };

    // File upload
    const handleFileUpload = async (file) => {
        if (!file) return null;
        try {
            setUploadProgress(10);
            const storageRef = ref(storage, `idProofs/${currentUser.uid}/${Date.now()}_${file.name}`);
            setUploadProgress(50);
            const snapshot = await uploadBytes(storageRef, file);
            setUploadProgress(80);
            const downloadURL = await getDownloadURL(snapshot.ref);
            setUploadProgress(100);
            return downloadURL;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    };

    // Generate pass ID
    const generatePassId = () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `ETP-${new Date().getFullYear()}-${random}`;
    };

    // Submit application
    const handleSubmitApplication = async (e) => {
        e.preventDefault();
        
        if (!formData.source || !formData.destination || !formData.validFrom || 
            !formData.validTo || !formData.busId || !formData.userName || !formData.userMobile) {
            alert('Please fill all required fields!');
            return;
        }

        try {
            setLoading(true);
            let idProofURL = null;
            if (formData.idProof) {
                idProofURL = await handleFileUpload(formData.idProof);
            }

            const selectedBus = buses.find(bus => bus.id === formData.busId || bus.busId === formData.busId);
            const selectedOperator = busOperators.find(op => op.id === formData.operatorId);
            const passId = generatePassId();

            const passData = {
                passId: passId,
                userId: currentUser.uid,
                name: formData.userName,
                mobile: formData.userMobile,
                source: formData.source,
                destination: formData.destination,
                validFrom: formData.validFrom,
                validTo: formData.validTo,
                busId: selectedBus?.busId || selectedBus?.id || formData.busId,
                busNumber: selectedBus?.number || 'N/A',
                operatorId: selectedOperator?.operatorId || selectedOperator?.id || formData.operatorId,
                operatorName: selectedOperator?.name || 'N/A',
                busType: selectedBus?.type || 'Standard',
                busFare: selectedBus?.fare || 0,
                status: 'Pending',
                issuedBy: 'EasyTrip Transport Authority',
                reason: formData.reason,
                idProofURL: idProofURL,
                appliedOn: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, 'travelPasses'), passData);

            setFormData({
                source: '', destination: '', validFrom: '', validTo: '',
                busId: '', operatorId: '', idProof: null, reason: 'Regular Commuter',
                userName: currentUser.name, userMobile: currentUser.phone
            });

            setShowApplyModal(false);
            alert('✅ Travel pass application submitted successfully!');
        } catch (error) {
            console.error('Error submitting application:', error);
            alert('❌ Error submitting application: ' + error.message);
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    // Generate QR Code
    const generateQRCode = async (data) => {
        try {
            const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data));
            return qrCodeDataURL;
        } catch (error) {
            console.error('Error generating QR code:', error);
            return null;
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    // Show QR Modal
    const showQRCode = async () => {
        if (!userPass) return;
        try {
            setLoading(true);
            const qrData = {
                passId: userPass.passId,
                name: userPass.name,
                mobile: userPass.mobile,
                source: userPass.source,
                destination: userPass.destination,
                validFrom: userPass.validFrom,
                validTo: userPass.validTo,
                busNumber: userPass.busNumber,
                operatorName: userPass.operatorName,
                status: userPass.status
            };
            const qrCodeDataURL = await generateQRCode(qrData);
            setQrCodeImage(qrCodeDataURL);
            setShowQRModal(true);
        } catch (error) {
            console.error('Error generating QR code:', error);
            alert('Error generating QR code');
        } finally {
            setLoading(false);
        }
    };

    // Download premium travel pass as image
    const downloadTravelPassImage = async () => {
        if (!userPass) return;
        
        try {
            setLoading(true);
            
            // Create a canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 700;
            canvas.height = 400;
            
            // Load background image
            const bgImage = new Image();
            bgImage.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                bgImage.onload = () => {
                    // Draw background
                    ctx.drawImage(bgImage, 0, 0, 700, 400);
                    
                    // Set font and colors
                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 18px Arial';
                    
                    // Pass ID
                    ctx.fillText(userPass.passId || 'ETP-2025-XXXX', 130, 25);
                    
                    // Route
                    ctx.font = 'bold 14px Arial';
                    const routeText = `${userPass.source} ➝ ${userPass.destination}`;
                    ctx.fillText(routeText, 480, 47);
                    
                    // Passenger details
                    ctx.font = 'bold 20px Arial';
                    ctx.fillText(userPass.name || 'Passenger Name', 144, 159);
                    
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText(formatDate(userPass.validFrom) || '01 Aug 2025', 150, 185);
                    ctx.fillText(formatDate(userPass.validTo) || '01 Sep 2025', 150, 210);
                    
                    // Bus number
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`Bus: ${userPass.busNumber || 'N/A'}`, 60, 360);
                    
                    // Pass type
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText('Royal Premium Pass', 500, 370);
                    
                    // Generate QR code and add to canvas
                    const qrData = {
                        passId: userPass.passId,
                        name: userPass.name,
                        route: `${userPass.source}-${userPass.destination}`
                    };
                    
                    QRCode.toDataURL(JSON.stringify(qrData), { width: 80 })
                        .then(qrUrl => {
                            const qrImg = new Image();
                            qrImg.onload = () => {
                                // Create white background for QR
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(78, 268, 84, 84);
                                ctx.strokeStyle = '#cccccc';
                                ctx.lineWidth = 2;
                                ctx.strokeRect(78, 268, 84, 84);
                                
                                // Draw QR code
                                ctx.drawImage(qrImg, 80, 270, 80, 80);
                                
                                // Convert to blob and download
                                canvas.toBlob(blob => {
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `TravelPass_${userPass.passId}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                    setLoading(false);
                                }, 'image/png');
                            };
                            qrImg.src = qrUrl;
                        });
                    
                    resolve();
                };
                
                bgImage.onerror = reject;
                bgImage.src = 'https://res.cloudinary.com/dynzrbflv/image/upload/v1754112338/if9yzrdsqnbuf1obrf7k.png';
            });
            
        } catch (error) {
            console.error('Error downloading pass:', error);
            alert('Error downloading travel pass');
            setLoading(false);
        }
    };

    // Copy pass details
    const copyPassDetails = async () => {
        if (!userPass) return;
        const passDetails = `🎫 EASYTRIP TRAVEL PASS
━━━━━━━━━━━━━━━━━━━━━━━━
📋 Pass ID: ${userPass.passId}
👤 Name: ${userPass.name}
📱 Mobile: ${userPass.mobile}
🛣️ Route: ${userPass.source} → ${userPass.destination}
📅 Valid From: ${userPass.validFrom}
📅 Valid To: ${userPass.validTo}
🚌 Bus: ${userPass.busNumber}
🏢 Operator: ${userPass.operatorName}
✅ Status: ${userPass.status.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━`;

        try {
            await navigator.clipboard.writeText(passDetails.trim());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy pass details');
        }
    };

    // Login required screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-2xl max-w-md transform animate-bounce">
                    <Shield className="text-6xl text-red-600 mx-auto mb-6 animate-pulse" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Login Required</h2>
                    <p className="text-gray-600 mb-6">Please login to access travel pass</p>
                    <button 
                        onClick={() => window.location.href = '/login'}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        Login
                    </button>
                </div>
            </div>
        );
    }

    // Loading screen
    if (loading && !userPass && !cities.length) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-2xl">
                    <Loader className="animate-spin text-6xl text-red-600 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Travel Pass</h2>
                    <p className="text-gray-600">Please wait...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-white">
                <main className="container mx-auto px-6 py-8">
                    {/* Pass Status Section with Premium Animation */}
                    <div className={`bg-white rounded-2xl shadow-xl border border-red-100 p-8 mb-8 transition-all duration-1000 transform ${
                        animateEntry ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                    }`}>
                        {userPass ? (
                            <div className="text-center">
                                {userPass.status === 'Approved' || userPass.status === 'approved' ? (
                                    <div className="animate-fadeIn">
                                        {/* Premium Travel Pass Card */}
                                        <div className="flex items-center justify-center mb-8">
                                            <div className="relative w-[700px] h-[400px] bg-cover bg-center rounded-2xl shadow-2xl border border-gray-300 transform hover:scale-105 transition-all duration-500"
                                                style={{ backgroundImage: "url('https://res.cloudinary.com/dynzrbflv/image/upload/v1754112338/if9yzrdsqnbuf1obrf7k.png')" }}>

                                                {/* Animated shimmer effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>

                                                {/* Pass ID */}
                                                <div className="absolute top-[6px] left-[130px] text-black font-extrabold text-lg animate-slideInLeft">
                                                    {userPass.passId || 'ETP-2025-XXXX'}
                                                </div>

                                                {/* Route Information */}
                                                <div className="absolute top-[28px] right-[10px] text-black font-bold text-sm animate-slideInRight">
                                                    {userPass.source && userPass.destination 
                                                        ? `${userPass.source} ➝ ${userPass.destination}` 
                                                        : 'Source ➝ Destination'
                                                    }
                                                </div>

                                                {/* Passenger Details */}
                                                <div className="absolute top-[140px] left-[150px] space-y-1 animate-fadeInUp">
                                                    <div className="-ml-6 -mt-1">
                                                        <span className="text-black text-xl font-semibold">
                                                            {userPass.name || 'Passenger Name'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-black text-lg font-semibold">
                                                            {formatDate(userPass.validFrom) || '01 Aug 2025'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-black text-lg font-semibold">
                                                            {formatDate(userPass.validTo) || '01 Sep 2025'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Animated QR Code */}
                                                <div className="absolute top-[250px] left-[80px] animate-pulse">
                                                    <div className="w-20 h-20 bg-white p-1 rounded-lg shadow-md border border-gray-300 hover:shadow-lg transition-shadow">
                                                        <img
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(userPass.passId + '-' + userPass.name)}`}
                                                            alt="QR Code"
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Pass Type */}
                                                <div className="absolute bottom-[30px] right-[40px] text-black font-bold text-lg animate-slideInRight">
                                                    <span >
                                                        Royal Premium Pass
                                                    </span>
                                                </div>

                                                {/* Bus Number */}
                                                <div className="absolute bottom-[35px] left-[70px] text-black font-medium text-base animate-slideInLeft">
                                                    Bus: {userPass.busNumber || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Premium Action Buttons */}
                                        <div className="flex justify-center space-x-4">
                                            <button
                                                onClick={downloadTravelPassImage}
                                                disabled={loading}
                                                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl disabled:opacity-50 flex items-center group"
                                            >
                                                {loading ? (
                                                    <Loader className="animate-spin mr-2 w-5 h-5" />
                                                ) : (
                                                    <Download className="mr-2 w-5 h-5 group-hover:animate-bounce" />
                                                )}
                                                <span className="font-semibold">Download Pass</span>
                                            </button>
                                            <button 
                                                onClick={showQRCode}
                                                disabled={loading}
                                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl disabled:opacity-50 flex items-center group"
                                            >
                                                {loading ? (
                                                    <Loader className="animate-spin mr-2 w-5 h-5" />
                                                ) : (
                                                    <QrCode className="mr-2 w-5 h-5 group-hover:animate-pulse" />
                                                )}
                                                <span className="font-semibold">View QR</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : userPass.status === 'Pending' ? (
                                    <div className="animate-pulse">
                                        <div className="bg-yellow-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                            <Clock className="text-4xl text-yellow-600" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-yellow-800 mb-4">
                                            🕓 Application Pending
                                        </h2>
                                        <p className="text-gray-600 mb-4">Your travel pass application is under review</p>
                                        <div className="bg-yellow-50 rounded-xl p-4">
                                            <p className="text-sm text-yellow-700">Pass ID: {userPass.passId}</p>
                                            <p className="text-sm text-yellow-700">Route: {userPass.source} → {userPass.destination}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-shake">
                                        <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                            <XCircle className="text-4xl text-red-600" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-red-800 mb-4">❌ Application Rejected</h2>
                                        <p className="text-gray-600 mb-4">Your travel pass application was not approved</p>
                                        <button
                                            onClick={() => setShowApplyModal(true)}
                                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                        >
                                            Apply Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center animate-fadeIn">
                                <div className="bg-gray-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                    <CreditCard className="text-4xl text-gray-400" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">❌ No Active Travel Pass</h2>
                                <p className="text-gray-600 mb-6">You don't have any travel pass yet</p>
                                <button
                                    onClick={() => setShowApplyModal(true)}
                                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center mx-auto"
                                >
                                    <Plus className="mr-2 w-5 h-5" />
                                    Apply for Travel Pass
                                </button>
                            </div>
                        )}
                    </div>
                </main>

                {/* QR Modal */}
                {showQRModal && qrCodeImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center transform animate-slideInUp">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">Travel Pass QR Code</h3>
                                <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="mb-6">
                                <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                                    <img src={qrCodeImage} alt="Travel Pass QR Code" className="w-64 h-64 mx-auto border border-gray-300 rounded-lg" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                                <div className="text-left space-y-2">
                                    <p className="text-sm"><span className="font-semibold">Pass ID:</span> {userPass.passId}</p>
                                    <p className="text-sm"><span className="font-semibold">Name:</span> {userPass.name}</p>
                                    <p className="text-sm"><span className="font-semibold">Route:</span> {userPass.source} → {userPass.destination}</p>
                                    <p className="text-sm"><span className="font-semibold">Valid:</span> {userPass.validFrom} to {userPass.validTo}</p>
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button onClick={copyPassDetails} className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center">
                                    {copied ? <><Check className="mr-2 w-4 h-4" />Copied!</> : <><Copy className="mr-2 w-4 h-4" />Copy Details</>}
                                </button>
                                <button
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = qrCodeImage;
                                        link.download = `QR_${userPass.passId}.png`;
                                        link.click();
                                    }}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 flex items-center justify-center"
                                >
                                    <Download className="mr-2 w-4 h-4" />Save QR
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Apply Modal - Simplified */}
                {showApplyModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto transform animate-slideInUp">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">Apply for Travel Pass</h3>
                                <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitApplication} className="space-y-6">
                                {/* Personal Details */}
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                                        <User className="mr-2 w-5 h-5" />Personal Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Full Name *"
                                            value={formData.userName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                            required
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Mobile Number *"
                                            value={formData.userMobile}
                                            onChange={(e) => setFormData(prev => ({ ...prev, userMobile: e.target.value }))}
                                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Travel Details */}
                                <div className="bg-green-50 rounded-xl p-4">
                                    <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                                        <MapPin className="mr-2 w-5 h-5" />Travel Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <select
                                            value={formData.source}
                                            onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                            required
                                        >
                                            <option value="">From *</option>
                                            {cities.map(city => (
                                                <option key={city.id} value={city.name}>{city.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={formData.destination}
                                            onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                            required
                                        >
                                            <option value="">To *</option>
                                            {cities.map(city => (
                                                <option key={city.id} value={city.name}>{city.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="date"
                                            value={formData.validFrom}
                                            onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                        <input
                                            type="date"
                                            value={formData.validTo}
                                            onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                            min={formData.validFrom || new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Bus Selection */}
                                <div className="bg-orange-50 rounded-xl p-4">
                                    <h4 className="text-lg font-bold text-orange-800 mb-4 flex items-center">
                                        <CreditCard className="mr-2 w-5 h-5" />Bus Selection
                                    </h4>
                                    <input
                                        type="text"
                                        placeholder="Search buses..."
                                        value={searchBus}
                                        onChange={(e) => setSearchBus(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-2"
                                    />
                                    <select
                                        value={formData.busId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, busId: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                        required
                                    >
                                        <option value="">Select Bus *</option>
                                        {filteredBuses.map(bus => (
                                            <option key={bus.id} value={bus.id}>
                                                {bus.number} - {bus.type} - {bus.operator} (₹{bus.fare})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center justify-center font-semibold"
                                >
                                    {loading ? (
                                        <Loader className="animate-spin mr-2 w-5 h-5" />
                                    ) : (
                                        <Plus className="mr-2 w-5 h-5" />
                                    )}
                                    {loading ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideInUp {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                @keyframes slideInLeft {
                    from { transform: translateX(-50px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(50px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes fadeInUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(200%) skewX(-12deg); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
                .animate-fadeIn { animation: fadeIn 0.5s ease-in-out; }
                .animate-slideInUp { animation: slideInUp 0.5s ease-out; }
                .animate-slideInLeft { animation: slideInLeft 0.7s ease-out; }
                .animate-slideInRight { animation: slideInRight 0.7s ease-out; }
                .animate-fadeInUp { animation: fadeInUp 0.8s ease-out; }
                .animate-shimmer { animation: shimmer 2s infinite; }
                .animate-shake { animation: shake 0.5s ease-in-out; }
            `}</style>
        </>
    );
};

export default MyTravelPass;
