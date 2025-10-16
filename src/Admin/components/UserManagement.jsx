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
  UserGroupIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  ClockIcon} from '@heroicons/react/24/outline';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, users, drivers
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // view, edit, delete
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    verifiedUsers: 0,
    activeDrivers: 0,
    inactiveDrivers: 0,
    totalCombined: 0
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
    filterData();
  }, [users, drivers, searchTerm, filterType, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = [];
      
      usersSnapshot.forEach((doc) => {
        usersList.push({
          id: doc.id,
          type: 'user',
          ...doc.data()
        });
      });

      // Fetch drivers
      const driversSnapshot = await getDocs(collection(db, 'drivers'));
      const driversList = [];
      
      driversSnapshot.forEach((doc) => {
        driversList.push({
          id: doc.id,
          type: 'driver',
          ...doc.data()
        });
      });

      // Sort by creation date (newest first)
      usersList.sort((a, b) => {
        const aDate = a.createdAt?.toDate() || new Date(0);
        const bDate = b.createdAt?.toDate() || new Date(0);
        return bDate - aDate;
      });

      driversList.sort((a, b) => {
        const aDate = a.createdAt?.toDate() || new Date(0);
        const bDate = b.createdAt?.toDate() || new Date(0);
        return bDate - aDate;
      });

      setUsers(usersList);
      setDrivers(driversList);
      calculateStats(usersList, driversList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersList, driversList) => {
    const stats = {
      totalUsers: usersList.length,
      totalDrivers: driversList.length,
      verifiedUsers: usersList.filter(user => user.emailVerified === true).length,
      activeDrivers: driversList.filter(driver => driver.status === 'active').length,
      inactiveDrivers: driversList.filter(driver => driver.status === 'inactive').length,
      totalCombined: usersList.length + driversList.length
    };
    setStats(stats);
  };

  const filterData = () => {
    let combinedData = [];

    // Combine data based on filter type
    if (filterType === 'all') {
      combinedData = [...users, ...drivers];
    } else if (filterType === 'users') {
      combinedData = users;
    } else if (filterType === 'drivers') {
      combinedData = drivers;
    }

    // Search filter
    if (searchTerm) {
      combinedData = combinedData.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone?.includes(searchTerm) ||
        item.uid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type === 'driver' && (
          item.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.operatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.operatorCompany?.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'verified') {
        combinedData = combinedData.filter(item => 
          item.type === 'user' ? item.emailVerified === true : item.status === 'active'
        );
      } else if (filterStatus === 'unverified') {
        combinedData = combinedData.filter(item => 
          item.type === 'user' ? item.emailVerified === false : item.status === 'inactive'
        );
      } else if (filterStatus === 'active') {
        combinedData = combinedData.filter(item => 
          item.type === 'driver' && item.status === 'active'
        );
      } else if (filterStatus === 'inactive') {
        combinedData = combinedData.filter(item => 
          item.type === 'driver' && item.status === 'inactive'
        );
      }
    }

    setFilteredData(combinedData);
  };

  const handleStatusUpdate = async (userId, userType, newStatus) => {
    try {
      const collection_name = userType === 'user' ? 'users' : 'drivers';
      const updateData = {
        updatedAt: new Date(),
        updatedBy: JSON.parse(localStorage.getItem('adminData')).name
      };

      if (userType === 'user') {
        updateData.emailVerified = newStatus === 'verified';
      } else {
        updateData.status = newStatus;
      }

      await updateDoc(doc(db, collection_name, userId), updateData);

      // Log the action
      await addDoc(collection(db, 'adminLogs'), {
        adminId: JSON.parse(localStorage.getItem('adminData')).uid,
        action: `${userType.toUpperCase()}_STATUS_UPDATE`,
        userId: userId,
        newStatus: newStatus,
        timestamp: serverTimestamp()
      });

      fetchData();
      setShowModal(false);
      alert(`${userType} status updated successfully!`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const handleDelete = async (userId, userType) => {
    if (!window.confirm(`Are you sure you want to delete this ${userType}? This action cannot be undone.`)) {
      return;
    }

    try {
      const collection_name = userType === 'user' ? 'users' : 'drivers';
      await deleteDoc(doc(db, collection_name, userId));
      
      // Log the action
      await addDoc(collection(db, 'adminLogs'), {
        adminId: JSON.parse(localStorage.getItem('adminData')).uid,
        action: `${userType.toUpperCase()}_DELETE`,
        userId: userId,
        timestamp: serverTimestamp()
      });

      fetchData();
      setShowModal(false);
      alert(`${userType} deleted successfully!`);
    } catch (error) {
      console.error('Error deleting:', error);
      alert(`Error deleting ${userType}`);
    }
  };

  const openModal = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setModalType('view');
  };

  const getStatusColor = (user) => {
    if (user.type === 'user') {
      return user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    } else {
      return user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = (user) => {
    if (user.type === 'user') {
      return user.emailVerified ? 'Verified' : 'Unverified';
    } else {
      return user.status === 'active' ? 'Active' : 'Inactive';
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
        <div className="text-white text-xl">Loading Users & Drivers...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <UserGroupIcon className="w-8 h-8 mr-3 text-red-400" />
            User Management
          </h1>
          <p className="text-gray-300">
            Manage and monitor all users and drivers on the platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={UserIcon}
            color="blue"
            subtitle="Registered customers"
          />
          <StatCard
            title="Total Drivers"
            value={stats.totalDrivers}
            icon={TruckIcon}
            color="green"
            subtitle="Registered drivers"
          />
          <StatCard
            title="Total Combined"
            value={stats.totalCombined}
            icon={UserGroupIcon}
            color="purple"
            subtitle="Users + Drivers"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Verified Users"
            value={stats.verifiedUsers}
            icon={CheckCircleIcon}
            color="green"
            subtitle={`${stats.totalUsers ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}% verified`}
          />
          <StatCard
            title="Active Drivers"
            value={stats.activeDrivers}
            icon={CheckCircleIcon}
            color="green"
            subtitle="Currently working"
          />
          <StatCard
            title="Inactive Drivers"
            value={stats.inactiveDrivers}
            icon={XCircleIcon}
            color="red"
            subtitle="Not working"
          />
          <StatCard
            title="Unverified Users"
            value={stats.totalUsers - stats.verifiedUsers}
            icon={ClockIcon}
            color="yellow"
            subtitle="Pending verification"
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
                placeholder="Search users, drivers, email, phone, license..."
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Types</option>
                <option value="users">Users Only</option>
                <option value="drivers">Drivers Only</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified/Active</option>
                <option value="unverified">Unverified/Inactive</option>
                <option value="active">Active Drivers</option>
                <option value="inactive">Inactive Drivers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users/Drivers Table */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-red-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600/20 border-b border-red-500/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Type & Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Additional Info
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredData.length > 0 ? (
                  filteredData.map((user) => (
                    <tr key={`${user.type}-${user.id}`} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-red-600/20 flex items-center justify-center">
                              {user.type === 'user' ? (
                                <UserIcon className="h-6 w-6 text-red-400" />
                              ) : (
                                <TruckIcon className="h-6 w-6 text-red-400" />
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {user.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {user.type === 'user' ? 'Customer' : 'Driver'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.uid || user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{user.email || 'N/A'}</div>
                        <div className="text-sm text-gray-400">{user.phone || 'N/A'}</div>
                        {user.type === 'driver' && user.address && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {user.address}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user)}`}>
                          {getStatusText(user)}
                        </span>
                        <div className="text-sm text-gray-400 mt-1">
                          {user.type === 'user' ? 'User Account' : 'Driver Account'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.type === 'driver' ? (
                          <div>
                            <div className="text-sm text-white">Bus: {user.busNumber || 'N/A'}</div>
                            <div className="text-sm text-gray-400">License: {user.licenseNumber || 'N/A'}</div>
                            <div className="text-sm text-gray-400">Operator: {user.operatorCompany || 'N/A'}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-white">
                              Email {user.emailVerified ? 'Verified' : 'Not Verified'}
                            </div>
                            <div className="text-sm text-gray-400">Regular Customer</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {user.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(user, 'view')}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openModal(user, 'edit')}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Edit Status"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openModal(user, 'delete')}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete User"
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
                        <UserGroupIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No users or drivers found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {modalType === 'view' && `${selectedUser.type === 'user' ? 'User' : 'Driver'} Details`}
                  {modalType === 'edit' && `Edit ${selectedUser.type === 'user' ? 'User' : 'Driver'} Status`}
                  {modalType === 'delete' && `Delete ${selectedUser.type === 'user' ? 'User' : 'Driver'}`}
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
                  {/* Basic Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                        <p className="text-white">{selectedUser.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <p className="text-white">{selectedUser.email || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                        <p className="text-white">{selectedUser.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                        <p className="text-white">{selectedUser.type === 'user' ? 'Customer' : 'Driver'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser)}`}>
                          {getStatusText(selectedUser)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Registration Date</label>
                        <p className="text-white">
                          {selectedUser.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {selectedUser.type === 'driver' && selectedUser.address && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                        <p className="text-white">{selectedUser.address}</p>
                      </div>
                    )}
                  </div>

                  {/* User Specific Information */}
                  {selectedUser.type === 'user' && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">User Account Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">User ID</label>
                          <p className="text-white">{selectedUser.uid || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Email Verified</label>
                          <p className="text-white">{selectedUser.emailVerified ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Driver Specific Information */}
                  {selectedUser.type === 'driver' && (
                    <div className="space-y-6">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Driver Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Age</label>
                            <p className="text-white">{selectedUser.age || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">License Number</label>
                            <p className="text-white">{selectedUser.licenseNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Experience</label>
                            <p className="text-white">{selectedUser.experience || 'N/A'} years</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Bus Number</label>
                            <p className="text-white">{selectedUser.busNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Route</label>
                            <p className="text-white">{selectedUser.route || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Salary</label>
                            <p className="text-white">₹{selectedUser.salary || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Joining Date</label>
                            <p className="text-white">{selectedUser.joiningDate || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Emergency Contact</label>
                            <p className="text-white">{selectedUser.emergencyContact || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Operator Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Operator ID</label>
                            <p className="text-white">{selectedUser.operatorId || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Operator Name</label>
                            <p className="text-white">{selectedUser.operatorName || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Company</label>
                            <p className="text-white">{selectedUser.operatorCompany || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Operator Email</label>
                            <p className="text-white">{selectedUser.operatorEmail || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Created By</label>
                            <p className="text-white">{selectedUser.createdBy || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Timestamps</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Created At</label>
                        <p className="text-white">
                          {selectedUser.createdAt?.toDate()?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Updated At</label>
                        <p className="text-white">
                          {selectedUser.updatedAt?.toDate()?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'edit' && (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Change the status of {selectedUser.type}: <span className="text-white font-medium">{selectedUser.name}</span>
                  </p>
                  {selectedUser.type === 'user' ? (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleStatusUpdate(selectedUser.id, selectedUser.type, 'verified')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
                      >
                        Verify Email
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedUser.id, selectedUser.type, 'unverified')}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg transition-colors"
                      >
                        Unverify Email
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleStatusUpdate(selectedUser.id, selectedUser.type, 'active')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
                      >
                        Set Active
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedUser.id, selectedUser.type, 'inactive')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
                      >
                        Set Inactive
                      </button>
                    </div>
                  )}
                </div>
              )}

              {modalType === 'delete' && (
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-red-600/20 border border-red-600/30 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3" />
                    <p className="text-red-200">
                      This action cannot be undone. All data associated with this {selectedUser.type} will be permanently deleted.
                    </p>
                  </div>
                  <p className="text-gray-300">
                    Are you sure you want to delete {selectedUser.type}: <span className="text-white font-medium">{selectedUser.name}</span>?
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleDelete(selectedUser.id, selectedUser.type)}
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

export default UserManagement;
