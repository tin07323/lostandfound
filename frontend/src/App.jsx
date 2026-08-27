import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import FoundItemsPage from './pages/FoundItemsPage';
import LostReportsPage from './pages/LostReportsPage';
import MyClaimsPage from './pages/MyClaimsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotificationsPage from './pages/NotificationsPage';
import MatchesPage from './pages/MatchesPage';

function Navigation() {
  const { session, userProfile, signOut } = useAuth();
  if (!session) return null;

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <strong style={{ fontSize: '1.1rem', color: '#4f46e5' }}>🏫 Lost & Found</strong>
        <Link to="/found" style={{ textDecoration: 'none', color: '#475569', fontWeight: 500 }}>Found Items</Link>
        <Link to="/lost" style={{ textDecoration: 'none', color: '#475569', fontWeight: 500 }}>Lost Reports</Link>
        <Link to="/matches" style={{ textDecoration: 'none', color: '#475569', fontWeight: 500 }}>✨ Matches</Link>
        <Link to="/my-claims" style={{ textDecoration: 'none', color: '#475569', fontWeight: 500 }}>My Claims</Link>
        <Link to="/notifications" style={{ textDecoration: 'none', color: '#475569', fontWeight: 500 }}>🔔 Alerts</Link>
        {userProfile?.role === 'admin' && (
          <Link to="/admin" style={{ textDecoration: 'none', color: '#4f46e5', fontWeight: 700 }}>⚙️ Admin Panel</Link>
        )}
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{userProfile?.full_name || session.user.email}</span>
        <button onClick={signOut} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Sign Out</button>
      </div>
    </nav>
  );
}

function MainRoutes() {
  const { session } = useAuth();
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 16px 40px 16px' }}>
      <Routes>
        <Route path="/auth" element={!session ? <AuthPage /> : <Navigate to="/found" />} />
        <Route path="/found" element={session ? <FoundItemsPage /> : <Navigate to="/auth" />} />
        <Route path="/lost" element={session ? <LostReportsPage /> : <Navigate to="/auth" />} />
        <Route path="/matches" element={session ? <MatchesPage /> : <Navigate to="/auth" />} />
        <Route path="/my-claims" element={session ? <MyClaimsPage /> : <Navigate to="/auth" />} />
        <Route path="/notifications" element={session ? <NotificationsPage /> : <Navigate to="/auth" />} />
        <Route path="/admin" element={session ? <AdminDashboardPage /> : <Navigate to="/auth" />} />
        <Route path="*" element={<Navigate to={session ? "/found" : "/auth"} />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <MainRoutes />
      </Router>
    </AuthProvider>
  );
}