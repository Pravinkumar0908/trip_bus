import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  MapPinIcon,
  ArrowRightIcon,
  CurrencyRupeeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  MapIcon,
  ClockIcon,
  StarIcon,
  WifiIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOperator, setFilterOperator] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // view, edit, delete
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalSeats: 0,
    avgDistance: 0,
    avgPrice: 0,
    primeRoutes: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      navigate('/admin-login');
      return;
    }

    fetchData();
  }, [navigate]);

  useEffect(() => {
    filterRoutes();
  }, [routes, searchTerm, filterOperator, filterType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch buses (which contain route information)
      const busesSnapshot = await getDocs(collection(db, 'buses'));
      const routesList = [];
      
      busesSnapshot.forEach((doc) => {
        routesList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by creation date (newest first)
      routesList.sort((a, b) => {
        const aDate = a.createdAt?.toDate() || new Date(0);
        const bDate = b.createdAt?.toDate() || new Date(0);
        return bDate - aDate;
      });

      setRoutes(routesList);

      // Fetch operators for filter
      const operatorsSnapshot = await getDocs(collection(db, 'operators'));
      const operatorsList = [];
      operatorsSnapshot.forEach((doc) => {
        operatorsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setOperators(operatorsList);

      calculateStats(routesList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (routesList) => {
    const stats = {
      total: routesList.length,
      active: routesList.filter(route => route.isActive === true).length,
      inactive: routesList.filter(route => route.isActive === false).length,
      totalSeats: routesList.reduce((total, route) => total + (route.totalSeats || 0), 0),
      avgDistance: routesList.length > 0 
        ? Math.round(routesList.reduce((total, route) => total + (parseInt(route.route?.distance) || 0), 0) / routesList.length)
        : 0,
      avgPrice: routesList.length > 0 
        ? Math.round(routesList.reduce((total, route) => total + (route.price || 0), 0) / routesList.length)
        : 0,
      primeRoutes: routesList.filter(route => route.isPrime === true).length
    };

    setStats(stats);
  };

  const filterRoutes = () => {
    let filtered = routes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(route =>
        route.route?.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.route?.to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.operator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.operatorDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Operator filter
    if (filterOperator !== 'all') {
      filtered = filtered.filter(route => route.operatorId === filterOperator);
    }

    // Type filter
    if (filterType !== 'all') {
      if (filterType === 'active') {
        filtered = filtered.filter(route => route.isActive === true);
      } else if (filterType === 'inactive') {
        filtered = filtered.filter(route => route.isActive === false);
      } else if (filterType === 'prime') {
        filtered = filtered.filter(route => route.isPrime === true);
      } else if (filterType === 'women_only') {
        filtered = filtered.filter(route => route.womenOnly === true);
      }
    }

    setFilteredRoutes(filtered);
  };

  const handleStatusUpdate = async (routeId, newStatus) => {
    try {
      const updateData = {
        updatedAt: new Date(),
        updatedBy: JSON.parse(localStorage.getItem('adminData')).name
      };

      if (newStatus === 'active') {
        updateData.isActive = true;
      } else if (newStatus === 'inactive') {
        updateData.isActive = false;
      }

      await updateDoc(doc(db, 'buses', routeId), updateData);

      // Log the action
      await addDoc(collection(db, 'adminLogs'), {
        adminId: JSON.parse(localStorage.getItem('adminData')).uid,
        action: 'ROUTE_STATUS_UPDATE',
        routeId: routeId,
        newStatus: newStatus,
        timestamp: serverTimestamp()
      });

      fetchData();
      setShowModal(false);
      alert(`Route status updated to ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating route status:', error);
      alert('Error updating route status');
    }
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'buses', routeId));
      
      // Log the action
      await addDoc(collection(db, 'adminLogs'), {
        adminId: JSON.parse(localStorage.getItem('adminData')).uid,
        action: 'ROUTE_DELETE',
        routeId: routeId,
        timestamp: serverTimestamp()
      });

      fetchData();
      setShowModal(false);
      alert('Route deleted successfully!');
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Error deleting route');
    }
  };

  const openModal = (route, type) => {
    setSelectedRoute(route);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRoute(null);
    setModalType('view');
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 hover:border-red-500/40 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-600 bg-opacity-20`}>
          <Icon className={`w-8 h-8 text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full flex items-center justify-center">
        <div className="text-white text-xl">Loading Routes...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <MapIcon className="w-8 h-8 mr-3 text-red-400" />
            Route Management
          </h1>
          <p className="text-gray-300">
            Manage and monitor all bus routes on the platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Routes"
            value={stats.total}
            icon={MapIcon}
            color="blue"
            subtitle="All registered routes"
          />
          <StatCard
            title="Active Routes"
            value={stats.active}
            icon={CheckCircleIcon}
            color="green"
            subtitle={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
          />
          <StatCard
            title="Inactive Routes"
            value={stats.inactive}
            icon={XCircleIcon}
            color="red"
            subtitle="Not in service"
          />
          <StatCard
            title="Prime Routes"
            value={stats.primeRoutes}
            icon={StarIcon}
            color="yellow"
            subtitle="Premium services"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Seats"
            value={stats.totalSeats.toLocaleString()}
            icon={UserGroupIcon}
            color="purple"
            subtitle="Across all routes"
          />
          <StatCard
            title="Average Distance"
            value={`${stats.avgDistance} km`}
            icon={MapPinIcon}
            color="indigo"
            subtitle="Per route"
          />
          <StatCard
            title="Average Price"
            value={`₹${stats.avgPrice}`}
            icon={CurrencyRupeeIcon}
            color="blue"
            subtitle="Base fare per route"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Search routes, cities, operators, bus numbers..."
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Operators</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.fullName || operator.businessName || 'Unknown'}
                  </option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Types</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prime">Prime Routes</option>
                <option value="women_only">Women Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Routes Table */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-red-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600/20 border-b border-red-500/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Route Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Bus Information
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Pricing & Seats
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Status & Features
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-red-600/20 flex items-center justify-center">
                              <MapPinIcon className="h-6 w-6 text-red-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white flex items-center">
                              {route.route?.from || 'N/A'}
                              <ArrowRightIcon className="h-4 w-4 mx-2 text-gray-400" />
                              {route.route?.to || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {route.route?.distance || 'N/A'} km • {route.duration || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {route.departureTime || 'N/A'} - {route.arrivalTime || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{route.busNumber || 'N/A'}</div>
                        <div className="text-sm text-gray-400">{route.type || 'N/A'}</div>
                        <div className="text-sm text-gray-400">
                          {route.availableSeats || 0}/{route.totalSeats || 0} seats
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{route.operator || route.operatorDetails?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-400">
                          {route.operatorDetails?.phone || 'N/A'}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <StarIcon className="w-3 h-3 mr-1 text-yellow-400" />
                          {route.rating || 0} ({route.reviews || 0} reviews)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">₹{route.price || 0}</div>
                        {route.discount && (
                          <div className="text-sm text-green-400">{route.discount}</div>
                        )}
                        <div className="text-sm text-gray-400">{route.totalSeats || 0} total seats</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(route.isActive)}`}>
                            {getStatusText(route.isActive)}
                          </span>
                          <div className="flex items-center space-x-1">
                            {route.isPrime && (
                              <span className="inline-flex px-1 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                                Prime
                              </span>
                            )}
                            {route.womenOnly && (
                              <span className="inline-flex px-1 py-0.5 text-xs bg-pink-100 text-pink-800 rounded">
                                Women Only
                              </span>
                            )}
                            {route.features?.includes('wifi') && (
                              <WifiIcon className="w-3 h-3 text-blue-400" title="WiFi Available" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(route, 'view')}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openModal(route, 'edit')}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Edit Status"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openModal(route, 'delete')}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Route"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <MapIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No routes found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedRoute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {modalType === 'view' && 'Route Details'}
                  {modalType === 'edit' && 'Edit Route Status'}
                  {modalType === 'delete' && 'Delete Route'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {modalType === 'view' && (
                <div className="space-y-6">
                  {/* Route Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Route Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">From</label>
                        <p className="text-white">{selectedRoute.route?.from || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">To</label>
                        <p className="text-white">{selectedRoute.route?.to || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Distance</label>
                        <p className="text-white">{selectedRoute.route?.distance || 'N/A'} km</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Duration</label>
                        <p className="text-white">{selectedRoute.duration || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Departure Time</label>
                        <p className="text-white">{selectedRoute.departureTime || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Arrival Time</label>
                        <p className="text-white">{selectedRoute.arrivalTime || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bus Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Bus Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Bus Number</label>
                        <p className="text-white">{selectedRoute.busNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Bus Type</label>
                        <p className="text-white">{selectedRoute.type || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Total Seats</label>
                        <p className="text-white">{selectedRoute.totalSeats || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Available Seats</label>
                        <p className="text-white">{selectedRoute.availableSeats || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Operator Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Operator Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Operator Name</label>
                        <p className="text-white">{selectedRoute.operator || selectedRoute.operatorDetails?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Contact</label>
                        <p className="text-white">{selectedRoute.operatorDetails?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <p className="text-white">{selectedRoute.operatorDetails?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Rating</label>
                        <p className="text-white">{selectedRoute.rating || 0}/5 ({selectedRoute.reviews || 0} reviews)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Total Trips</label>
                        <p className="text-white">{selectedRoute.operatorDetails?.totalTrips || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Features */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Pricing & Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Price</label>
                        <p className="text-white">₹{selectedRoute.price || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Discount</label>
                        <p className="text-white">{selectedRoute.discount || 'No discount'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Prime Route</label>
                        <p className="text-white">{selectedRoute.isPrime ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Women Only</label>
                        <p className="text-white">{selectedRoute.womenOnly ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Amenities & Features */}
                  {selectedRoute.amenities && selectedRoute.amenities.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRoute.amenities.map((amenity, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-600/20 text-blue-200 text-sm rounded-full">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Boarding Points */}
                  {selectedRoute.boardingPoints && selectedRoute.boardingPoints.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Boarding Points</h4>
                      <div className="space-y-3">
                        {selectedRoute.boardingPoints.map((point, index) => (
                          <div key={index} className="border border-gray-600 rounded-lg p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              <div>
                                <span className="text-xs text-gray-400">Name:</span>
                                <p className="text-white text-sm">{point.name || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-400">Time:</span>
                                <p className="text-white text-sm">{point.time || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-400">Contact:</span>
                                <p className="text-white text-sm">{point.contactNumber || 'N/A'}</p>
                              </div>
                              <div className="md:col-span-2 lg:col-span-3">
                                <span className="text-xs text-gray-400">Address:</span>
                                <p className="text-white text-sm">{point.address || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dropping Points */}
                  {selectedRoute.droppingPoints && selectedRoute.droppingPoints.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Dropping Points</h4>
                      <div className="space-y-3">
                        {selectedRoute.droppingPoints.map((point, index) => (
                          <div key={index} className="border border-gray-600 rounded-lg p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              <div>
                                <span className="text-xs text-gray-400">Name:</span>
                                <p className="text-white text-sm">{point.name || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-400">Time:</span>
                                <p className="text-white text-sm">{point.time || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-400">Contact:</span>
                                <p className="text-white text-sm">{point.contactNumber || 'N/A'}</p>
                              </div>
                              <div className="md:col-span-2 lg:col-span-3">
                                <span className="text-xs text-gray-400">Address:</span>
                                <p className="text-white text-sm">{point.address || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Status Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRoute.isActive)}`}>
                          {getStatusText(selectedRoute.isActive)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Accessible</label>
                        <p className="text-white">{selectedRoute.accessible ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Created Date</label>
                        <p className="text-white">
                          {selectedRoute.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'edit' && (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Change the status of route: <span className="text-white font-medium">{selectedRoute.route?.from} → {selectedRoute.route?.to}</span>
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleStatusUpdate(selectedRoute.id, 'active')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedRoute.id, 'inactive')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Set Inactive
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'delete' && (
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-red-600/20 border border-red-600/30 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3" />
                    <p className="text-red-200">
                      This action cannot be undone. All data associated with this route will be permanently deleted.
                    </p>
                  </div>
                  <p className="text-gray-300">
                    Are you sure you want to delete route: <span className="text-white font-medium">{selectedRoute.route?.from} → {selectedRoute.route?.to}</span>?
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleDelete(selectedRoute.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Delete Permanently
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteManagement;
