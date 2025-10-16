import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  addDoc,
  serverTimestamp,
  query,
  where,
  setDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  CogIcon,
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Utility functions
const generateUniqueId = () => {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${randomString}`;
};

const hashPassword = (password) => {
  return btoa(password + 'easytrip_salt_2024');
};

// Memoized Input Component
const MemoizedInput = memo(({ label, placeholder, required, type = 'text', defaultValue, onValueChange, inputKey }) => {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    onValueChange(e.target.value);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        ref={inputRef}
        key={inputKey}
        type={type}
        defaultValue={defaultValue || ''}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
      />
    </div>
  );
});

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  
  // Form refs
  const nameRef = useRef('');
  const emailRef = useRef('');
  const phoneRef = useRef('');
  const passwordRef = useRef('');
  const roleRef = useRef('co_admin');

  const [settings, setSettings] = useState({
    profile: {
      name: '',
      email: '',
      phone: '',
      role: '',
      lastLogin: ''
    },
    system: {
      siteName: 'EasyTrip',
      maintenance: false,
      maxBookings: 1000,
      timezone: 'Asia/Kolkata',
      currency: 'INR'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      bookingAlerts: true,
      systemAlerts: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      loginAttempts: 5,
      passwordExpiry: 90
    }
  });

  // Stable handlers
  const handleNameInput = useCallback((value) => {
    nameRef.current = value;
  }, []);

  const handleEmailInput = useCallback((value) => {
    emailRef.current = value;
  }, []);

  const handlePhoneInput = useCallback((value) => {
    phoneRef.current = value;
  }, []);

  const handlePasswordInput = useCallback((value) => {
    passwordRef.current = value;
  }, []);

  const handleRoleSelect = useCallback((value) => {
    roleRef.current = value;
  }, []);

  // Generate admin code
  const generateAdminCode = (role) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const rolePrefix = role.toUpperCase().replace('_', '');
    return `EASYTRIP_${rolePrefix}_${year}${month}_${randomNum}`;
  };

  // Get collection name based on role
  const getCollectionByRole = (role) => {
    switch (role) {
      case 'co_admin':
        return 'coAdmins';
      case 'moderator':
        return 'moderators';
      case 'admin':
        return 'admins';
      default:
        return 'admins';
    }
  };

  // Get role permissions
  const getRolePermissions = (role) => {
    const basePermissions = {
      canViewDashboard: true,
      canViewReports: true
    };

    switch (role) {
      case 'co_admin':
        return {
          ...basePermissions,
          canManageUsers: true,
          canManageOperators: true,
          canManageBuses: true,
          canManageBookings: true,
          canManageAdmins: false,
          canManageSettings: true,
          canManageSystem: false,
          canDeleteData: true,
          canViewLogs: true
        };
      case 'moderator':
        return {
          ...basePermissions,
          canManageUsers: false,
          canManageOperators: false,
          canManageBuses: false,
          canManageBookings: true,
          canManageAdmins: false,
          canManageSettings: false,
          canManageSystem: false,
          canDeleteData: false,
          canViewLogs: false
        };
      case 'admin':
        return {
          ...basePermissions,
          canManageUsers: true,
          canManageOperators: true,
          canManageBuses: true,
          canManageBookings: true,
          canManageAdmins: true,
          canManageSettings: false,
          canManageSystem: false,
          canDeleteData: false,
          canViewLogs: false
        };
      default:
        return basePermissions;
    }
  };

  // Check if email already exists
  const checkEmailExists = async (email) => {
    const collections = ['admins', 'coAdmins', 'moderators'];
    
    for (const collectionName of collections) {
      try {
        const q = query(collection(db, collectionName), where('email', '==', email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return true;
        }
      } catch (error) {
        console.log(`Collection ${collectionName} might not exist yet`);
      }
    }
    return false;
  };

  useEffect(() => {
    // Check authentication
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      navigate('/admin-login');
      return;
    }

    // Set current admin data
    const currentAdminData = JSON.parse(adminData);
    setCurrentAdmin(currentAdminData);
    
    // Update settings with current admin data
    setSettings(prev => ({
      ...prev,
      profile: {
        name: currentAdminData.name || '',
        email: currentAdminData.email || '',
        phone: currentAdminData.phone || '',
        role: currentAdminData.role || 'admin',
        lastLogin: currentAdminData.lastLogin || ''
      }
    }));

    fetchAdmins();
  }, [navigate]);

  useEffect(() => {
    filterAdmins();
  }, [admins, searchTerm]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const collections = ['admins', 'coAdmins', 'moderators'];
      const adminsList = [];
      
      for (const collectionName of collections) {
        try {
          const adminsSnapshot = await getDocs(collection(db, collectionName));
          
          adminsSnapshot.forEach((doc) => {
            adminsList.push({
              id: doc.id,
              collection: collectionName,
              ...doc.data()
            });
          });
        } catch (error) {
          console.log(`Collection ${collectionName} might not exist yet:`, error);
        }
      }

      adminsList.sort((a, b) => {
        const aDate = a.createdAt?.toDate() || new Date(0);
        const bDate = b.createdAt?.toDate() || new Date(0);
        return bDate - aDate;
      });

      setAdmins(adminsList);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAdmins = () => {
    let filtered = admins;

    if (searchTerm) {
      filtered = filtered.filter(admin =>
        admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.phone?.includes(searchTerm) ||
        admin.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.adminCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAdmins(filtered);
  };

  const handleSettingsUpdate = async (section, updatedSettings) => {
    try {
      setSettings(prev => ({
        ...prev,
        [section]: { ...prev[section], ...updatedSettings }
      }));

      await addDoc(collection(db, 'adminLogs'), {
        adminId: currentAdmin?.uid,
        adminName: currentAdmin?.name,
        adminEmail: currentAdmin?.email,
        action: 'SETTINGS_UPDATE',
        section: section,
        timestamp: serverTimestamp(),
        details: {
          section: section,
          updatedFields: Object.keys(updatedSettings)
        }
      });

      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error updating settings');
    }
  };

  const handleCreateAdmin = async () => {
    const name = nameRef.current;
    const email = emailRef.current;
    const phone = phoneRef.current;
    const password = passwordRef.current;
    const role = roleRef.current;

    if (!name || !email || !password) {
      alert('Please fill all required fields (Name, Email, Password)');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    // Admin can only create co-admin and moderator
    if (!['co_admin', 'moderator'].includes(role)) {
      alert('You can only create Co-Admin and Moderator');
      return;
    }

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        alert('This email is already registered');
        return;
      }

      const adminCode = generateAdminCode(role);
      const uniqueId = generateUniqueId();
      
      const targetCollection = getCollectionByRole(role);
      
      const adminData = {
        id: uniqueId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || '',
        password: hashPassword(password),
        role: role,
        adminCode: adminCode,
        status: 'deactive', // Default deactive status
        isActive: false, // Default deactive
        createdAt: serverTimestamp(),
        createdBy: currentAdmin?.id || currentAdmin?.uid,
        createdByName: currentAdmin?.name,
        lastLogin: null,
        loginAttempts: 0,
        isLocked: false,
        permissions: getRolePermissions(role)
      };

      await setDoc(doc(db, targetCollection, uniqueId), adminData);

      await addDoc(collection(db, 'adminLogs'), {
        adminId: currentAdmin?.uid,
        adminName: currentAdmin?.name,
        adminEmail: currentAdmin?.email,
        action: 'ADMIN_CREATE',
        targetEmail: email,
        timestamp: serverTimestamp(),
        details: {
          adminCode: adminCode,
          role: role,
          status: 'CREATED_DEACTIVE',
          createdAdminId: uniqueId,
          collection: targetCollection
        }
      });

      // Reset form
      nameRef.current = '';
      emailRef.current = '';
      phoneRef.current = '';
      passwordRef.current = '';
      roleRef.current = 'co_admin';
      
      // Force component re-render to clear inputs
      setActiveTab('admins');
      
      fetchAdmins();
      alert(`${role === 'co_admin' ? 'Co-Admin' : 'Moderator'} created successfully!\n\nAdmin Code: ${adminCode}\nEmail: ${email}\nPassword: ${password}\nStatus: Deactive (You can activate later)\n\nPlease save these details safely!`);
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Error creating admin');
    }
  };

  const handleAdminStatusUpdate = async (adminId, isActive) => {
    try {
      const admin = admins.find(a => a.id === adminId);
      if (!admin) return;

      const newStatus = isActive ? 'active' : 'deactive';

      await updateDoc(doc(db, admin.collection, adminId), {
        isActive: isActive,
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: currentAdmin?.uid,
        ...(isActive && { approvedAt: serverTimestamp(), approvedBy: currentAdmin?.uid })
      });

      await addDoc(collection(db, 'adminLogs'), {
        adminId: currentAdmin?.uid,
        adminName: currentAdmin?.name,
        adminEmail: currentAdmin?.email,
        action: 'ADMIN_STATUS_UPDATE',
        targetAdminId: adminId,
        newStatus: newStatus,
        timestamp: serverTimestamp(),
        details: {
          action: isActive ? 'ACTIVATED' : 'DEACTIVATED',
          updatedBy: currentAdmin?.name,
          collection: admin.collection
        }
      });

      fetchAdmins();
      setShowModal(false);
      alert(`Admin ${isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Error updating admin status');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }

    try {
      const admin = admins.find(a => a.id === adminId);
      if (!admin) return;

      await deleteDoc(doc(db, admin.collection, adminId));
      
      await addDoc(collection(db, 'adminLogs'), {
        adminId: currentAdmin?.uid,
        adminName: currentAdmin?.name,
        adminEmail: currentAdmin?.email,
        action: 'ADMIN_DELETE',
        targetAdminId: adminId,
        timestamp: serverTimestamp(),
        details: {
          deletedBy: currentAdmin?.name,
          action: 'PERMANENT_DELETE',
          collection: admin.collection
        }
      });

      fetchAdmins();
      setShowModal(false);
      alert('Admin deleted successfully!');
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Error deleting admin');
    }
  };

  const openModal = (admin, type) => {
    setSelectedAdmin(admin);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAdmin(null);
    setModalType('view');
  };

  const handleSettingsChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-red-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-700'
      }`}
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
    </button>
  );

  const SettingCard = ({ title, children }) => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );

  const InputField = ({ label, value, onChange, type = 'text', placeholder, required = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
      />
    </div>
  );

  const ToggleSwitch = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-red-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full flex items-center justify-center">
        <div className="text-white text-xl">Loading Settings...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <CogIcon className="w-8 h-8 mr-3 text-red-400" />
            Settings & Administration
          </h1>
          <p className="text-gray-300">
            Manage your account, system settings, and admin users
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 mb-8">
          <div className="flex flex-wrap gap-2">
            <TabButton
              id="profile"
              label="Profile"
              icon={UserIcon}
              active={activeTab === 'profile'}
              onClick={setActiveTab}
            />
            <TabButton
              id="system"
              label="System"
              icon={CogIcon}
              active={activeTab === 'system'}
              onClick={setActiveTab}
            />
            <TabButton
              id="notifications"
              label="Notifications"
              icon={BellIcon}
              active={activeTab === 'notifications'}
              onClick={setActiveTab}
            />
            <TabButton
              id="security"
              label="Security"
              icon={ShieldCheckIcon}
              active={activeTab === 'security'}
              onClick={setActiveTab}
            />
            <TabButton
              id="admins"
              label="Admin Users"
              icon={UserIcon}
              active={activeTab === 'admins'}
              onClick={setActiveTab}
            />
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <SettingCard title="Profile Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Full Name"
                  value={settings.profile.name}
                  onChange={(value) => handleSettingsChange('profile', 'name', value)}
                  placeholder="Enter your full name"
                />
                <InputField
                  label="Email Address"
                  value={settings.profile.email}
                  onChange={(value) => handleSettingsChange('profile', 'email', value)}
                  type="email"
                  placeholder="Enter your email"
                />
                <InputField
                  label="Phone Number"
                  value={settings.profile.phone}
                  onChange={(value) => handleSettingsChange('profile', 'phone', value)}
                  placeholder="Enter your phone number"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                  <select
                    value={settings.profile.role}
                    onChange={(e) => handleSettingsChange('profile', 'role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handleSettingsUpdate('profile', settings.profile)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Update Profile
                </button>
              </div>
            </SettingCard>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <SettingCard title="System Configuration">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Site Name"
                  value={settings.system.siteName}
                  onChange={(value) => handleSettingsChange('system', 'siteName', value)}
                  placeholder="Enter site name"
                />
                <InputField
                  label="Max Bookings per Day"
                  value={settings.system.maxBookings}
                  onChange={(value) => handleSettingsChange('system', 'maxBookings', parseInt(value) || 0)}
                  type="number"
                  placeholder="Enter max bookings"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Timezone</label>
                  <select
                    value={settings.system.timezone}
                    onChange={(e) => handleSettingsChange('system', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Currency</label>
                  <select
                    value={settings.system.currency}
                    onChange={(e) => handleSettingsChange('system', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <ToggleSwitch
                  label="Maintenance Mode"
                  checked={settings.system.maintenance}
                  onChange={(value) => handleSettingsChange('system', 'maintenance', value)}
                />
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handleSettingsUpdate('system', settings.system)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Update System Settings
                </button>
              </div>
            </SettingCard>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <SettingCard title="Notification Preferences">
              <div className="space-y-4">
                <ToggleSwitch
                  label="Email Notifications"
                  checked={settings.notifications.emailNotifications}
                  onChange={(value) => handleSettingsChange('notifications', 'emailNotifications', value)}
                />
                <ToggleSwitch
                  label="SMS Notifications"
                  checked={settings.notifications.smsNotifications}
                  onChange={(value) => handleSettingsChange('notifications', 'smsNotifications', value)}
                />
                <ToggleSwitch
                  label="Push Notifications"
                  checked={settings.notifications.pushNotifications}
                  onChange={(value) => handleSettingsChange('notifications', 'pushNotifications', value)}
                />
                <ToggleSwitch
                  label="Booking Alerts"
                  checked={settings.notifications.bookingAlerts}
                  onChange={(value) => handleSettingsChange('notifications', 'bookingAlerts', value)}
                />
                <ToggleSwitch
                  label="System Alerts"
                  checked={settings.notifications.systemAlerts}
                  onChange={(value) => handleSettingsChange('notifications', 'systemAlerts', value)}
                />
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handleSettingsUpdate('notifications', settings.notifications)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Update Notification Settings
                </button>
              </div>
            </SettingCard>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <SettingCard title="Security Settings">
              <div className="space-y-4">
                <ToggleSwitch
                  label="Two-Factor Authentication"
                  checked={settings.security.twoFactorAuth}
                  onChange={(value) => handleSettingsChange('security', 'twoFactorAuth', value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Session Timeout (minutes)"
                    value={settings.security.sessionTimeout}
                    onChange={(value) => handleSettingsChange('security', 'sessionTimeout', parseInt(value) || 30)}
                    type="number"
                    placeholder="Enter session timeout"
                  />
                  <InputField
                    label="Max Login Attempts"
                    value={settings.security.loginAttempts}
                    onChange={(value) => handleSettingsChange('security', 'loginAttempts', parseInt(value) || 5)}
                    type="number"
                    placeholder="Enter max login attempts"
                  />
                  <InputField
                    label="Password Expiry (days)"
                    value={settings.security.passwordExpiry}
                    onChange={(value) => handleSettingsChange('security', 'passwordExpiry', parseInt(value) || 90)}
                    type="number"
                    placeholder="Enter password expiry days"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handleSettingsUpdate('security', settings.security)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Update Security Settings
                </button>
              </div>
            </SettingCard>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="space-y-6">
            {/* Create New Admin */}
            <SettingCard title="Create New Admin">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MemoizedInput
                  label="Name"
                  placeholder="Admin name"
                  required
                  onValueChange={handleNameInput}
                  inputKey="name-input"
                />
                <MemoizedInput
                  label="Email"
                  placeholder="Admin email"
                  required
                  type="email"
                  onValueChange={handleEmailInput}
                  inputKey="email-input"
                />
                <MemoizedInput
                  label="Phone"
                  placeholder="Phone number"
                  onValueChange={handlePhoneInput}
                  inputKey="phone-input"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                  <select
                    defaultValue="co_admin"
                    onChange={(e) => handleRoleSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="co_admin">Co-Admin</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                <MemoizedInput
                  label="Password"
                  placeholder="Password (min 6 chars)"
                  required
                  type="password"
                  onValueChange={handlePasswordInput}
                  inputKey="password-input"
                />
              </div>
              
              {/* Role Description */}
              <div className="mt-4 p-4 bg-gray-700/30 rounded-lg">
                <h4 className="text-sm font-semibold text-white mb-2">Role Permissions:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                  <div>
                    <strong className="text-blue-400">Co-Admin:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• Manage Users, Operators, Buses</li>
                      <li>• Handle All Bookings</li>
                      <li>• View Reports & Logs</li>
                      <li>• System Settings Access</li>
                      <li>• Default Status: Deactive</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-yellow-400">Moderator:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• View Dashboard & Reports</li>
                      <li>• Manage Bookings Only</li>
                      <li>• Limited User Management</li>
                      <li>• Monitor Activities</li>
                      <li>• Default Status: Deactive</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleCreateAdmin}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Admin
                </button>
              </div>
            </SettingCard>

            {/* Admin Search */}
            <SettingCard title="Manage Admin Users">
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Search admins..."
                  />
                </div>
              </div>

              {/* Admins Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50 border-b border-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Collection</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Admin Code</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredAdmins.map((admin) => (
                      <tr key={`${admin.collection}-${admin.id}`} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 text-sm text-white">{admin.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{admin.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-300 capitalize">{admin.role?.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-sm text-gray-300 capitalize">{admin.collection}</td>
                        <td className="px-4 py-3 text-sm text-gray-300 font-mono">{admin.adminCode || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            admin.status === 'active' || admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.status === 'active' || admin.isActive ? 'Active' : 'Deactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {admin.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(admin, 'view')}
                              className="text-blue-400 hover:text-blue-300"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal(admin, 'edit')}
                              className="text-green-400 hover:text-green-300"
                              title="Edit Admin Status"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal(admin, 'delete')}
                              className="text-red-400 hover:text-red-300"
                              title="Delete Admin"
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
            </SettingCard>
          </div>
        )}

        {/* Modal */}
        {showModal && selectedAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {modalType === 'view' && 'Admin Details'}
                  {modalType === 'edit' && 'Edit Admin Status'}
                  {modalType === 'delete' && 'Delete Admin'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {modalType === 'view' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                      <p className="text-white">{selectedAdmin.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                      <p className="text-white">{selectedAdmin.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                      <p className="text-white">{selectedAdmin.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                      <p className="text-white capitalize">{selectedAdmin.role?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Collection</label>
                      <p className="text-white capitalize">{selectedAdmin.collection}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Admin Code</label>
                      <p className="text-white font-mono">{selectedAdmin.adminCode || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedAdmin.status === 'active' || selectedAdmin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedAdmin.status === 'active' || selectedAdmin.isActive ? 'Active' : 'Deactive'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Created Date</label>
                      <p className="text-white">{selectedAdmin.createdAt?.toDate()?.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Created By</label>
                      <p className="text-white">{selectedAdmin.createdByName || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Permissions */}
                  {selectedAdmin.permissions && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Permissions</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedAdmin.permissions).map(([permission, enabled]) => (
                          <div key={permission} className="flex items-center">
                            {enabled ? (
                              <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                            ) : (
                              <XCircleIcon className="w-4 h-4 text-red-400 mr-2" />
                            )}
                            <span className="text-sm text-gray-300">
                              {permission.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalType === 'edit' && (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Change the status of admin: <span className="text-white font-medium">{selectedAdmin.name}</span>
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAdminStatusUpdate(selectedAdmin.id, true)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleAdminStatusUpdate(selectedAdmin.id, false)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'delete' && (
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-red-600/20 border border-red-600/30 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3" />
                    <p className="text-red-200">
                      This action cannot be undone. This admin will lose all access to the system.
                    </p>
                  </div>
                  <p className="text-gray-300">
                    Are you sure you want to delete admin: <span className="text-white font-medium">{selectedAdmin.name}</span>?
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleDeleteAdmin(selectedAdmin.id)}
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

export default Settings;
