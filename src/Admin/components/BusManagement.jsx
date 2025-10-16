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
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const BusManagement = () => {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOperator, setFilterOperator] = useState('all');
  const [selectedBus, setSelectedBus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // view, edit, delete
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0,
    totalSeats: 0,
    avgPrice: 0
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
    filterBuses();
  }, [buses, searchTerm, filterStatus, filterOperator]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch buses
      const busesSnapshot = await getDocs(collection(db, 'buses'));
      const busesList = [];
      
      busesSnapshot.forEach((doc) => {
        busesList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by creation date (newest first)
      busesList.sort((a, b) => {
        const aDate = a.createdAt?.toDate() || new Date(0);
        const bDate = b.createdAt?.toDate() || new Date(0);
        return bDate - aDate;
      });

      setBuses(busesList);

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

      calculateStats(busesList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (busesList) => {
    const stats = {
      total: busesList.length,
      active: busesList.filter(bus => bus.status === 'active').length,
      inactive: busesList.filter(bus => bus.status === 'inactive').length,
      maintenance: busesList.filter(bus => bus.status === 'maintenance').length,
      totalSeats: busesList.reduce((total, bus) => total + (bus.totalSeats || 0), 0),
      avgPrice: busesList.length > 0 
        ? Math.round(busesList.reduce((total, bus) => total + (bus.basePrice || 0), 0) / busesList.length)
        : 0
    };
    setStats(stats);
  };

  const filterBuses = () => {
    let filtered = buses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(bus =>
        bus.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.busName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.route?.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.route?.to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.operatorName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(bus => bus.status === filterStatus);
    }

    // Operator filter
    if (filterOperator !== 'all') {
      filtered = filtered.filter(bus => bus.operatorId === filterOperator);
    }

    setFilteredBuses(filtered);
  };

  const handleStatusUpdate = async (busId, newStatus) => {
    try {
      await updateDoc(doc(db, 'buses', busId), {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: JSON.parse(localStorage.getItem('adminData')).name
      });

      // Log the action
      await addDoc(collection(db, 'adminLogs'), {
        adminId: JSON.parse(localStorage.getItem('adminData')).uid,
        action: 'BUS_STATUS_UPDATE',
        busId: busId,
        newStatus: newStatus,
        timestamp: serverTimestamp()
      });

      fetchData();
      setShowModal(false);
      alert(`Bus status updated to ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating bus status:', error);
      alert('Error updating bus status');
    }
  };

  const handleDelete = async (busId) => {
    if (!window.confirm('Are you sure you want to delete this bus? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'buses', busId));
      
      // Log the action
      await addDoc(collection(db, 'adminLogs'), {
        adminId: JSON.parse(localStorage.getItem('adminData')).uid,
        action: 'BUS_DELETE',
        busId: busId,
        timestamp: serverTimestamp()
      });

      fetchData();
      setShowModal(false);
      alert('Bus deleted successfully!');
    } catch (error) {
      console.error('Error deleting bus:', error);
      alert('Error deleting bus');
    }
  };

  const openModal = (bus, type) => {
    setSelectedBus(bus);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBus(null);
    setModalType('view');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <div className="text-white text-xl">Loading Buses...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <TruckIcon className="w-8 h-8 mr-3 text-red-400" />
            Bus Management
          </h1>
          <p className="text-gray-300">
            Manage and monitor all buses on the platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Buses"
            value={stats.total}
            icon={TruckIcon}
            color="blue"
            subtitle="All registered buses"
          />
          <StatCard
            title="Active Buses"
            value={stats.active}
            icon={CheckCircleIcon}
            color="green"
            subtitle={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
          />
          <StatCard
            title="In Maintenance"
            value={stats.maintenance}
            icon={AdjustmentsHorizontalIcon}
            color="yellow"
            subtitle="Under maintenance"
          />
          <StatCard
            title="Total Seats"
            value={stats.totalSeats}
            icon={UserGroupIcon}
            color="purple"
            subtitle="Across all buses"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="Inactive Buses"
            value={stats.inactive}
            icon={XCircleIcon}
            color="red"
            subtitle="Not in service"
          />
          <StatCard
            title="Average Price"
            value={`₹${stats.avgPrice}`}
            icon={CurrencyRupeeIcon}
            color="blue"
            subtitle="Per seat base price"
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
                placeholder="Search buses, routes, operators..."
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>

              <select
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Operators</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.name || operator.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Buses Table */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-red-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600/20 border-b border-red-500/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Bus Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Seats & Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredBuses.length > 0 ? (
                  filteredBuses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-red-600/20 flex items-center justify-center">
                              <TruckIcon className="h-6 w-6 text-red-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {bus.busNumber || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {bus.busName || bus.busType || 'Bus'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {bus.route?.from || 'N/A'} → {bus.route?.to || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {bus.departureTime || 'N/A'} - {bus.arrivalTime || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{bus.operatorName || 'N/A'}</div>
                        <div className="text-sm text-gray-400">
                          {operators.find(op => op.id === bus.operatorId)?.companyName || 'Company'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{bus.totalSeats || 0} seats</div>
                        <div className="text-sm text-gray-400">₹{bus.basePrice || 0}/seat</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bus.status)}`}>
                          {bus.status?.charAt(0).toUpperCase() + bus.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(bus, 'view')}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openModal(bus, 'edit')}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Edit Status"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openModal(bus, 'delete')}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Bus"
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
                        <TruckIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No buses found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedBus && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {modalType === 'view' && 'Bus Details'}
                  {modalType === 'edit' && 'Edit Bus Status'}
                  {modalType === 'delete' && 'Delete Bus'}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Bus Number</label>
                      <p className="text-white">{selectedBus.busNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Bus Name</label>
                      <p className="text-white">{selectedBus.busName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Bus Type</label>
                      <p className="text-white">{selectedBus.busType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Total Seats</label>
                      <p className="text-white">{selectedBus.totalSeats || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Base Price</label>
                      <p className="text-white">₹{selectedBus.basePrice || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBus.status)}`}>
                        {selectedBus.status?.charAt(0).toUpperCase() + selectedBus.status?.slice(1) || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Route From</label>
                      <p className="text-white">{selectedBus.route?.from || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Route To</label>
                      <p className="text-white">{selectedBus.route?.to || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Departure Time</label>
                      <p className="text-white">{selectedBus.departureTime || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Arrival Time</label>
                      <p className="text-white">{selectedBus.arrivalTime || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Operator</label>
                      <p className="text-white">{selectedBus.operatorName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Registration Date</label>
                      <p className="text-white">
                        {selectedBus.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {selectedBus.amenities && selectedBus.amenities.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Amenities</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedBus.amenities.map((amenity, index) => (
                          <span key={index} className="px-3 py-1 bg-red-600/20 text-red-200 text-sm rounded-full">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalType === 'edit' && (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Change the status of bus: <span className="text-white font-medium">{selectedBus.busNumber}</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleStatusUpdate(selectedBus.id, 'active')}
                      className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedBus.id, 'maintenance')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Set Maintenance
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedBus.id, 'inactive')}
                      className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
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
                      This action cannot be undone. All data associated with this bus will be permanently deleted.
                    </p>
                  </div>
                  <p className="text-gray-300">
                    Are you sure you want to delete bus: <span className="text-white font-medium">{selectedBus.busNumber}</span>?
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleDelete(selectedBus.id)}
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

export default BusManagement;
