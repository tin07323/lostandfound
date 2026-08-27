import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function NotificationsPage() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications/`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchNotifications();
  }, [session]);

  const getCardBorder = (type) => {
    switch (type) {
      case 'success': return '2px solid #22c55e';
      case 'danger': return '2px solid #ef4444';
      default: return '2px solid #eab308';
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>In-App Notifications</h2>

      {loading ? (
        <p style={{ color: '#64748b' }}>Checking notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="panel-card" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
          No alerts or claim updates at this time.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((note) => (
            <div key={note.id} className="panel-card" style={{ borderLeft: getCardBorder(note.type) }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>{note.title}</h4>
              <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '8px' }}>{note.message}</p>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {new Date(note.date).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}