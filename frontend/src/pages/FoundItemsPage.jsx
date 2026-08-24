import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function FoundItemsPage() {
  const { session, userProfile } = useAuth();
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [locationFound, setLocationFound] = useState('');
  const [dateFound, setDateFound] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/found-items/`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  };

  useEffect(() => {
    if (session) fetchItems();
  }, [session]);

  const handleUploadAndPost = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    let photoUrl = null;

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage.from('found-items').upload(fileName, file);

      if (error) {
        setErrorMsg(`Photo upload failed: ${error.message}`);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('found-items').getPublicUrl(fileName);
      photoUrl = publicUrlData.publicUrl;
    }

    const payload = {
      item_name: itemName,
      category,
      color,
      brand,
      description,
      location_found: locationFound,
      date_found: new Date(dateFound).toISOString(),
      photo_url: photoUrl,
    };

    const res = await fetch(`${API_BASE_URL}/api/found-items/`, {
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
      setLocationFound('');
      setDateFound('');
      setFile(null);
      setShowForm(false);
      fetchItems();
    } else {
      const data = await res.json();
      setErrorMsg(data.detail || 'Failed to submit found item.');
    }
    setLoading(false);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this found item?')) return;
    const res = await fetch(`${API_BASE_URL}/api/found-items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) fetchItems();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Found Items Catalog</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Report Found Item'}
        </button>
      </div>

      {showForm && (
        <div className="panel-card">
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Register Found Item</h3>
          {errorMsg && <div className="alert-error">{errorMsg}</div>}

          <form onSubmit={handleUploadAndPost}>
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
                <label>Location Found</label>
                <input
                  type="text"
                  className="form-control"
                  value={locationFound}
                  onChange={(e) => setLocationFound(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date & Time Found</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={dateFound}
                  onChange={(e) => setDateFound(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description / Details</label>
              <textarea
                className="form-control"
                style={{ minHeight: '80px' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Upload Item Photo</label>
              <input type="file" accept="image/*" className="form-control" onChange={(e) => setFile(e.target.files[0])} />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '8px' }}>
              {loading ? 'Submitting...' : 'Post Found Item'}
            </button>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="panel-card" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
          No found items reported yet in this school workspace.
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              {item.photo_url ? (
                <img src={item.photo_url} alt={item.item_name} className="item-card-image" />
              ) : (
                <div className="item-card-placeholder">No Photo Available</div>
              )}
              <div className="item-card-body">
                <span className="badge">{item.category}</span>
                <h4 className="item-title">{item.item_name}</h4>
                <p className="item-meta">📍 Found at: {item.location_found}</p>
                <p className="item-desc">{item.description}</p>

                {(item.posted_by === userProfile?.id || userProfile?.role === 'admin') && (
                  <button onClick={() => handleDelete(item.id)} className="btn btn-danger btn-full" style={{ marginTop: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
                    Remove Post
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}