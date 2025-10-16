import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  UserIcon,
  ShieldCheckIcon,
  ClockIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  LockClosedIcon,
  UserGroupIcon,
  TruckIcon,
  TicketIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const AdminProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [adminLogs, setAdminLogs] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [stats, setStats] = useState({
    totalLogins: 0,
    lastLogin: null,
    activeSessions: 1,
    totalActions: 0,
    recentActions: []
  });
  
  const [permissions, setPermissions] = useState({
    canManageUsers: false,
    canManageOperators: false,
    canManageBuses: false,
    canManageBookings: false,
    canViewReports: false,
    canManageSettings: false
  });

  useEffect(() => {
    // Check authentication
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      navigate('/admin-login');
      return;
    }

    const adminInfo = JSON.parse(adminData);
    setCurrentAdmin(adminInfo);
    setEditData({
      name: adminInfo.name || '',
      email: adminInfo.email || '',
      phone: adminInfo.phone || ''
    });

    fetchAdminProfile(adminInfo.uid);
  }, [navigate]);

  const fetchAdminProfile = async (adminId) => {
    setLoading(true);
    try {
      // Fetch admin details from Firestore
      const adminsSnapshot = await getDocs(
        query(collection(db, 'admins'), where('uid', '==', adminId))
      );
      
      if (!adminsSnapshot.empty) {
        const adminDoc = adminsSnapshot.docs[0];
        const adminData = { id: adminDoc.id, ...adminDoc.data() };
        setCurrentAdmin(adminData);
        
        // Set permissions
        if (adminData.permissions) {
          setPermissions(adminData.permissions);
        }
        
        setEditData({
          name: adminData.name || '',
          email: adminData.email || '',
          phone: adminData.phone || ''
        });
      }

      // Fetch admin logs
      const logsQuery = query(
        collection(db, 'adminLogs'),
        where('adminId', '==', adminId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      const logsList = [];
      logsSnapshot.forEach((doc) => {
        logsList.push({ id: doc.id, ...doc.data() });
      });
      
      setAdminLogs(logsList);
      calculateStats(logsList);
      
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logs) => {
    const loginLogs = logs.filter(log => log.action === 'ADMIN_LOGIN');
    const recentActions = logs.slice(0, 10).map(log => ({
      action: log.action,
      timestamp: log.timestamp?.toDate(),
      details: log.details || {}
    }));

    setStats({
      totalLogins: loginLogs.length,
      lastLogin: currentAdmin?.lastLoginAt?.toDate(),
      activeSessions: 1, // Current session
      totalActions: logs.length,
      recentActions
    });
  };

  const handleUpdateProfile = async () => {
    if (!currentAdmin?.id) return;

    try {
      await updateDoc(doc(db, 'admins', currentAdmin.id), {
        name: editData.name,
        email: editData.email,
        phone: editData.phone,
        updatedAt: serverTimestamp()
      });

      // Log the action
      await addDoc(collection(db, 'adminLogs'), {
        adminId: currentAdmin.uid,
        adminName: currentAdmin.name,
        adminEmail: currentAdmin.email,
        action: 'PROFILE_UPDATE',
        timestamp: serverTimestamp(),
        details: {
          updatedFields: ['name', 'email', 'phone']
        }
      });

      // Update local storage
      const updatedAdmin = { ...currentAdmin, ...editData };
      localStorage.setItem('adminData', JSON.stringify(updatedAdmin));
      setCurrentAdmin(updatedAdmin);
      setEditMode(false);
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'ADMIN_LOGIN':
        return <UserIcon className="w-5 h-5 text-green-400" />;
      case 'ADMIN_SIGNUP':
        return <UserGroupIcon className="w-5 h-5 text-blue-400" />;
      case 'PROFILE_UPDATE':
        return <PencilIcon className="w-5 h-5 text-yellow-400" />;
      case 'USER_MANAGEMENT':
        return <UserGroupIcon className="w-5 h-5 text-blue-400" />;
      case 'OPERATOR_MANAGEMENT':
        return <TruckIcon className="w-5 h-5 text-purple-400" />;
      case 'BOOKING_MANAGEMENT':
        return <TicketIcon className="w-5 h-5 text-indigo-400" />;
      case 'SETTINGS_UPDATE':
        return <CogIcon className="w-5 h-5 text-gray-400" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getActionDescription = (log) => {
    switch (log.action) {
      case 'ADMIN_LOGIN':
        return 'Logged into admin panel';
      case 'ADMIN_SIGNUP':
        return `Signed up with admin code: ${log.details?.adminCode || 'N/A'}`;
      case 'PROFILE_UPDATE':
        return 'Updated profile information';
      case 'USER_MANAGEMENT':
        return 'Performed user management action';
      case 'OPERATOR_MANAGEMENT':
        return 'Performed operator management action';
      case 'BOOKING_MANAGEMENT':
        return 'Performed booking management action';
      case 'SETTINGS_UPDATE':
        return 'Updated system settings';
      default:
        return log.action.replace(/_/g, ' ').toLowerCase();
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
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

  const PermissionCard = ({ title, description, icon: Icon, enabled }) => (
    <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 border transition-colors ${
      enabled ? 'border-green-500/40 bg-green-900/10' : 'border-gray-600/40'
    }`}>
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${enabled ? 'bg-green-600/20' : 'bg-gray-600/20'}`}>
          <Icon className={`w-5 h-5 ${enabled ? 'text-green-400' : 'text-gray-400'}`} />
        </div>
        <div className="ml-3">
          <h4 className={`text-sm font-medium ${enabled ? 'text-green-300' : 'text-gray-300'}`}>
            {title}
          </h4>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        <div className="ml-auto">
          {enabled ? (
            <CheckCircleIcon className="w-5 h-5 text-green-400" />
          ) : (
            <XCircleIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full flex items-center justify-center">
        <div className="text-white text-xl">Loading Profile...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <UserIcon className="w-8 h-8 mr-3 text-red-400" />
            Admin Profile
          </h1>
          <p className="text-gray-300">
            Manage your admin profile, permissions, and activity history
          </p>
        </div>

        {/* Profile Summary */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mr-4">
                <UserIcon className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{currentAdmin?.name || 'Admin User'}</h2>
                <p className="text-gray-400">{currentAdmin?.email}</p>
                <div className="flex items-center mt-2">
                  <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    currentAdmin?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {currentAdmin?.isActive ? 'Active' : 'Inactive'}
                  </div>
                  <span className="ml-2 text-sm text-gray-400">
                    Role: {currentAdmin?.role || 'admin'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              {editMode ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Logins"
            value={stats.totalLogins}
            subtitle="Successful logins"
            icon={UserIcon}
            color="blue"
          />
          <StatCard
            title="Total Actions"
            value={stats.totalActions}
            subtitle="Admin activities"
            icon={DocumentTextIcon}
            color="green"
          />
          <StatCard
            title="Active Sessions"
            value={stats.activeSessions}
            subtitle="Current session"
            icon={GlobeAltIcon}
            color="yellow"
          />
          <StatCard
            title="Account Status"
            value={currentAdmin?.isActive ? 'Active' : 'Inactive'}
            subtitle="Current status"
            icon={CheckCircleIcon}
            color={currentAdmin?.isActive ? 'green' : 'red'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <UserIcon className="w-6 h-6 mr-2 text-red-400" />
                Personal Information
              </h3>
              
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleUpdateProfile}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                    <p className="text-white">{currentAdmin?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                    <p className="text-white">{currentAdmin?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                    <p className="text-white">{currentAdmin?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Admin Code</label>
                    <p className="text-white font-mono">{currentAdmin?.adminCode || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                    <p className="text-white capitalize">{currentAdmin?.role || 'admin'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">User ID</label>
                    <p className="text-white font-mono text-sm">{currentAdmin?.uid || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Account Information */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <ShieldCheckIcon className="w-6 h-6 mr-2 text-red-400" />
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Account Created</label>
                  <p className="text-white">{currentAdmin?.createdAt?.toDate()?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Last Login</label>
                  <p className="text-white">{currentAdmin?.lastLoginAt?.toDate()?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Last Login IP</label>
                  <p className="text-white font-mono">{currentAdmin?.lastLoginIP || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Account Status</label>
                  <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    currentAdmin?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {currentAdmin?.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <ClockIcon className="w-6 h-6 mr-2 text-red-400" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                {stats.recentActions.length > 0 ? (
                  stats.recentActions.map((activity, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-700/50 rounded-lg">
                      <div className="mr-3">
                        {getActionIcon(activity.action)}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">
                          {getActionDescription(activity)}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {activity.timestamp?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <LockClosedIcon className="w-6 h-6 mr-2 text-red-400" />
                Permissions
              </h3>
              <div className="space-y-3">
                <PermissionCard
                  title="Manage Users"
                  description="Add, edit, delete users"
                  icon={UserGroupIcon}
                  enabled={permissions.canManageUsers}
                />
                <PermissionCard
                  title="Manage Operators"
                  description="Approve/reject operators"
                  icon={TruckIcon}
                  enabled={permissions.canManageOperators}
                />
                <PermissionCard
                  title="Manage Buses"
                  description="Add, edit bus information"
                  icon={TruckIcon}
                  enabled={permissions.canManageBuses}
                />
                <PermissionCard
                  title="Manage Bookings"
                  description="View and manage bookings"
                  icon={TicketIcon}
                  enabled={permissions.canManageBookings}
                />
                <PermissionCard
                  title="View Reports"
                  description="Access analytics and reports"
                  icon={ChartBarIcon}
                  enabled={permissions.canViewReports}
                />
                <PermissionCard
                  title="Manage Settings"
                  description="System configuration"
                  icon={CogIcon}
                  enabled={permissions.canManageSettings}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-500/20">
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/admin-panel/settings')}
                  className="w-full text-left p-3 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <CogIcon className="w-5 h-5 text-red-400 mr-3" />
                    <span className="text-white">System Settings</span>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/admin-panel/reports')}
                  className="w-full text-left p-3 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <DocumentTextIcon className="w-5 h-5 text-red-400 mr-3" />
                    <span className="text-white">View Reports</span>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/admin-panel/analytics')}
                  className="w-full text-left p-3 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <ChartBarIcon className="w-5 h-5 text-red-400 mr-3" />
                    <span className="text-white">Analytics Dashboard</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
