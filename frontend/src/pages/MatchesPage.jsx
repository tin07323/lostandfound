import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function MatchesPage() {
  const { session } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/matches/my-matches`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMatches(data);
        }
      } catch (err) {
        console.error('Failed to fetch automated matches:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchMatches();
  }, [session]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#166534';
    if (score >= 60) return '#d97706';
    return '#475569';
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>Automated Item Matches</h2>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px' }}>
        System recommendations matching your reported lost items against current found item catalog entries.
      </p>

      {loading ? (
        <p style={{ color: '#64748b' }}>Running match comparison engine...</p>
      ) : matches.length === 0 ? (
        <div className="panel-card" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
          No automatic matches identified for your reported lost items yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {matches.map((match) => (
            <div key={match.id} className="panel-card" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {match.found_item.photo_url ? (
                <img
                  src={match.found_item.photo_url}
                  alt={match.found_item.item_name}
                  style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ width: '120px', height: '120px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                  No Photo
                </div>
              )}

              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4f46e5' }}>
                    Lost Report: "{match.lost_item_name}"
                  </span>
                  <span className="badge" style={{ backgroundColor: '#e0e7ff', color: getScoreColor(match.confidence_score), fontWeight: 700 }}>
                    {match.confidence_score}% Confidence Match
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>Found: {match.found_item.item_name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>📍 Found at: {match.found_item.location_found}</p>
                
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {match.match_reasons.map((reason, idx) => (
                    <span key={idx} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                      ✓ {reason}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/found')}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  View in Catalog & Claim Item
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}