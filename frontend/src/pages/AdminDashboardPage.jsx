import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const { session, userProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${session.access_token}` };
      
      const statsRes = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        setErrorMsg('Failed to load admin metrics. Verify admin permissions.');
      }

      const usersRes = await fetch(`${API_BASE_URL}/api/admin/users`, { headers });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (err) {
      console.error('Admin dashboard error:', err);
      setErrorMsg('Network error fetching admin records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchAdminData();
  }, [session]);

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchAdminData();
      } else {
        alert('Failed to update role.');
      }
    } catch (err) {
      console.error('Role update error:', err);
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <div className="panel-card" style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
        <h3>⛔ Access Denied</h3>
        <p>You must have Administrative privileges to view this section.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Admin Workspace & System Analytics</h2>

      {errorMsg && <div className="alert-error" style={{ marginBottom: '16px' }}>{errorMsg}</div>}

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading metric counters...</p>
      ) : (
        <>
          {/* Analytics Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="panel-card" style={{ textAlign: 'center', padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Found</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#4f46e5' }}>{stats?.total_found_items || 0}</div>
            </div>
            <div className="panel-card" style={{ textAlign: 'center', padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Unclaimed</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d97706' }}>{stats?.unclaimed_items || 0}</div>
            </div>
            <div className="panel-card" style={{ textAlign: 'center', padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Returned</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#059669' }}>{stats?.claimed_items || 0}</div>
            </div>
            <div className="panel-card" style={{ textAlign: 'center', padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Lost Reports</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2563eb' }}>{stats?.total_lost_reports || 0}</div>
            </div>
            <div className="panel-card" style={{ textAlign: 'center', padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>School Users</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#475569' }}>{stats?.total_school_users || 0}</div>
            </div>
          </div>

          {/* User Role Management Table */}
          <div className="panel-card">
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>User Role Management</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px' }}>Full Name</th>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px' }}>Current Role</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{u.full_name || 'N/A'}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{u.email}</td>
                      <td style={{ padding: '10px' }}>
                        <span className="badge" style={{ backgroundColor: u.role === 'admin' ? '#e0e7ff' : '#f1f5f9', color: u.role === 'admin' ? '#3730a3' : '#475569' }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {u.id !== userProfile?.id && (
                          <button
                            onClick={() => handleToggleRole(u.id, u.role)}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            {u.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}