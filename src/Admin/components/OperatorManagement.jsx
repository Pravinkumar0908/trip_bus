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
  BuildingOfficeIcon,
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

const OperatorManagement = () => {
  const [operators, setOperators] = useState([]);
  const [filteredOperators, setFilteredOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // view, edit, delete
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalBuses: 0
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

    fetchOperators();
  }, [navigate]);

  useEffect(() => {
    filterOperators();
  }, [operators, searchTerm, filterStatus, filterVerification]);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const operatorsSnapshot = await getDocs(collection(db, 'operators'));
      const operatorsList = [];
      
      operatorsSnapshot.forEach((doc) => {
        operatorsList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by creation date (newest first)
      operatorsList.sort((a, b) => {
        const aDate = a.createdAt?.toDate() || new Date(0);
        const bDate = b.createdAt?.toDate() || new Date(0);
        return bDate - aDate;
      });

      setOperators(operatorsList);
      calculateStats(operatorsList);
    } catch (error) {
      console.error('Error fetching operators:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (operatorsList) => {
    const stats = {
      total: operatorsList.length,
      active: operatorsList.filter(op => op.isActive === true).length,
      inactive: operatorsList.filter(op => op.isActive === false).length,
      approved: operatorsList.filter(op => op.status === 'approved').length,
      pending: operatorsList.filter(op => op.status === 'pending').length,
      rejected: operatorsList.filter(op => op.status === 'rejected').length,
      totalBuses: operatorsList.reduce((total, op) => total + parseInt(op.numberOfBuses || 0), 0)
    };
    setStats(stats);
  };

  const filterOperators = () => {
    let filtered = operators;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(operator =>
        operator.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.mobileNumber?.includes(searchTerm) ||
        operator.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.operatorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(operator => {
        switch (filterStatus) {
          case 'active':
            return operator.isActive === true;
          case 'inactive':
            return operator.isActive === false;
          case 'approved':
            return operator.status === 'approved';
          case 'pending':
            return operator.status === 'pending';
          case 'rejected':
            return operator.status === 'rejected';
          default:
            return true;
        }
      });
    }

    // Verification filter
    if (filterVerification !== 'all') {
      filtered = filtered.filter(operator => operator.verificationLevel === filterVerification);
    }

    setFilteredOperators(filtered);
  };

  const handleStatusUpdate = async (operatorId, newStatus) => {
    try {
      const updateData = {
        updatedAt: new Date(),
        updatedBy: JSON.parse(localStorage.getItem('adminData')).name
      };

      if (newStatus === 'activate') {
        updateData.isActive = true;
        updateData.status = 'approved';
      } else if (newStatus === 'deactivate') {
        updateData.isActive = false;
        updateData.status = 'inactive';
      } else {
        updateData.status = newStatus;
        if (newStatus === 'approved') {
          updateData.isActive = true;
        }
      }

      await updateDoc(doc(db, 'operators', operatorId), updateData);

      // Log the action
      await addDoc(collection(db, 'adminLogs'), {
        adminId: JSON.parse(localStorage.getItem('adminData')).uid,
        action: 'OPERATOR_STATUS_UPDATE',
        operatorId: operatorId,
        newStatus: newStatus,
        timestamp: serverTimestamp()
      });

      fetchOperators();
      setShowModal(false);
      alert(`Operator status updated successfully!`);
    } catch (error) {
      console.error('Error updating operator status:', error);
      alert('Error updating operator status');
    }
  };

  const handleDelete = async (operatorId) => {
    if (!window.confirm('Are you sure you want to delete this operator? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'operators', operatorId));
      
      // Log the action
      await addDoc(collection(db, 'adminLogs'), {
        adminId: JSON.parse(localStorage.getItem('adminData')).uid,
        action: 'OPERATOR_DELETE',
        operatorId: operatorId,
        timestamp: serverTimestamp()
      });

      fetchOperators();
      setShowModal(false);
      alert('Operator deleted successfully!');
    } catch (error) {
      console.error('Error deleting operator:', error);
      alert('Error deleting operator');
    }
  };

  const openModal = (operator, type) => {
    setSelectedOperator(operator);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOperator(null);
    setModalType('view');
  };

  const getStatusColor = (status, isActive) => {
    if (status === 'approved' && isActive) {
      return 'bg-green-100 text-green-800';
    } else if (status === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (status === 'rejected') {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status, isActive) => {
    if (status === 'approved' && isActive) {
      return 'Active';
    } else if (status === 'approved' && !isActive) {
      return 'Approved (Inactive)';
    } else if (status === 'pending') {
      return 'Pending';
    } else if (status === 'rejected') {
      return 'Rejected';
    } else {
      return 'Unknown';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, percentage }) => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 hover:border-red-500/40 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {percentage && (
            <p className="text-sm text-gray-400 mt-1">{percentage}% of total</p>
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
        <div className="text-white text-xl">Loading Operators...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <BuildingOfficeIcon className="w-8 h-8 mr-3 text-red-400" />
            Operator Management
          </h1>
          <p className="text-gray-300">
            Manage and monitor all bus operators on the platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Operators"
            value={stats.total}
            icon={BuildingOfficeIcon}
            color="blue"
            percentage={100}
          />
          <StatCard
            title="Active Operators"
            value={stats.active}
            icon={CheckCircleIcon}
            color="green"
            percentage={stats.total ? Math.round((stats.active / stats.total) * 100) : 0}
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircleIcon}
            color="green"
            percentage={stats.total ? Math.round((stats.approved / stats.total) * 100) : 0}
          />
          <StatCard
            title="Pending Approval"
            value={stats.pending}
            icon={ClockIcon}
            color="yellow"
            percentage={stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Inactive Operators"
            value={stats.inactive}
            icon={XCircleIcon}
            color="red"
            percentage={stats.total ? Math.round((stats.inactive / stats.total) * 100) : 0}
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircleIcon}
            color="red"
            percentage={stats.total ? Math.round((stats.rejected / stats.total) * 100) : 0}
          />
          <StatCard
            title="Total Buses"
            value={stats.totalBuses}
            icon={TruckIcon}
            color="purple"
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
                placeholder="Search operators, business name, email, phone..."
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
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filterVerification}
                onChange={(e) => setFilterVerification(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Verification</option>
                <option value="basic">Basic</option>
                <option value="verified">Verified</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
        </div>

        {/* Operators Table */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-red-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600/20 border-b border-red-500/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Operator Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Business Info
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Status & Verification
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
                {filteredOperators.length > 0 ? (
                  filteredOperators.map((operator) => (
                    <tr key={operator.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-red-600/20 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-red-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {operator.fullName || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">
                              @{operator.username || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {operator.operatorId || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{operator.businessName || 'N/A'}</div>
                        <div className="text-sm text-gray-400">{operator.businessType || 'N/A'}</div>
                        <div className="text-sm text-gray-400">{operator.numberOfBuses || 0} buses</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{operator.emailAddress || 'N/A'}</div>
                        <div className="text-sm text-gray-400">{operator.mobileNumber || 'N/A'}</div>
                        <div className="text-sm text-gray-400">{operator.operatingStates || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(operator.status, operator.isActive)}`}>
                          {getStatusText(operator.status, operator.isActive)}
                        </span>
                        <div className="text-sm text-gray-400 mt-1">
                          {operator.verificationLevel || 'basic'} verification
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {operator.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(operator, 'view')}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openModal(operator, 'edit')}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Edit Status"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openModal(operator, 'delete')}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Operator"
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
                        <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No operators found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedOperator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {modalType === 'view' && 'Operator Details'}
                  {modalType === 'edit' && 'Edit Operator Status'}
                  {modalType === 'delete' && 'Delete Operator'}
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
                  {/* Personal Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                        <p className="text-white">{selectedOperator.fullName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                        <p className="text-white">{selectedOperator.username || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Operator ID</label>
                        <p className="text-white">{selectedOperator.operatorId || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <p className="text-white">{selectedOperator.emailAddress || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Mobile</label>
                        <p className="text-white">{selectedOperator.mobileNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Alternate Contact</label>
                        <p className="text-white">{selectedOperator.alternateContact || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Date of Birth</label>
                        <p className="text-white">{selectedOperator.dateOfBirth || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Gender</label>
                        <p className="text-white">{selectedOperator.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Years Experience</label>
                        <p className="text-white">{selectedOperator.yearsExperience || 'N/A'} years</p>
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Business Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Business Name</label>
                        <p className="text-white">{selectedOperator.businessName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Registered Business Name</label>
                        <p className="text-white">{selectedOperator.registeredBusinessName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Business Type</label>
                        <p className="text-white">{selectedOperator.businessType || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Number of Buses</label>
                        <p className="text-white">{selectedOperator.numberOfBuses || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Operating States</label>
                        <p className="text-white">{selectedOperator.operatingStates || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">GST Number</label>
                        <p className="text-white">{selectedOperator.gstNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Business Address</label>
                      <p className="text-white">{selectedOperator.businessAddress || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Bank Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Bank Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Account Holder Name</label>
                        <p className="text-white">{selectedOperator.accountHolderName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Account Number</label>
                        <p className="text-white">{selectedOperator.accountNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Bank Name</label>
                        <p className="text-white">{selectedOperator.bankName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Branch</label>
                        <p className="text-white">{selectedOperator.branch || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">IFSC Code</label>
                        <p className="text-white">{selectedOperator.ifscCode || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Account Type</label>
                        <p className="text-white">{selectedOperator.accountType || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents & Certificates */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Documents & Certificates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">PAN Number</label>
                        <p className="text-white">{selectedOperator.panNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Aadhar Number</label>
                        <p className="text-white">{selectedOperator.aadharNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Driving License</label>
                        <p className="text-white">{selectedOperator.drivingLicenseNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">RC Number</label>
                        <p className="text-white">{selectedOperator.rcNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Permit Number</label>
                        <p className="text-white">{selectedOperator.permitNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Fitness Certificate</label>
                        <p className="text-white">{selectedOperator.fitnessCertificateNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Insurance Policy</label>
                        <p className="text-white">{selectedOperator.insurancePolicyNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">PUC Number</label>
                        <p className="text-white">{selectedOperator.pucNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status & Verification */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Status & Verification</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOperator.status, selectedOperator.isActive)}`}>
                          {getStatusText(selectedOperator.status, selectedOperator.isActive)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Active</label>
                        <p className="text-white">{selectedOperator.isActive ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Verification Level</label>
                        <p className="text-white">{selectedOperator.verificationLevel || 'basic'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Registration Source</label>
                        <p className="text-white">{selectedOperator.registrationSource || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Registration Information */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Registration Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Registration Date</label>
                        <p className="text-white">
                          {selectedOperator.registrationDate?.toDate()?.toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Created At</label>
                        <p className="text-white">
                          {selectedOperator.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Last Updated</label>
                        <p className="text-white">
                          {selectedOperator.updatedAt?.toDate()?.toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'edit' && (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Change the status of operator: <span className="text-white font-medium">{selectedOperator.fullName}</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => handleStatusUpdate(selectedOperator.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedOperator.id, 'activate')}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedOperator.id, 'deactivate')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedOperator.id, 'rejected')}
                      className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'delete' && (
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-red-600/20 border border-red-600/30 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3" />
                    <p className="text-red-200">
                      This action cannot be undone. All data associated with this operator will be permanently deleted.
                    </p>
                  </div>
                  <p className="text-gray-300">
                    Are you sure you want to delete operator: <span className="text-white font-medium">{selectedOperator.fullName}</span>?
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleDelete(selectedOperator.id)}
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

export default OperatorManagement;
