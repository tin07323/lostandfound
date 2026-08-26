import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function MyClaimsPage() {
  const { session } = useAuth();
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchMyClaims = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/claims/my-claims`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMyClaims(data);
        }
      } catch (err) {
        console.error('Failed to fetch user claims:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchMyClaims();
  }, [session]);

  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return { backgroundColor: '#dcfce7', color: '#166534' };
      case 'rejected':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      default:
        return { backgroundColor: '#fef3c7', color: '#92400e' };
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>My Claim Requests</h2>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading your claim history...</p>
      ) : myClaims.length === 0 ? (
        <div className="panel-card" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
          You haven't submitted any claim requests yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {myClaims.map((claim) => (
            <div key={claim.id} className="panel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{claim.item_name || `Item #${claim.item_id}`}</h3>
                <span className="badge" style={getStatusBadgeStyle(claim.status)}>
                  {claim.status?.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '8px' }}>
                <strong>Submitted Proof:</strong> "{claim.proof_description}"
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Submitted on: {new Date(claim.created_at || Date.now()).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}