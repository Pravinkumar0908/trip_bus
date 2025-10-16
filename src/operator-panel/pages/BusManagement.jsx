import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import {
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
    serverTimestamp, query, where
} from 'firebase/firestore';
import {
    Plus, Save, MapPin, Users, Star, Shield,
    Edit, Trash2, Eye, Search, LogOut, TruckIcon, RotateCcw,
    Navigation, FileText, X
} from 'lucide-react';

const OperatorBusManagement = () => {
    const navigate = useNavigate();
    const operatorInfo = JSON.parse(localStorage.getItem('operatorInfo') || 'null');

    // 🔄 Convert 24-hour to 12-hour format function
    const convertTo12Hour = (time24) => {
        if (!time24 || !time24.includes(':')) return time24;
        
        const [hours, minutes] = time24.split(':');
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        
        return `${hour12}:${minutes} ${ampm}`;
    };

    // 🔄 Convert 12-hour to 24-hour format function (for calculations)
    const convertTo24Hour = (time12) => {
        if (!time12 || !time12.includes(':')) return time12;
        
        const [time, period] = time12.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        
        if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
        }
        
        return `${hour24.toString().padStart(2, '0')}:${minutes}`;
    };

    // Calculate duration between departure and arrival times (12-hour format)
    const calculateDuration = (depTime12, arrTime12) => {
        if (!depTime12 || !arrTime12) return '';

        // Convert to 24-hour for calculation
        const depTime24 = convertTo24Hour(depTime12);
        const arrTime24 = convertTo24Hour(arrTime12);

        const [depHour, depMin] = depTime24.split(':').map(Number);
        const [arrHour, arrMin] = arrTime24.split(':').map(Number);

        let depTotalMin = depHour * 60 + depMin;
        let arrTotalMin = arrHour * 60 + arrMin;

        // If arrival is next day
        if (arrTotalMin <= depTotalMin) {
            arrTotalMin += 24 * 60;
        }

        const diffMin = arrTotalMin - depTotalMin;
        const hours = Math.floor(diffMin / 60);
        const minutes = diffMin % 60;

        return `${hours}h ${minutes}m`;
    };

    // States
    const [formData, setFormData] = useState({
        busId: '',
        operator: operatorInfo?.businessName || '',
        operatorId: operatorInfo?.operatorId || operatorInfo?.id || '',
        busNumber: '',
        type: '',
        rating: '',
        reviews: '',
        price: '',
        discount: '',
        seats: '',
        fromCity: '',
        toCity: '',
        distance: '',
        date: '',
        departureTime: '', // Will store 12-hour format
        arrivalTime: '', // Will store 12-hour format
        duration: '',
        operatorPhone: operatorInfo?.mobile || operatorInfo?.mobileNumber || '',
        operatorEmail: operatorInfo?.email || operatorInfo?.emailAddress || '',
        operatorRating: '',
        totalTrips: '',
        experience: '',
        lowerDeckRows: 15,
        upperDeckRows: 15,
        lowerDeckPrice: '',
        upperDeckPrice: '',
        ladiesPrice: '',
        reservedPrice: '',
        isPrime: false,
        womenOnly: false,
        accessible: false
    });

    const [listData, setListData] = useState({
        routes: [],
        stopRoutes: [],
        features: [],
        amenities: [],
        boardingPoints: [],
        droppingPoints: [],
        cancellationPolicies: [],
        partialCancellationPolicies: []
    });

    const [currentInputs, setCurrentInputs] = useState({
        route: '',
        stopRoute: '',
        feature: '',
        amenity: '',
        cancellationPolicy: '',
        partialCancellationPolicy: '',
        boardingPoint: { name: '', address: '', time: '', landmark: '', contactNumber: '' },
        droppingPoint: { name: '', address: '', time: '', landmark: '', contactNumber: '' }
    });

    const [ui, setUi] = useState({
        loading: false,
        message: '',
        activeTab: 'basic',
        dataLoading: false,
        editingBus: null,
        searchTerm: ''
    });

    const [data, setData] = useState({
        busesData: [],
        seatsData: []
    });

    // Helper functions
    const convertArrayToObject = (nestedArray) => {
        const result = {};
        nestedArray.forEach((row, rowIndex) => {
            result[rowIndex] = {};
            row.forEach((seat, colIndex) => {
                result[rowIndex][colIndex] = seat;
            });
        });
        return result;
    };

    const initializeSeatLayout = (rows) => Array(rows).fill().map(() => [0, 0, 0]);
    const generateSeatPrices = (rows, price) => Array(rows).fill().map(() => [`₹${price}`, `₹${price}`, `₹${price}`]);

    // Update functions
    const updateFormData = (field, value) => {
        if (field === 'operator' || field === 'operatorId') {
            return;
        }

        // 🔄 Handle time fields with 12-hour format conversion
        if (field === 'departureTime' || field === 'arrivalTime') {
            // Convert 24-hour input to 12-hour format
            const time12Hour = convertTo12Hour(value);
            const newFormData = { ...formData, [field]: time12Hour };
            
            const duration = calculateDuration(
                field === 'departureTime' ? time12Hour : formData.departureTime,
                field === 'arrivalTime' ? time12Hour : formData.arrivalTime
            );
            
            setFormData(prev => ({ ...prev, [field]: time12Hour, duration }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const updateListData = (field, value) => setListData(prev => ({ ...prev, [field]: value }));
    const updateCurrentInputs = (field, value) => setCurrentInputs(prev => ({ ...prev, [field]: value }));
    const updateUi = (field, value) => setUi(prev => ({ ...prev, [field]: value }));

    // 🔑 MAIN COLLECTION से OPERATOR ID FETCH करने वाला function
    const fetchOperatorDataFromMainCollection = async () => {
        if (!operatorInfo) return null;

        try {
            console.log('🔍 Fetching operator from main collection...');

            const operatorsSnapshot = await getDocs(collection(db, 'operators'));
            let foundOperator = null;

            operatorsSnapshot.docs.forEach(doc => {
                const operatorData = { id: doc.id, ...doc.data() };

                if (
                    operatorData.id === operatorInfo.id ||
                    operatorData.operatorId === operatorInfo.operatorId ||
                    operatorData.email === operatorInfo.email ||
                    operatorData.emailAddress === operatorInfo.emailAddress ||
                    operatorData.businessName === operatorInfo.businessName ||
                    operatorData.mobile === operatorInfo.mobile ||
                    operatorData.mobileNumber === operatorInfo.mobileNumber
                ) {
                    foundOperator = operatorData;
                    console.log('✅ Operator found in main collection:', foundOperator);
                }
            });

            if (foundOperator) {
                const updatedOperatorInfo = {
                    ...operatorInfo,
                    operatorId: foundOperator.operatorId || foundOperator.id,
                    id: foundOperator.id,
                    businessName: foundOperator.businessName || operatorInfo.businessName,
                    email: foundOperator.email || foundOperator.emailAddress || operatorInfo.email,
                    mobile: foundOperator.mobile || foundOperator.mobileNumber || operatorInfo.mobile
                };

                localStorage.setItem('operatorInfo', JSON.stringify(updatedOperatorInfo));

                setFormData(prev => ({
                    ...prev,
                    operator: updatedOperatorInfo.businessName,
                    operatorId: updatedOperatorInfo.operatorId || updatedOperatorInfo.id,
                    operatorPhone: updatedOperatorInfo.mobile,
                    operatorEmail: updatedOperatorInfo.email
                }));

                return updatedOperatorInfo.operatorId || updatedOperatorInfo.id;
            } else {
                console.log('❌ Operator not found in main collection');
                return null;
            }

        } catch (error) {
            console.error('❌ Error fetching operator from main collection:', error);
            updateUi('message', `❌ Error fetching operator: ${error.message}`);
            return null;
        }
    };

    // Check login and validate operator info
    useEffect(() => {
        if (!operatorInfo) {
            navigate('/operator-login');
            return;
        }

        console.log('🔍 Initial Operator Info:', operatorInfo);

        fetchOperatorDataFromMainCollection().then(operatorId => {
            if (operatorId) {
                fetchOperatorBusData(operatorId);
            } else {
                updateUi('message', '❌ Operator not found in database. Please login again.');
                setTimeout(() => {
                    localStorage.clear();
                    navigate('/operator-login');
                }, 3000);
            }
        });
    }, []);

    // 🚌 BUS DATA FETCH करने वाला function
    const fetchOperatorBusData = async (operatorId = null) => {
        updateUi('dataLoading', true);

        try {
            const currentOperatorId = operatorId || operatorInfo?.operatorId || operatorInfo?.id;

            if (!currentOperatorId) {
                throw new Error('Operator ID not found');
            }

            console.log('🔍 Fetching buses for operator ID:', currentOperatorId);

            const [busesSnapshot, seatsSnapshot] = await Promise.all([
                getDocs(query(collection(db, 'buses'), where('operatorId', '==', currentOperatorId))),
                getDocs(query(collection(db, 'bus_seats'), where('operatorId', '==', currentOperatorId)))
            ]);

            const busesArray = busesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const seatsArray = seatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setData({ busesData: busesArray, seatsData: seatsArray });

            console.log('📊 Fetched Data:', {
                buses: busesArray.length,
                seats: seatsArray.length,
                operatorId: currentOperatorId
            });

        } catch (error) {
            console.error('❌ Error fetching bus data:', error);
            updateUi('message', `❌ Error: ${error.message}`);
        } finally {
            updateUi('dataLoading', false);
        }
    };

    // Refresh data function
    const refreshData = async () => {
        const operatorId = await fetchOperatorDataFromMainCollection();
        if (operatorId) {
            await fetchOperatorBusData(operatorId);
        }
    };

    // Add item to list
    const handleAddItem = (item, listKey, inputKey) => {
        if (item && !listData[listKey].includes(item)) {
            updateListData(listKey, [...listData[listKey], item.trim()]);
            updateCurrentInputs(inputKey, '');
        }
    };

    // Remove item from list
    const handleRemoveItem = (index, listKey) => {
        const newList = listData[listKey].filter((_, i) => i !== index);
        updateListData(listKey, newList);
    };

    // Add boarding/dropping points
    const handleAddPoint = (type) => {
        const point = currentInputs[type];
        if (point.name && point.address) {
            // Convert time to 12-hour format if provided
            const time12Hour = point.time ? convertTo12Hour(point.time) : '';
            
            const newPoint = {
                id: `${type === 'boardingPoint' ? 'BP' : 'DP'}${String(listData[`${type.replace('Point', 'Points')}`].length + 1).padStart(3, '0')}`,
                ...point,
                time: time12Hour // Store in 12-hour format
            };
            updateListData(`${type.replace('Point', 'Points')}`, [...listData[`${type.replace('Point', 'Points')}`], newPoint]);
            updateCurrentInputs(type, { name: '', address: '', time: '', landmark: '', contactNumber: '' });
        }
    };

    // Remove boarding/dropping point
    const handleRemovePoint = (index, type) => {
        const listKey = `${type.replace('Point', 'Points')}`;
        const newList = listData[listKey].filter((_, i) => i !== index);
        updateListData(listKey, newList);
    };

    // 🔑 Form submission with 12-hour time format
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.operator || !formData.type || !formData.price || listData.routes.length === 0) {
            updateUi('message', '❌ Please fill required fields and add at least one route.');
            return;
        }

        const currentOperatorId = formData.operatorId || operatorInfo?.operatorId || operatorInfo?.id;
        if (!currentOperatorId) {
            updateUi('message', '❌ Operator ID not found. Please login again.');
            return;
        }

        updateUi('loading', true);
        try {
            const generatedBusId = formData.busId || `BUS${Date.now()}`;
            const generatedBusNumber = formData.busNumber || `${formData.operator.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 10000)}`;
            const totalSeats = (formData.lowerDeckRows + formData.upperDeckRows) * 3;

            // 🚀 Bus data with 12-hour time format
            const busData = {
                busId: generatedBusId,
                busNumber: generatedBusNumber,
                operator: formData.operator,
                operatorId: currentOperatorId,
                type: formData.type,
                rating: Number(formData.rating) || 0,
                reviews: Number(formData.reviews) || 0,
                price: Number(formData.price),
                discount: formData.discount,
                seats: formData.seats,
                routes: listData.routes,
                stopRoutes: listData.stopRoutes,
                features: listData.features,
                amenities: listData.amenities,
                departureTime: formData.departureTime, // 12-hour format (e.g., "9:30 AM")
                arrivalTime: formData.arrivalTime, // 12-hour format (e.g., "6:45 PM")
                duration: formData.duration,
                isPrime: formData.isPrime,
                womenOnly: formData.womenOnly,
                accessible: formData.accessible,
                totalSeats,
                availableSeats: totalSeats - Math.floor(totalSeats * 0.2),
                route: {
                    from: formData.fromCity || listData.routes[0] || '',
                    to: formData.toCity || listData.routes[listData.routes.length - 1] || '',
                    distance: formData.distance
                },
                operatorDetails: {
                    name: formData.operator,
                    operatorId: currentOperatorId,
                    phone: formData.operatorPhone,
                    email: formData.operatorEmail,
                    rating: Number(formData.operatorRating) || 0,
                    totalTrips: Number(formData.totalTrips) || 0,
                    experience: formData.experience
                },
                boardingPoints: listData.boardingPoints.length > 0 ? listData.boardingPoints : [{
                    id: "BP001",
                    name: `${listData.routes[0] || 'Starting Point'} Bus Stand`,
                    address: `Main Bus Station, ${listData.routes[0] || 'City'}`,
                    time: formData.departureTime, // 12-hour format
                    landmark: "Near Railway Station",
                    contactNumber: formData.operatorPhone || "+91-9876543210"
                }],
                droppingPoints: listData.droppingPoints.length > 0 ? listData.droppingPoints : [{
                    id: "DP001",
                    name: `${listData.routes[listData.routes.length - 1] || 'Destination'} Bus Stand`,
                    address: `Main Bus Station, ${listData.routes[listData.routes.length - 1] || 'City'}`,
                    time: formData.arrivalTime, // 12-hour format
                    landmark: "Near City Center",
                    contactNumber: formData.operatorPhone || "+91-9876543220"
                }],
                policies: {
                    cancellation: listData.cancellationPolicies.length > 0 ? listData.cancellationPolicies : [
                        "Free cancellation up to 24 hours before departure",
                        "50% refund between 12-24 hours",
                        "25% refund between 2-12 hours",
                        "No refund within 2 hours of departure"
                    ],
                    partial_cancellation: listData.partialCancellationPolicies.length > 0 ? listData.partialCancellationPolicies : [
                        "Partial cancellation allowed up to 2 hours before departure",
                        "Cancellation charges: ₹50 per seat",
                        "Minimum 2 seats must remain booked",
                        "Full refund minus processing fee for partial cancellation"
                    ]
                },
                date: formData.date || new Date().toISOString().split('T')[0],
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // 🚀 Seat data
            const seatData = {
                busId: generatedBusId,
                busNumber: generatedBusNumber,
                operator: formData.operator,
                operatorId: currentOperatorId,
                lowerDeckRows: formData.lowerDeckRows,
                upperDeckRows: formData.upperDeckRows,
                totalSeats,
                seatLayout: {
                    lowerDeck: convertArrayToObject(initializeSeatLayout(formData.lowerDeckRows)),
                    upperDeck: convertArrayToObject(initializeSeatLayout(formData.upperDeckRows)),
                    seatPrices: {
                        lower: convertArrayToObject(generateSeatPrices(formData.lowerDeckRows, formData.lowerDeckPrice || formData.price || '750')),
                        upper: convertArrayToObject(generateSeatPrices(formData.upperDeckRows, formData.upperDeckPrice || (Number(formData.price) - 50) || '700'))
                    }
                },
                pricing: {
                    lowerDeckPrice: formData.lowerDeckPrice || formData.price || '750',
                    upperDeckPrice: formData.upperDeckPrice || (Number(formData.price) - 50) || '700',
                    ladiesPrice: formData.ladiesPrice || (Number(formData.price) + 100) || '850',
                    reservedPrice: formData.reservedPrice || (Number(formData.price) + 50) || '800'
                },
                date: formData.date || new Date().toISOString().split('T')[0],
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            console.log('🚀 Submitting bus data with 12-hour time format:', {
                operatorId: currentOperatorId,
                businessName: formData.operator,
                busId: generatedBusId,
                busNumber: generatedBusNumber,
                departureTime: formData.departureTime, // 12-hour format
                arrivalTime: formData.arrivalTime, // 12-hour format
                duration: formData.duration
            });

            if (ui.editingBus) {
                await updateDoc(doc(db, 'buses', ui.editingBus.id), {
                    ...busData,
                    updatedAt: serverTimestamp()
                });
                const seatDoc = data.seatsData.find(seat => seat.busId === ui.editingBus.busId);
                if (seatDoc) {
                    await updateDoc(doc(db, 'bus_seats', seatDoc.id), {
                        ...seatData,
                        updatedAt: serverTimestamp()
                    });
                }
                updateUi('message', `✅ Bus "${formData.operator} - ${formData.type}" updated successfully!\n🔑 Operator ID: ${currentOperatorId}\n⏰ Duration: ${formData.duration}\n🕐 Departure: ${formData.departureTime}\n🕕 Arrival: ${formData.arrivalTime}`);
                updateUi('editingBus', null);
            } else {
                await addDoc(collection(db, 'buses'), busData);
                await addDoc(collection(db, 'bus_seats'), seatData);
                updateUi('message', `✅ Bus "${formData.operator} - ${formData.type}" added successfully!\n🔑 Operator ID: ${currentOperatorId}\n🚌 Bus ID: ${generatedBusId}\n⏰ Duration: ${formData.duration}\n🕐 Departure: ${formData.departureTime}\n🕕 Arrival: ${formData.arrivalTime}`);
            }

            resetForm();
            await refreshData();
        } catch (error) {
            console.error('Error submitting form:', error);
            updateUi('message', `❌ Error: ${error.message}`);
        } finally {
            updateUi('loading', false);
        }
    };

    // Reset form with operator info maintained
    const resetForm = () => {
        const currentOperatorInfo = JSON.parse(localStorage.getItem('operatorInfo') || 'null');
        setFormData({
            busId: '',
            operator: currentOperatorInfo?.businessName || '',
            operatorId: currentOperatorInfo?.operatorId || currentOperatorInfo?.id || '',
            busNumber: '',
            type: '',
            rating: '',
            reviews: '',
            price: '',
            discount: '',
            seats: '',
            fromCity: '',
            toCity: '',
            distance: '',
            date: '',
            departureTime: '',
            arrivalTime: '',
            duration: '',
            operatorPhone: currentOperatorInfo?.mobile || currentOperatorInfo?.mobileNumber || '',
            operatorEmail: currentOperatorInfo?.email || currentOperatorInfo?.emailAddress || '',
            operatorRating: '',
            totalTrips: '',
            experience: '',
            lowerDeckRows: 15,
            upperDeckRows: 15,
            lowerDeckPrice: '',
            upperDeckPrice: '',
            ladiesPrice: '',
            reservedPrice: '',
            isPrime: false,
            womenOnly: false,
            accessible: false
        });
        setListData({
            routes: [],
            stopRoutes: [],
            features: [],
            amenities: [],
            boardingPoints: [],
            droppingPoints: [],
            cancellationPolicies: [],
            partialCancellationPolicies: []
        });
        setCurrentInputs({
            route: '',
            stopRoute: '',
            feature: '',
            amenity: '',
            cancellationPolicy: '',
            partialCancellationPolicy: '',
            boardingPoint: { name: '', address: '', time: '', landmark: '', contactNumber: '' },
            droppingPoint: { name: '', address: '', time: '', landmark: '', contactNumber: '' }
        });
    };

    // Load bus for editing
    const loadBusForEdit = (bus) => {
        updateUi('editingBus', bus);
        setFormData({
            ...formData,
            busId: bus.busId || '',
            operator: bus.operator || formData.operator,
            operatorId: bus.operatorId || formData.operatorId,
            busNumber: bus.busNumber || '',
            type: bus.type || '',
            rating: bus.rating?.toString() || '',
            reviews: bus.reviews?.toString() || '',
            price: bus.price?.toString() || '',
            discount: bus.discount || '',
            seats: bus.seats || '',
            departureTime: bus.departureTime || '', // Already in 12-hour format
            arrivalTime: bus.arrivalTime || '', // Already in 12-hour format
            duration: bus.duration || '',
            fromCity: bus.route?.from || '',
            toCity: bus.route?.to || '',
            distance: bus.route?.distance || '',
            date: bus.date || '',
            operatorPhone: bus.operatorDetails?.phone || formData.operatorPhone,
            operatorEmail: bus.operatorDetails?.email || formData.operatorEmail,
            operatorRating: bus.operatorDetails?.rating?.toString() || '',
            totalTrips: bus.operatorDetails?.totalTrips?.toString() || '',
            experience: bus.operatorDetails?.experience || '',
            isPrime: bus.isPrime || false,
            womenOnly: bus.womenOnly || false,
            accessible: bus.accessible || false
        });
        setListData({
            routes: bus.routes || [],
            stopRoutes: bus.stopRoutes || [],
            features: bus.features || [],
            amenities: bus.amenities || [],
            boardingPoints: bus.boardingPoints || [],
            droppingPoints: bus.droppingPoints || [],
            cancellationPolicies: bus.policies?.cancellation || [],
            partialCancellationPolicies: bus.policies?.partial_cancellation || []
        });

        const seatData = data.seatsData.find(seat => seat.busId === bus.busId);
        if (seatData) {
            updateFormData('lowerDeckRows', seatData.lowerDeckRows || 15);
            updateFormData('upperDeckRows', seatData.upperDeckRows || 15);
            updateFormData('lowerDeckPrice', seatData.pricing?.lowerDeckPrice || '');
            updateFormData('upperDeckPrice', seatData.pricing?.upperDeckPrice || '');
            updateFormData('ladiesPrice', seatData.pricing?.ladiesPrice || '');
            updateFormData('reservedPrice', seatData.pricing?.reservedPrice || '');
        }
        updateUi('activeTab', 'basic');
        updateUi('message', `📝 Loaded bus "${bus.operator} - ${bus.type}" for editing`);
    };

    // Delete bus
    const deleteBus = async (bus) => {
        if (!window.confirm(`Delete "${bus.operator} - ${bus.type}"?`)) return;
        updateUi('dataLoading', true);
        try {
            await deleteDoc(doc(db, 'buses', bus.id));
            const seatData = data.seatsData.find(seat => seat.busId === bus.busId);
            if (seatData) await deleteDoc(doc(db, 'bus_seats', seatData.id));
            updateUi('message', `✅ Bus "${bus.operator} - ${bus.type}" deleted successfully!`);
            await refreshData();
        } catch (error) {
            updateUi('message', `❌ Error: ${error.message}`);
        } finally {
            updateUi('dataLoading', false);
        }
    };

    const filteredBuses = data.busesData.filter(bus =>
        ui.searchTerm === '' ||
        bus.type?.toLowerCase().includes(ui.searchTerm.toLowerCase()) ||
        bus.busNumber?.toLowerCase().includes(ui.searchTerm.toLowerCase()) ||
        bus.route?.from?.toLowerCase().includes(ui.searchTerm.toLowerCase()) ||
        bus.route?.to?.toLowerCase().includes(ui.searchTerm.toLowerCase())
    );

    const tabs = [
        { id: 'basic', label: 'Basic Info', icon: <TruckIcon className="w-4 h-4" /> },
        { id: 'route', label: 'Routes & Timing', icon: <MapPin className="w-4 h-4" /> },
        { id: 'features', label: 'Features & Amenities', icon: <Star className="w-4 h-4" /> },
        { id: 'operator', label: 'Operator Details', icon: <Shield className="w-4 h-4" /> },
        { id: 'points', label: 'Boarding/Drop Points', icon: <Navigation className="w-4 h-4" /> },
        { id: 'seats', label: 'Seat Configuration', icon: <Users className="w-4 h-4" /> },
        { id: 'policies', label: 'Policies', icon: <FileText className="w-4 h-4" /> },
        { id: 'data', label: 'My Buses', icon: <Eye className="w-4 h-4" /> }
    ];

    if (!operatorInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <TruckIcon className="w-6 h-6" />
                                    {ui.editingBus ? 'Edit Bus Data' : 'Bus Management System'}
                                </h1>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={refreshData}
                                    disabled={ui.dataLoading}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2"
                                >
                                    <RotateCcw className={`w-4 h-4 ${ui.dataLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                                {ui.editingBus && (
                                    <button
                                        onClick={() => { updateUi('editingBus', null); resetForm(); }}
                                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> New Bus
                                    </button>
                                )}
                                <button
                                    onClick={() => { localStorage.clear(); navigate('/operator-login'); }}
                                    className="px-4 py-2 bg-red-500/80 hover:bg-red-600 rounded-lg flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => updateUi('activeTab', tab.id)}
                                    className={`${ui.activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                                >
                                    {tab.icon} {tab.label}
                                    {tab.id === 'data' && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{data.busesData.length}</span>}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit} className="p-6">

                        {/* Basic Info Tab */}
                        {ui.activeTab === 'basic' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold border-b pb-2">Basic Bus Information</h2>

                                {/* 🔒 Read-only Operator Info Section */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                            <input
                                                type="text"
                                                value={formData.operator}
                                                readOnly
                                                className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
                                                title="This field is automatically filled from main collection"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Operator ID</label>
                                            <input
                                                type="text"
                                                value={formData.operatorId}
                                                readOnly
                                                className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
                                                title="This field is automatically filled from main collection"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Basic form fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bus Type *</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => updateFormData('type', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Bus Type *</option>
                                            <option value="Volvo Benz Travels">Volvo Benz Travels</option>
                                            <option value="AC Sleeper">AC Sleeper</option>
                                            <option value="Non AC Sleeper">Non AC Sleeper</option>
                                            <option value="AC Semi Sleeper">AC Semi Sleeper</option>
                                            <option value="Non AC Semi Sleeper">Non AC Semi Sleeper</option>
                                            <option value="AC Seater">AC Seater</option>
                                            <option value="Non AC Seater">Non AC Seater</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                                        <input
                                            type="number"
                                            placeholder="Enter price"
                                            value={formData.price}
                                            onChange={(e) => updateFormData('price', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number</label>
                                        <input
                                            type="text"
                                            placeholder="Auto-generated if empty"
                                            value={formData.busNumber}
                                            onChange={(e) => updateFormData('busNumber', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="5"
                                            step="0.1"
                                            placeholder="1-5"
                                            value={formData.rating}
                                            onChange={(e) => updateFormData('rating', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reviews Count</label>
                                        <input
                                            type="number"
                                            placeholder="Number of reviews"
                                            value={formData.reviews}
                                            onChange={(e) => updateFormData('reviews', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 10% off"
                                            value={formData.discount}
                                            onChange={(e) => updateFormData('discount', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Journey Date</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => updateFormData('date', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Special Features */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Special Features</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.isPrime}
                                                onChange={(e) => updateFormData('isPrime', e.target.checked)}
                                                className="mr-2"
                                            />
                                            Prime Bus
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.womenOnly}
                                                onChange={(e) => updateFormData('womenOnly', e.target.checked)}
                                                className="mr-2"
                                            />
                                            Women Only
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.accessible}
                                                onChange={(e) => updateFormData('accessible', e.target.checked)}
                                                className="mr-2"
                                            />
                                            Wheelchair Accessible
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Routes & Timing Tab */}
                        {ui.activeTab === 'route' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold border-b pb-2">Routes & Timing Information</h2>

                                {/* Route Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">From City</label>
                                        <input
                                            type="text"
                                            placeholder="Starting city"
                                            value={formData.fromCity || ''}
                                            onChange={(e) => updateFormData('fromCity', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">To City</label>
                                        <input
                                            type="text"
                                            placeholder="Destination city"
                                            value={formData.toCity || ''}
                                            onChange={(e) => updateFormData('toCity', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                                        <input
                                            type="text"
                                            placeholder="Total distance"
                                            value={formData.distance || ''}
                                            onChange={(e) => updateFormData('distance', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                                        <input
                                            type="time"
                                            value={formData.departureTime ? convertTo24Hour(formData.departureTime) : ''}
                                            onChange={(e) => {
                                                const timeValue = e.target.value;
                                                console.log('🕐 Departure Time Input (24h):', timeValue);
                                                if (timeValue && timeValue.includes(':')) {
                                                    const [hours, minutes] = timeValue.split(':');
                                                    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                                                    console.log('🕐 Converting to 12h format:', formattedTime);
                                                    updateFormData('departureTime', formattedTime);
                                                } else {
                                                    updateFormData('departureTime', timeValue);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                            step="60"
                                        />
                                        <p className="text-xs text-blue-600 mt-1">Will be saved as: {formData.departureTime || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                                        <input
                                            type="time"
                                            value={formData.arrivalTime ? convertTo24Hour(formData.arrivalTime) : ''}
                                            onChange={(e) => {
                                                const timeValue = e.target.value;
                                                console.log('🕐 Arrival Time Input (24h):', timeValue);
                                                if (timeValue && timeValue.includes(':')) {
                                                    const [hours, minutes] = timeValue.split(':');
                                                    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                                                    console.log('🕐 Converting to 12h format:', formattedTime);
                                                    updateFormData('arrivalTime', formattedTime);
                                                } else {
                                                    updateFormData('arrivalTime', timeValue);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                            step="60"
                                        />
                                        <p className="text-xs text-blue-600 mt-1">Will be saved as: {formData.arrivalTime || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Auto-calculated)</label>
                                        <input
                                            type="text"
                                            value={formData.duration || 'Enter times to calculate'}
                                            readOnly
                                            className="w-full px-3 py-2 border rounded-md bg-green-50 cursor-not-allowed font-medium text-green-700"
                                            title="Automatically calculated from departure and arrival times"
                                        />
                                        <p className="text-xs text-green-600 mt-1">Calculated automatically</p>
                                    </div>
                                </div>

                                {/* Time Display Section */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h3 className="font-semibold text-blue-800 mb-2">⏰ Time Summary (12-Hour Format)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="text-center">
                                            <div className="font-medium text-blue-700">Departure Time</div>
                                            <div className="text-lg text-blue-600 font-bold">
                                                {formData.departureTime || '--:-- --'}
                                            </div>
                                            <div className="text-xs text-blue-500">12-hour format</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium text-green-700">Arrival Time</div>
                                            <div className="text-lg text-green-600 font-bold">
                                                {formData.arrivalTime || '--:-- --'}
                                            </div>
                                            <div className="text-xs text-green-500">12-hour format</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium text-purple-700">Duration</div>
                                            <div className="text-lg text-purple-600 font-bold">
                                                {formData.duration || 'Not calculated'}
                                            </div>
                                            <div className="text-xs text-purple-500">Travel time</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Add Main Routes */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-blue-700">Main Route Cities *</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add main route city (Delhi, Mumbai, etc.)"
                                            value={currentInputs.route || ''}
                                            onChange={(e) => updateCurrentInputs('route', e.target.value)}
                                            className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddItem(currentInputs.route, 'routes', 'route');
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem(currentInputs.route, 'routes', 'route')}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" /> Add
                                        </button>
                                    </div>
                                    {listData.routes && listData.routes.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {listData.routes.map((route, index) => (
                                                <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                    🏙️ {route}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index, 'routes')}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-blue-600">Total Routes: {listData.routes ? listData.routes.length : 0}</p>
                                </div>

                                {/* Add Stop Routes */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-green-700">Intermediate Stops</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add intermediate stop (Gurgaon, Mathura, etc.)"
                                            value={currentInputs.stopRoute || ''}
                                            onChange={(e) => updateCurrentInputs('stopRoute', e.target.value)}
                                            className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddItem(currentInputs.stopRoute, 'stopRoutes', 'stopRoute');
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem(currentInputs.stopRoute, 'stopRoutes', 'stopRoute')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" /> Add Stop
                                        </button>
                                    </div>
                                    {listData.stopRoutes && listData.stopRoutes.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {listData.stopRoutes.map((stopRoute, index) => (
                                                <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                                    📍 {stopRoute}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index, 'stopRoutes')}
                                                        className="text-green-600 hover:text-green-800 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-green-600">Total Stops: {listData.stopRoutes ? listData.stopRoutes.length : 0}</p>
                                </div>

                                {/* Quick Add Common Routes */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Quick Add Common Routes</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                        {[
                                            'Delhi', 'Mumbai', 'Pune', 'Bangalore', 'Chennai', 'Hyderabad',
                                            'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Agra',
                                            'Surat', 'Indore', 'Bhopal', 'Vadodara', 'Coimbatore', 'Kochi'
                                        ].map((city) => (
                                            <button
                                                key={city}
                                                type="button"
                                                onClick={() => {
                                                    if (!listData.routes || !listData.routes.includes(city)) {
                                                        handleAddItem(city, 'routes', 'route');
                                                    }
                                                }}
                                                className={`px-3 py-2 rounded-md text-sm transition-colors ${listData.routes && listData.routes.includes(city)
                                                        ? 'bg-blue-200 text-blue-800 cursor-not-allowed'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                disabled={listData.routes && listData.routes.includes(city)}
                                            >
                                                {listData.routes && listData.routes.includes(city) ? '✓' : '+'} {city}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Add Common Stop Routes */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Quick Add Common Stops</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                        {[
                                            'Gurgaon', 'Faridabad', 'Mathura', 'Bharatpur', 'Dausa', 'Alwar',
                                            'Rewari', 'Panipat', 'Karnal', 'Ambala', 'Chandigarh', 'Ludhiana',
                                            'Noida', 'Ghaziabad', 'Meerut', 'Moradabad', 'Bareilly', 'Aligarh'
                                        ].map((stop) => (
                                            <button
                                                key={stop}
                                                type="button"
                                                onClick={() => {
                                                    if (!listData.stopRoutes || !listData.stopRoutes.includes(stop)) {
                                                        handleAddItem(stop, 'stopRoutes', 'stopRoute');
                                                    }
                                                }}
                                                className={`px-3 py-2 rounded-md text-sm transition-colors ${listData.stopRoutes && listData.stopRoutes.includes(stop)
                                                        ? 'bg-green-200 text-green-800 cursor-not-allowed'
                                                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                    }`}
                                                disabled={listData.stopRoutes && listData.stopRoutes.includes(stop)}
                                            >
                                                {listData.stopRoutes && listData.stopRoutes.includes(stop) ? '✓' : '📍'} {stop}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Route Summary */}
                                <div className="bg-gray-50 p-4 rounded-lg border">
                                    <h3 className="font-semibold text-gray-800 mb-3">📊 Route Summary</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <div className="font-medium text-blue-700">Main Routes</div>
                                            <div className="text-blue-600">
                                                {listData.routes && listData.routes.length > 0
                                                    ? listData.routes.join(' → ')
                                                    : 'No routes added'
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-green-700">Intermediate Stops</div>
                                            <div className="text-green-600">
                                                {listData.stopRoutes && listData.stopRoutes.length > 0
                                                    ? `${listData.stopRoutes.length} stops`
                                                    : 'No stops added'
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-purple-700">Journey Info</div>
                                            <div className="text-purple-600">
                                                {formData.distance ? `${formData.distance} km` : 'Distance not set'}
                                                {formData.duration ? ` • ${formData.duration}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Time Format Note */}
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <h3 className="font-semibold text-yellow-800 mb-2">📋 Time Format Information</h3>
                                    <div className="text-sm text-yellow-700 space-y-1">
                                        <p>✅ All times are automatically converted to 12-hour format (AM/PM)</p>
                                        <p>✅ Database will store times like: "9:30 AM", "6:45 PM"</p>
                                        <p>✅ Duration is calculated automatically between departure and arrival times</p>
                                        <p>⚠️ If arrival time is earlier than departure, it assumes next day arrival</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Features & Amenities Tab */}
                        {ui.activeTab === 'features' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold border-b pb-2">Features & Amenities</h2>

                                {/* Add Features */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Bus Features</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add feature (e.g., WiFi, Charging Point)"
                                            value={currentInputs.feature}
                                            onChange={(e) => updateCurrentInputs('feature', e.target.value)}
                                            className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem(currentInputs.feature, 'features', 'feature')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Add
                                        </button>
                                    </div>
                                    {listData.features.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {listData.features.map((feature, index) => (
                                                <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                                    {feature}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index, 'features')}
                                                        className="text-green-600 hover:text-green-800"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Add Amenities */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Amenities</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add amenity (e.g., Water Bottle, Blanket)"
                                            value={currentInputs.amenity}
                                            onChange={(e) => updateCurrentInputs('amenity', e.target.value)}
                                            className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem(currentInputs.amenity, 'amenities', 'amenity')}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Add
                                        </button>
                                    </div>
                                    {listData.amenities.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {listData.amenities.map((amenity, index) => (
                                                <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                                    {amenity}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index, 'amenities')}
                                                        className="text-purple-600 hover:text-purple-800"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Quick Add Buttons */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Quick Add Common Features</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {['WiFi', 'Charging Point', 'Reading Light', 'Blanket', 'Water Bottle', 'Pillow', 'Air Conditioning', 'Entertainment System'].map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => handleAddItem(item, 'features', 'feature')}
                                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                                            >
                                                + {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Operator Details Tab */}
                        {ui.activeTab === 'operator' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold border-b pb-2">Operator Details</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="Operator phone"
                                            value={formData.operatorPhone}
                                            onChange={(e) => updateFormData('operatorPhone', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="Operator email"
                                            value={formData.operatorEmail}
                                            onChange={(e) => updateFormData('operatorEmail', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Operator Rating</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="5"
                                            step="0.1"
                                            placeholder="1-5"
                                            value={formData.operatorRating}
                                            onChange={(e) => updateFormData('operatorRating', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Trips</label>
                                        <input
                                            type="number"
                                            placeholder="Total trips completed"
                                            value={formData.totalTrips}
                                            onChange={(e) => updateFormData('totalTrips', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                                        <textarea
                                            placeholder="Years of experience, awards, certifications etc."
                                            value={formData.experience}
                                            onChange={(e) => updateFormData('experience', e.target.value)}
                                            rows="3"
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Boarding/Dropping Points Tab */}
                        {ui.activeTab === 'points' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold border-b pb-2">Boarding & Dropping Points</h2>

                                {/* Boarding Points */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-green-700">Boarding Points</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Point name"
                                            value={currentInputs.boardingPoint.name}
                                            onChange={(e) => updateCurrentInputs('boardingPoint', { ...currentInputs.boardingPoint, name: e.target.value })}
                                            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Address"
                                            value={currentInputs.boardingPoint.address}
                                            onChange={(e) => updateCurrentInputs('boardingPoint', { ...currentInputs.boardingPoint, address: e.target.value })}
                                            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="time"
                                            value={currentInputs.boardingPoint.time ? convertTo24Hour(currentInputs.boardingPoint.time) : ''}
                                            onChange={(e) => updateCurrentInputs('boardingPoint', { ...currentInputs.boardingPoint, time: e.target.value })}
                                            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                            title="Time will be converted to 12-hour format"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Landmark"
                                            value={currentInputs.boardingPoint.landmark}
                                            onChange={(e) => updateCurrentInputs('boardingPoint', { ...currentInputs.boardingPoint, landmark: e.target.value })}
                                            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex gap-1">
                                            <input
                                                type="tel"
                                                placeholder="Contact"
                                                value={currentInputs.boardingPoint.contactNumber}
                                                onChange={(e) => updateCurrentInputs('boardingPoint', { ...currentInputs.boardingPoint, contactNumber: e.target.value })}
                                                className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleAddPoint('boardingPoint')}
                                                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {listData.boardingPoints.length > 0 && (
                                        <div className="space-y-2">
                                            {listData.boardingPoints.map((point, index) => (
                                                <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-green-800">{point.name}</h4>
                                                            <p className="text-sm text-green-600">{point.address}</p>
                                                            <div className="text-xs text-green-500 mt-1">
                                                                Time: {point.time} | Landmark: {point.landmark} | Contact: {point.contactNumber}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePoint(index, 'boardingPoint')}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Dropping Points */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-red-700">Dropping Points</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Point name"
                                            value={currentInputs.droppingPoint.name}
                                            onChange={(e) => updateCurrentInputs('droppingPoint', { ...currentInputs.droppingPoint, name: e.target.value })}
                                            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Address"
                                            value={currentInputs.droppingPoint.address}
                                            onChange={(e) => updateCurrentInputs('droppingPoint', { ...currentInputs.droppingPoint, address: e.target.value })}
                                            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="time"
                                            value={currentInputs.droppingPoint.time ? convertTo24Hour(currentInputs.droppingPoint.time) : ''}
                                            onChange={(e) => updateCurrentInputs('droppingPoint', { ...currentInputs.droppingPoint, time: e.target.value })}
                                            className="px-3 py-2 border rounded-md focus:ring-2 form:ring-blue-500"
                                            title="Time will be converted to 12-hour format"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Landmark"
                                            value={currentInputs.droppingPoint.landmark}
                                            onChange={(e) => updateCurrentInputs('droppingPoint', { ...currentInputs.droppingPoint, landmark: e.target.value })}
                                            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex gap-1">
                                            <input
                                                type="tel"
                                                placeholder="Contact"
                                                value={currentInputs.droppingPoint.contactNumber}
                                                onChange={(e) => updateCurrentInputs('droppingPoint', { ...currentInputs.droppingPoint, contactNumber: e.target.value })}
                                                className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleAddPoint('droppingPoint')}
                                                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {listData.droppingPoints.length > 0 && (
                                        <div className="space-y-2">
                                            {listData.droppingPoints.map((point, index) => (
                                                <div key={index} className="bg-red-50 p-3 rounded-lg border border-red-200">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-red-800">{point.name}</h4>
                                                            <p className="text-sm text-red-600">{point.address}</p>
                                                            <div className="text-xs text-red-500 mt-1">
                                                                Time: {point.time} | Landmark: {point.landmark} | Contact: {point.contactNumber}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePoint(index, 'droppingPoint')}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Seat Configuration Tab */}
                        {ui.activeTab === 'seats' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold border-b pb-2">Seat Configuration</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Lower Deck Rows</label>
                                        <input
                                            type="number"
                                            min="5"
                                            max="20"
                                            value={formData.lowerDeckRows}
                                            onChange={(e) => updateFormData('lowerDeckRows', Number(e.target.value))}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Seats: {formData.lowerDeckRows * 3}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Upper Deck Rows</label>
                                        <input
                                            type="number"
                                            min="5"
                                            max="20"
                                            value={formData.upperDeckRows}
                                            onChange={(e) => updateFormData('upperDeckRows', Number(e.target.value))}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Seats: {formData.upperDeckRows * 3}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Lower Deck Price (₹)</label>
                                        <input
                                            type="number"
                                            placeholder="Lower deck seat price"
                                            value={formData.lowerDeckPrice}
                                            onChange={(e) => updateFormData('lowerDeckPrice', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Upper Deck Price (₹)</label>
                                        <input
                                            type="number"
                                            placeholder="Upper deck seat price"
                                            value={formData.upperDeckPrice}
                                            onChange={(e) => updateFormData('upperDeckPrice', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ladies Price (₹)</label>
                                        <input
                                            type="number"
                                            placeholder="Ladies seat price"
                                            value={formData.ladiesPrice}
                                            onChange={(e) => updateFormData('ladiesPrice', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reserved Price (₹)</label>
                                        <input
                                            type="number"
                                            placeholder="Reserved seat price"
                                            value={formData.reservedPrice}
                                            onChange={(e) => updateFormData('reservedPrice', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h3 className="font-semibold text-blue-800 mb-2">Seat Layout Summary</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="text-center">
                                            <div className="font-medium">Total Seats</div>
                                            <div className="text-lg text-blue-600">{(formData.lowerDeckRows + formData.upperDeckRows) * 3}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium">Lower Deck</div>
                                            <div className="text-lg text-green-600">{formData.lowerDeckRows * 3}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium">Upper Deck</div>
                                            <div className="text-lg text-purple-600">{formData.upperDeckRows * 3}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium">Layout</div>
                                            <div className="text-lg text-indigo-600">2+1</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Policies Tab */}
                        {ui.activeTab === 'policies' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold border-b pb-2">Cancellation Policies</h2>

                                {/* Cancellation Policies */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-red-700">Cancellation Policies</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add cancellation policy"
                                            value={currentInputs.cancellationPolicy}
                                            onChange={(e) => updateCurrentInputs('cancellationPolicy', e.target.value)}
                                            className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem(currentInputs.cancellationPolicy, 'cancellationPolicies', 'cancellationPolicy')}
                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Add
                                        </button>
                                    </div>
                                    {listData.cancellationPolicies.length > 0 && (
                                        <div className="space-y-2">
                                            {listData.cancellationPolicies.map((policy, index) => (
                                                <div key={index} className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-200">
                                                    <span className="text-red-800">{policy}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index, 'cancellationPolicies')}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Partial Cancellation Policies */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-orange-700">Partial Cancellation Policies</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add partial cancellation policy"
                                            value={currentInputs.partialCancellationPolicy}
                                            onChange={(e) => updateCurrentInputs('partialCancellationPolicy', e.target.value)}
                                            className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem(currentInputs.partialCancellationPolicy, 'partialCancellationPolicies', 'partialCancellationPolicy')}
                                            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Add
                                        </button>
                                    </div>
                                    {listData.partialCancellationPolicies.length > 0 && (
                                        <div className="space-y-2">
                                            {listData.partialCancellationPolicies.map((policy, index) => (
                                                <div key={index} className="flex items-center justify-between bg-orange-50 p-3 rounded-lg border border-orange-200">
                                                    <span className="text-orange-800">{policy}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index, 'partialCancellationPolicies')}
                                                        className="text-orange-600 hover:text-orange-800"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Quick Add Common Policies */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Quick Add Common Policies</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {[
                                            'Free cancellation up to 24 hours before departure',
                                            '50% refund between 12-24 hours',
                                            '25% refund between 2-12 hours',
                                            'No refund within 2 hours of departure',
                                            'Partial cancellation allowed up to 2 hours before departure',
                                            'Cancellation charges: ₹50 per seat'
                                        ].map((policy) => (
                                            <button
                                                key={policy}
                                                type="button"
                                                onClick={() => handleAddItem(policy, policy.includes('Partial') ? 'partialCancellationPolicies' : 'cancellationPolicies', policy.includes('Partial') ? 'partialCancellationPolicy' : 'cancellationPolicy')}
                                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm text-left"
                                            >
                                                + {policy}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* My Buses Tab */}
                        {ui.activeTab === 'data' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold">My Buses ({data.busesData.length})</h2>
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search buses..."
                                                value={ui.searchTerm}
                                                onChange={(e) => updateUi('searchTerm', e.target.value)}
                                                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {ui.dataLoading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-gray-600 mt-2">Loading buses...</p>
                                    </div>
                                ) : filteredBuses.length === 0 ? (
                                    <div className="text-center py-8">
                                        <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600">No buses found. Add your first bus!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredBuses.map((bus) => (
                                            <div key={bus.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{bus.type}</h3>
                                                        <p className="text-gray-600 text-sm">{bus.busNumber}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => loadBusForEdit(bus)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Edit Bus"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteBus(bus)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                            title="Delete Bus"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Route:</span>
                                                        <span className="font-medium">{bus.route?.from} → {bus.route?.to}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Price:</span>
                                                        <span className="font-medium text-green-600">₹{bus.price}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Timing:</span>
                                                        <span className="font-medium text-blue-600">{bus.departureTime} - {bus.arrivalTime}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Duration:</span>
                                                        <span className="font-medium text-purple-600">{bus.duration}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Seats:</span>
                                                        <span className="font-medium">{bus.totalSeats}</span>
                                                    </div>
                                                    {bus.rating > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Rating:</span>
                                                            <span className="font-medium flex items-center gap-1">
                                                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                                                {bus.rating}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {bus.stopRoutes && bus.stopRoutes.length > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Stops:</span>
                                                            <span className="font-medium text-green-600">{bus.stopRoutes.length}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {(bus.isPrime || bus.womenOnly || bus.accessible) && (
                                                    <div className="mt-3 flex flex-wrap gap-1">
                                                        {bus.isPrime && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Prime</span>}
                                                        {bus.womenOnly && <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded">Women Only</span>}
                                                        {bus.accessible && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Accessible</span>}
                                                    </div>
                                                )}

                                                {/* Show routes and stop routes */}
                                                {bus.routes && bus.routes.length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-xs text-gray-500 mb-1">Main Routes:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {bus.routes.slice(0, 3).map((route, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">{route}</span>
                                                            ))}
                                                            {bus.routes.length > 3 && <span className="text-xs text-gray-500">+{bus.routes.length - 3} more</span>}
                                                        </div>
                                                    </div>
                                                )}

                                                {bus.stopRoutes && bus.stopRoutes.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-gray-500 mb-1">Stops:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {bus.stopRoutes.slice(0, 3).map((stop, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">📍 {stop}</span>
                                                            ))}
                                                            {bus.stopRoutes.length > 3 && <span className="text-xs text-gray-500">+{bus.stopRoutes.length - 3} more</span>}
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submit Button */}
                        {ui.activeTab !== 'data' && (
                            <div className="mt-8 pt-6 border-t">
                                <div className="flex justify-between items-center">
                                    <button
                                        type="submit"
                                        disabled={ui.loading}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-medium flex items-center gap-2"
                                    >
                                        {ui.loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                {ui.editingBus ? 'Updating...' : 'Adding...'}
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                {ui.editingBus ? 'Update Bus' : 'Add Bus'}
                                            </>
                                        )}
                                    </button>
                                </div>
                                {ui.message && (
                                    <div className={`mt-4 p-4 rounded-lg ${ui.message.includes('✅') ? 'bg-green-50 text-green-800' : ui.message.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                                        {ui.message.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                    </div>
                                )}
                            </div>
                        )}
                    </form>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t">
                        <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>Updated: {new Date().toLocaleString()}</span>
                            <span className="text-blue-600 font-medium">🕐 All times saved in 12-hour format (AM/PM)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperatorBusManagement;
