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
      console.error('Failed to fetch found items:', err);
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
      
      const { data, error } = await supabase.storage
        .from('found-items')
        .upload(fileName, file);

      if (error) {
        setErrorMsg(`Photo upload failed: ${error.message}`);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('found-items')
        .getPublicUrl(fileName);

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
    if (!window.confirm('Delete this item?')) return;
    const res = await fetch(`${API_BASE_URL}/api/found-items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) fetchItems();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Found Items</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : '+ Post Found Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUploadAndPost} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <h3>Report a Found Item</h3>
          {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
          
          <div style={{ marginBottom: '10px' }}>
            <label>Item Name: </label>
            <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Category: </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '8px' }}>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Keys">Keys</option>
              <option value="Bags & Wallets">Bags & Wallets</option>
              <option value="Books & Stationery">Books & Stationery</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Color: </label>
            <input type="text" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Brand: </label>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Location Found: </label>
            <input type="text" value={locationFound} onChange={(e) => setLocationFound(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Date & Time Found: </label>
            <input type="datetime-local" value={dateFound} onChange={(e) => setDateFound(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Description: </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required style={{ width: '100%', padding: '8px', minHeight: '60px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Upload Photo: </label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} style={{ width: '100%' }} />
          </div>

          <button type="submit" disabled={loading} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            {loading ? 'Posting...' : 'Submit Found Item'}
          </button>
        </form>
      )}

      <div>
        {items.length === 0 ? (
          <p>No found items reported yet in this workspace.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '15px' }}>
            {items.map((item) => (
              <div key={item.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '10px', background: '#fff' }}>
                {item.photo_url ? (
                  <img src={item.photo_url} alt={item.item_name} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                  <div style={{ width: '100%', height: '160px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', color: '#888' }}>No Image</div>
                )}
                <h4>{item.item_name}</h4>
                <p style={{ fontSize: '12px', color: '#666' }}>Category: {item.category}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>Found at: {item.location_found}</p>
                <p style={{ fontSize: '13px' }}>{item.description}</p>
                
                {(item.posted_by === userProfile?.id || userProfile?.role === 'admin') && (
                  <button onClick={() => handleDelete(item.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}