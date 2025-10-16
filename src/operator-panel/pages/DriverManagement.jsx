import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  TruckIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const DriverManagement = () => {
  // 🔥 FIXED: Use localStorage instead of Firebase Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [currentOperator, setCurrentOperator] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [loadingState, setLoadingState] = useState(true); // Start with loading true
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    address: '',
    experience: '',
    busNumber: '',
    route: '',
    salary: '',
    status: 'active',
    joiningDate: '',
    age: '',
    emergencyContact: '',
    operatorId: '',
    operatorName: '',
    operatorCompany: ''
  });

  // 🔥 FIXED: Check authentication from localStorage
  const checkAuthStatus = () => {
    try {
      const operatorToken = localStorage.getItem('operatorToken');
      const operatorInfoStr = localStorage.getItem('operatorInfo');
      
      if (operatorToken && operatorInfoStr) {
        const operatorInfo = JSON.parse(operatorInfoStr);
        console.log('✅ Found logged-in operator:', operatorInfo);
        
        setIsLoggedIn(true);
        setCurrentOperator(operatorInfo);
        
        // Auto-fill operator data in form
        setFormData(prev => ({
          ...prev,
          operatorId: operatorInfo.operatorId || operatorInfo.id,
          operatorName: operatorInfo.name || operatorInfo.businessName,
          operatorCompany: operatorInfo.businessName || operatorInfo.companyName || 'N/A'
        }));
        
        return true;
      } else {
        console.log('❌ No operator found in localStorage');
        setIsLoggedIn(false);
        setCurrentOperator(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsLoggedIn(false);
      setCurrentOperator(null);
      return false;
    }
  };

  // Fetch drivers (only for current operator)
  const fetchDrivers = async () => {
    if (!currentOperator) {
      console.log('❌ No current operator, skipping driver fetch');
      return;
    }
    
    setLoadingState(true);
    try {
      const operatorId = currentOperator.operatorId || currentOperator.id;
      console.log('🔍 Fetching drivers for operator:', operatorId);
      
      // Query drivers by operatorId
      const q = query(
        collection(db, 'drivers'), 
        where('operatorId', '==', operatorId),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      const driversData = [];
      querySnapshot.forEach((doc) => {
        driversData.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('✅ Found drivers:', driversData.length);
      setDrivers(driversData);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      // If orderBy fails, try without it
      try {
        const operatorId = currentOperator.operatorId || currentOperator.id;
        const q = query(
          collection(db, 'drivers'), 
          where('operatorId', '==', operatorId)
        );
        
        const querySnapshot = await getDocs(q);
        const driversData = [];
        querySnapshot.forEach((doc) => {
          driversData.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort manually
        driversData.sort((a, b) => a.name.localeCompare(b.name));
        setDrivers(driversData);
      } catch (secondError) {
        console.error('Second attempt failed:', secondError);
        alert('Error loading drivers!');
      }
    } finally {
      setLoadingState(false);
    }
  };

  // Add new driver with operator information
  const addDriver = async (e) => {
    e.preventDefault();
    setLoadingState(true);
    
    try {
      const operatorId = currentOperator.operatorId || currentOperator.id;
      
      const driverData = {
        ...formData,
        operatorId: operatorId,
        operatorName: currentOperator.name || currentOperator.businessName,
        operatorCompany: currentOperator.businessName || currentOperator.companyName || 'N/A',
        operatorEmail: currentOperator.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: operatorId
      };
      
      console.log('➕ Adding driver with data:', driverData);
      
      await addDoc(collection(db, 'drivers'), driverData);
      alert('Driver successfully added!');
      resetForm();
      fetchDrivers();
    } catch (error) {
      console.error('Error adding driver:', error);
      alert('Error adding driver!');
    } finally {
      setLoadingState(false);
    }
  };

  // Update driver
  const updateDriver = async (e) => {
    e.preventDefault();
    setLoadingState(true);
    
    try {
      const operatorId = currentOperator.operatorId || currentOperator.id;
      
      const driverRef = doc(db, 'drivers', editingDriver.id);
      const updateData = {
        ...formData,
        updatedAt: new Date(),
        updatedBy: operatorId
      };
      
      await updateDoc(driverRef, updateData);
      alert('Driver successfully updated!');
      resetForm();
      fetchDrivers();
    } catch (error) {
      console.error('Error updating driver:', error);
      alert('Error updating driver!');
    } finally {
      setLoadingState(false);
    }
  };

  // Delete driver
  const deleteDriver = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      setLoadingState(true);
      try {
        await deleteDoc(doc(db, 'drivers', id));
        alert('Driver successfully deleted!');
        fetchDrivers();
      } catch (error) {
        console.error('Error deleting driver:', error);
        alert('Error deleting driver!');
      } finally {
        setLoadingState(false);
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      licenseNumber: '',
      address: '',
      experience: '',
      busNumber: '',
      route: '',
      salary: '',
      status: 'active',
      joiningDate: '',
      age: '',
      emergencyContact: '',
      operatorId: currentOperator?.operatorId || currentOperator?.id || '',
      operatorName: currentOperator?.name || currentOperator?.businessName || '',
      operatorCompany: currentOperator?.businessName || currentOperator?.companyName || ''
    });
    setShowAddForm(false);
    setEditingDriver(null);
  };

  // Handle edit
  const handleEdit = (driver) => {
    setFormData(driver);
    setEditingDriver(driver);
    setShowAddForm(true);
  };

  // Handle input change
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

  // Filter drivers based on search
  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm) ||
    driver.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔥 FIXED: Check auth on component mount
  useEffect(() => {
    console.log('🚀 DriverManagement component mounted');
    const isAuth = checkAuthStatus();
    setLoadingState(!isAuth); // Stop loading if auth found
  }, []);

  // Fetch drivers when operator is available
  useEffect(() => {
    if (currentOperator && isLoggedIn) {
      console.log('📋 Current operator available, fetching drivers...');
      fetchDrivers();
    }
  }, [currentOperator, isLoggedIn]);

  // Show loading spinner
  if (loadingState && !currentOperator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login required message
  if (!isLoggedIn || !currentOperator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <TruckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to login to access Driver Management</p>
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <TruckIcon className="h-8 w-8 text-blue-600" />
                Driver Manage
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition duration-200 transform hover:scale-105"
              >
                <PlusIcon className="h-5 w-5" />
                Add New Driver
              </button>
            </div>
          </div>
        </div>

        {/* Current Operator Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Current Operator Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">ID:</span> {currentOperator.operatorId || currentOperator.id}
            </div>
            <div>
              <span className="font-medium text-gray-700">Name:</span> {currentOperator.name || currentOperator.businessName}
            </div>
            <div>
              <span className="font-medium text-gray-700">Company:</span> {currentOperator.businessName || currentOperator.companyName || 'N/A'}
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span> {currentOperator.email}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search drivers (name, phone, bus number, license)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-4" />
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
              </h2>
              
              <form onSubmit={editingDriver ? updateDriver : addDriver}>
                {/* Operator Information (Read-only) */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <BuildingOfficeIcon className="h-5 w-5" />
                    Operator Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Operator ID
                      </label>
                      <input
                        type="text"
                        value={formData.operatorId}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Operator Name
                      </label>
                      <input
                        type="text"
                        value={formData.operatorName}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.operatorCompany}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Driver Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Driver Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number *
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bus Number
                    </label>
                    <input
                      type="text"
                      name="busNumber"
                      value={formData.busNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Route
                    </label>
                    <input
                      type="text"
                      name="route"
                      value={formData.route}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary
                    </label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency Contact
                    </label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingState}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-blue-400"
                  >
                    {loadingState ? 'Saving...' : (editingDriver ? 'Update Driver' : 'Add Driver')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Drivers List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Drivers List ({filteredDrivers.length})
            </h2>
          </div>

          {loadingState ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading drivers...</span>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No drivers found</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Add First Driver
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus & Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {driver.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              License: {driver.licenseNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                          {driver.phone}
                        </div>
                        {driver.email && (
                          <div className="text-sm text-gray-500">{driver.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Bus: {driver.busNumber || 'Not assigned'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Route: {driver.route || 'Not assigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          driver.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : driver.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {driver.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(driver)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Edit Driver"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteDriver(driver.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete Driver"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverManagement;
