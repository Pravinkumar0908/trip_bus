import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Main App Pages
import Home from './components/Home';
import SearchResult from './pages/SearchResult';
import SeatSelection from './pages/SeatSelection';
import BoardDrop from './pages/BoardDrop';
import Payment from './pages/Payment';
import Schedule from './Schedule';
import Ticket from './components/Ticket';
import Login from './Login';
import MyBookings from './pages/MyBookings';
import MyWallet from './pages/MyWallet';
import Routemap from './pages/Routemap';
import Notifications from './pages/Notifications';
import ResetPassword from './pages/ResetPassword';
import BusTimeTable from './pages/BusTimeTable';
import CoupenCode from './pages/CoupenCode';
import ReferralProgram from './pages/ReferralProgram';
import Support from './pages/Support';
import MyTravelPass from './pages/MyTravelPass';
import Profile from './pages/Profile';
import Blog from './pages/Blog';
import AboutUs from './pages/AboutUs';


// ChatBot Component
import ChatBot from './pages/ChatBot';

// Auto Feedback Component
import AutoFeedback from './components/AutoFeedback';

// Operator Panel Components
import OperatorPanel from './operator-panel/OperatorPanel';
import OperatorLogin from './operator-panel/components/Operator-Login';
import OperatorSignup from './operator-panel/components/Operator-Signup';

// Admin Panel Components
import AdminPanel from './Admin/AdminPanel';
import AdminLogin from './Admin/components/Admin-Login';
import AdminSignup from './Admin/components/Admin-Signup';

// **Component to handle universal components with path checking**
const UniversalComponents = () => {
  const location = useLocation();
  
  // **Check if current path is operator or admin panel**
  const isOperatorPanel = location.pathname.startsWith('/operator');
  const isAdminPanel = location.pathname.startsWith('/admin');
  
  // **Only show components on user-facing pages**
  const shouldShowUniversalComponents = !isOperatorPanel && !isAdminPanel;
  
  if (!shouldShowUniversalComponents) {
    return null; // Don't render anything on operator/admin panels
  }
  
  return (
    <>
      {/* ChatBot - Only on user pages */}
      <ChatBot />
      
      {/* AutoFeedback - Only on user pages */}
      <AutoFeedback />
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <div className="relative">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/ticket" element={<Ticket />} />
          <Route path="/search" element={<SearchResult />} />
          <Route path="/search-results" element={<SearchResult />} />
          <Route path="/seat-selection" element={<SeatSelection />} />
          <Route path="/boarding-points" element={<BoardDrop />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mybookings" element={<MyBookings />} />
          <Route path="/mywallet" element={<MyWallet />} />
          <Route path="/routemap" element={<Routemap />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/bus-time-table" element={<BusTimeTable />} />
          <Route path="/coupencode" element={<CoupenCode />} />
          <Route path="/referral" element={<ReferralProgram />} />
          <Route path="/support" element={<Support />} />
          <Route path="/mytravelpass" element={<MyTravelPass />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/aboutus" element={<AboutUs />} />


          {/* Operator Panel Routes */}
          <Route path="/operator-login" element={<OperatorLogin />} />
          <Route path="/operator-signup" element={<OperatorSignup />} />
          <Route path="/operator-panel/*" element={<OperatorPanel />} />

          {/* Admin Panel Routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path="/admin-panel/*" element={<AdminPanel />} />

          {/* Fallback route */}
          <Route path="*" element={<Home />} />
        </Routes>
        
        {/* Universal Components - Only show on user pages */}
        <UniversalComponents />
      </div>
    </BrowserRouter>
  );
};

export default App;
