import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LostReportsPage() {
  const { session } = useAuth();
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeMatches, setActiveMatches] = useState(null);

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [lastSeenLocation, setLastSeenLocation] = useState('');
  const [dateLost, setDateLost] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/lost-reports/`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Failed to fetch lost reports:', err);
    }
  };

  useEffect(() => {
    if (session) fetchReports();
  }, [session]);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const payload = {
      item_name: itemName,
      category,
      color,
      brand,
      description,
      last_seen_location: lastSeenLocation,
      date_lost: new Date(dateLost).toISOString(),
    };

    const res = await fetch(`${API_BASE_URL}/api/lost-reports/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setActiveMatches(data);
      setItemName('');
      setDescription('');
      setLastSeenLocation('');
      setDateLost('');
      setShowForm(false);
      fetchReports();
    } else {
      const data = await res.json();
      setErrorMsg(data.detail || 'Failed to submit report.');
    }
    setLoading(false);
  };

  const handleCheckMatches = async (reportId) => {
    const res = await fetch(`${API_BASE_URL}/api/lost-reports/${reportId}/matches`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const matchedItems = await res.json();
      const report = reports.find((r) => r.id === reportId);
      setActiveMatches({ lost_report: report, matched_items: matchedItems });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Lost Item Reports</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ File Lost Report'}
        </button>
      </div>

      {showForm && (
        <div className="panel-card">
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Submit Lost Item Report</h3>
          {errorMsg && <div className="alert-error">{errorMsg}</div>}

          <form onSubmit={handleSubmitReport}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Keys">Keys</option>
                  <option value="Bags & Wallets">Bags & Wallets</option>
                  <option value="Books & Stationery">Books & Stationery</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Color</label>
                <input type="text" className="form-control" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Brand</label>
                <input type="text" className="form-control" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Last Seen Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={lastSeenLocation}
                  onChange={(e) => setLastSeenLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date & Time Lost</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={dateLost}
                  onChange={(e) => setDateLost(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description / Identifying Marks</label>
              <textarea
                className="form-control"
                style={{ minHeight: '80px' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Analyzing Matches...' : 'Submit & Run Match Engine'}
            </button>
          </form>
        </div>
      )}

      {activeMatches && (
        <div className="match-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1e40af' }}>🔍 Match Engine Results</h3>
            <button onClick={() => setActiveMatches(null)} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
              Close
            </button>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '14px' }}>
            Automated matches for lost item: <strong>{activeMatches.lost_report?.item_name}</strong>
          </p>

          {activeMatches.matched_items.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>No corresponding found items detected yet in database.</p>
          ) : (
            <div className="items-grid">
              {activeMatches.matched_items.map((item) => (
                <div key={item.id} className="item-card">
                  {item.photo_url && <img src={item.photo_url} alt={item.item_name} className="item-card-image" />}
                  <div className="item-card-body">
                    <span className="badge">{item.category}</span>
                    <h4 className="item-title">{item.item_name}</h4>
                    <p className="item-meta">📍 Found at: {item.location_found}</p>
                    <p className="item-desc">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="panel-card" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
          No lost item reports submitted yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reports.map((report) => (
            <div key={report.id} className="panel-card" style={{ marginBottom: 0, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge" style={{ marginBottom: '4px' }}>{report.category}</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{report.item_name}</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 6px 0' }}>Last seen: {report.last_seen_location}</p>
                <p style={{ fontSize: '0.9rem', color: '#334155' }}>{report.description}</p>
              </div>
              <button onClick={() => handleCheckMatches(report.id)} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                Check Matches
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}