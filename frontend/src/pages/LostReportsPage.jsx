import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LostReportsPage() {
  const { session, userProfile } = useAuth();
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState(null);
  const [matchItems, setMatchItems] = useState([]);

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [locationLost, setLocationLost] = useState('');
  const [dateLost, setDateLost] = useState('');
  const [reward, setReward] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      item_name: itemName,
      category,
      color,
      brand,
      description,
      location_lost: locationLost,
      date_lost: new Date(dateLost).toISOString(),
      reward: reward || null,
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
      setItemName('');
      setDescription('');
      setLocationLost('');
      setDateLost('');
      setReward('');
      setShowForm(false);
      fetchReports();
    }
  };

  const handleCheckMatches = async (report) => {
    setSelectedMatches(report);
    try {
      const res = await fetch(`${API_BASE_URL}/api/matches/lost/${report.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMatchItems(data);
      }
    } catch (err) {
      console.error('Failed to check matches:', err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Lost Item Reports</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Report Lost Item'}
        </button>
      </div>

      {showForm && (
        <div className="panel-card">
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Create Lost Item Report</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Item Name</label>
                <input type="text" className="form-control" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
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
                <label>Location Lost</label>
                <input type="text" className="form-control" value={locationLost} onChange={(e) => setLocationLost(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Date Lost</label>
                <input type="datetime-local" className="form-control" value={dateLost} onChange={(e) => setDateLost(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Reward Offered (Optional)</label>
              <input type="text" className="form-control" placeholder="e.g. $20 / Free Coffee" value={reward} onChange={(e) => setReward(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Description / Details</label>
              <textarea className="form-control" style={{ minHeight: '80px' }} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary">Submit Report</button>
          </form>
        </div>
      )}

      {selectedMatches && (
        <div className="panel-card" style={{ border: '2px solid #6366f1', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>🔍 Potential Found Matches for: "{selectedMatches.item_name}"</h3>
            <button onClick={() => setSelectedMatches(null)} className="btn btn-outline" style={{ padding: '4px 8px' }}>Close</button>
          </div>

          {matchItems.length === 0 ? (
            <p style={{ color: '#64748b' }}>No matching unclaimed items found in the database yet.</p>
          ) : (
            <div className="items-grid">
              {matchItems.map((item) => (
                <div key={item.id} className="item-card" style={{ border: '1px solid #c7d2fe' }}>
                  {item.photo_url ? (
                    <img src={item.photo_url} alt={item.item_name} className="item-card-image" />
                  ) : (
                    <div className="item-card-placeholder">No Photo</div>
                  )}
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
          No active lost reports for this school workspace.
        </div>
      ) : (
        <div className="items-grid">
          {reports.map((report) => (
            <div key={report.id} className="item-card">
              <div className="item-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge">{report.category}</span>
                  {report.reward && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>🎁 {report.reward}</span>}
                </div>
                <h4 className="item-title">{report.item_name}</h4>
                <p className="item-meta">📍 Lost near: {report.location_lost}</p>
                <p className="item-desc">{report.description}</p>

                <button onClick={() => handleCheckMatches(report)} className="btn btn-outline btn-full" style={{ marginTop: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}>
                  🔍 Find Matches
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}