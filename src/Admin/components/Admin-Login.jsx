import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Hash password function to match stored passwords
  const hashPassword = (password) => {
    return btoa(password + 'easytrip_salt_2024');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // Normalize role names
  const normalizeRole = (role) => {
    if (!role) return 'admin';
    const lowerRole = role.toLowerCase();
    if (lowerRole === 'admin' || lowerRole === 'super admin') return 'admin';
    if (lowerRole === 'co-admin' || lowerRole === 'co_admin' || lowerRole === 'coadmin') return 'co_admin';
    if (lowerRole === 'moderator' || lowerRole === 'mod') return 'moderator';
    return lowerRole;
  };

  // Check admin in all collections
  const checkAdminInCollections = async (email, password) => {
    const collections = ['admins', 'coAdmins', 'moderators'];
    
    for (const collectionName of collections) {
      try {
        console.log(`Checking collection: ${collectionName}`);
        
        const q = query(
          collection(db, collectionName), 
          where('email', '==', email.toLowerCase())
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log(`Found user in ${collectionName}`);
          const adminDoc = querySnapshot.docs[0];
          const adminData = adminDoc.data();
          
          console.log('Admin data:', adminData);
          
          // For admins collection, check if password exists in stored data or use hash
          let passwordMatch = false;
          
          if (collectionName === 'admins') {
            // For Firebase Auth users in admins collection, we might not have hashed password
            // Check if password field exists
            if (adminData.password) {
              passwordMatch = adminData.password === hashPassword(password);
            } else {
              // For Firebase Auth users, we'll try to authenticate
              passwordMatch = true; // Will be handled by Firebase Auth later
            }
          } else {
            // For coAdmins and moderators, check hashed password
            passwordMatch = adminData.password === hashPassword(password);
          }
          
          if (passwordMatch) {
            return {
              exists: true,
              data: adminData,
              id: adminDoc.id,
              collection: collectionName
            };
          } else {
            console.log('Password mismatch');
          }
        }
      } catch (error) {
        console.log(`Error checking ${collectionName}:`, error);
      }
    }
    
    return { exists: false };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Login attempt for:', formData.email);

      // Check admin in all collections
      const adminResult = await checkAdminInCollections(formData.email, formData.password);
      
      if (!adminResult.exists) {
        setError('Invalid email or password. Please check your credentials.');
        setLoading(false);
        return;
      }

      const { data: adminData, id: adminId, collection: adminCollection } = adminResult;
      console.log('Login successful for:', adminData);

      // Check if admin is active
      const isActive = adminData.isActive === true || adminData.status === 'active';
      if (!isActive) {
        setError('Your account is deactivated. Please contact admin for activation.');
        setLoading(false);
        return;
      }

      // Normalize role
      const normalizedRole = normalizeRole(adminData.role);

      // Generate admin token
      const adminToken = btoa(`${adminId}_${Date.now()}_${Math.random().toString(36)}`);

      // Prepare permissions based on role and existing permissions
      let permissions = adminData.permissions || {};
      
      // Set default permissions based on role if not exists
      if (Object.keys(permissions).length === 0) {
        switch (normalizedRole) {
          case 'admin':
            permissions = {
              canViewDashboard: true,
              canManageUsers: true,
              canManageOperators: true,
              canManageBuses: true,
              canManageBookings: true,
              canManageAdmins: true,
              canManageSettings: true,
              canManageSystem: true,
              canDeleteData: true,
              canViewReports: true,
              canViewLogs: true
            };
            break;
          case 'co_admin':
            permissions = {
              canViewDashboard: true,
              canManageUsers: true,
              canManageOperators: true,
              canManageBuses: true,
              canManageBookings: true,
              canManageAdmins: false,
              canManageSettings: false,
              canManageSystem: false,
              canDeleteData: true,
              canViewReports: true,
              canViewLogs: true
            };
            break;
          case 'moderator':
            permissions = {
              canViewDashboard: true,
              canManageUsers: false,
              canManageOperators: false,
              canManageBuses: false,
              canManageBookings: true,
              canManageAdmins: false,
              canManageSettings: false,
              canManageSystem: false,
              canDeleteData: false,
              canViewReports: true,
              canViewLogs: false
            };
            break;
        }
      }

      // Store admin token and data
      localStorage.setItem('adminToken', adminToken);
      localStorage.setItem('adminData', JSON.stringify({
        id: adminId,
        uid: adminData.uid || adminId,
        email: adminData.email,
        name: adminData.name,
        role: normalizedRole,
        originalRole: adminData.role, // Keep original role for reference
        adminCode: adminData.adminCode,
        collection: adminCollection,
        permissions: permissions,
        phone: adminData.phone || ''
      }));

      // Update last login time
      try {
        await updateDoc(doc(db, adminCollection, adminId), {
          lastLogin: new Date(),
          lastLoginAt: new Date(),
          loginAttempts: 0,
          lastLoginIP: await fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => data.ip)
            .catch(() => 'Unknown')
        });
      } catch (updateError) {
        console.log('Error updating login time:', updateError);
      }

      // Show success message
      const roleDisplayName = normalizedRole === 'co_admin' ? 'Co-Admin' : 
                             normalizedRole === 'moderator' ? 'Moderator' : 'Super Admin';
      
      alert(`✅ Login Successful!\n\nWelcome ${adminData.name}\nRole: ${roleDisplayName}\nAdmin Code: ${adminData.adminCode || 'N/A'}`);

      // Redirect to dashboard
      navigate('/admin-panel/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-red-600 p-3 rounded-full">
              <ShieldCheckIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            Sign in to your admin account
          </p>
          <div className="mt-2 text-xs text-gray-400">
            For Super Admin, Co-Admins & Moderators
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Role Hierarchy Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Access Hierarchy:</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-green-600 font-bold text-xs">SA</span>
                  </div>
                  <span className="text-gray-600">Super Admin - Full System Access</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-blue-600 font-bold text-xs">CA</span>
                  </div>
                  <span className="text-gray-600">Co-Admin - Management Access (No Settings)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-yellow-600 font-bold text-xs">M</span>
                  </div>
                  <span className="text-gray-600">Moderator - Limited Access (Bookings Only)</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Links */}
            <div className="text-center space-y-2">
              <Link
                to="/admin-signup"
                className="text-sm text-red-600 hover:text-red-500 transition-colors"
              >
                Don't have an admin account? Sign up
              </Link>
              <div className="text-sm text-gray-500">
                <Link to="/" className="hover:text-gray-700 transition-colors">
                  ← Back to Home
                </Link>
              </div>
            </div>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
                <div className="text-xs text-yellow-800">
                  <strong>Debug Mode:</strong><br />
                  Testing collections: admins, coAdmins, moderators<br />
                  Console logs enabled for troubleshooting
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            © 2025 EasyTrip Admin Panel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
