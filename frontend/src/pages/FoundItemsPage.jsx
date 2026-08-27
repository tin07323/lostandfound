import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/compressImage';
import SkeletonCard from '../components/SkeletonCard';

export default function FoundItemsPage() {
  const { session, userProfile } = useAuth();
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Claiming modal state
  const [claimingItem, setClaimingItem] = useState(null);
  const [proofText, setProofText] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  // Review claims modal state
  const [reviewItem, setReviewItem] = useState(null);
  const [claimsList, setClaimsList] = useState([]);

  // Form state
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
    setItemsLoading(true);
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
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchItems();
  }, [session]);

  // Derived filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location_found?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'All' ||
        item.status?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  const handleUploadAndPost = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    let photoUrl = null;

    if (file) {
      // Compress image client-side before uploading
      const compressedFile = await compressImage(file);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('found-items')
        .upload(fileName, compressedFile);

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

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimSuccess('');

    const res = await fetch(`${API_BASE_URL}/api/claims/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        item_id: claimingItem.id,
        proof_description: proofText,
      }),
    });

    if (res.ok) {
      setClaimSuccess('Claim submitted successfully! The poster will review your proof.');
      setProofText('');
      setTimeout(() => {
        setClaimingItem(null);
        setClaimSuccess('');
      }, 2000);
    }
  };

  const openReviewModal = async (item) => {
    setReviewItem(item);
    try {
      const res = await fetch(`${API_BASE_URL}/api/claims/item/${item.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const claimsData = await res.json();
        setClaimsList(claimsData);
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
    }
  };

  const handleApproveClaim = async (claimId) => {
    const res = await fetch(`${API_BASE_URL}/api/claims/${claimId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      alert('Claim approved! Item status updated to claimed.');
      setReviewItem(null);
      fetchItems();
    }
  };

  const handleRejectClaim = async (claimId) => {
    const res = await fetch(`${API_BASE_URL}/api/claims/${claimId}/reject`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      alert('Claim rejected.');
      openReviewModal(reviewItem);
    }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Found Items Catalog</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Report Found Item'}
        </button>
      </div>

      {/* Filter & Search Bar Toolbar */}
      <div className="panel-card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Search Keywords</label>
            <input
              type="text"
              placeholder="Search title, location..."
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Category</label>
            <select
              className="form-control"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Keys">Keys</option>
              <option value="Bags & Wallets">Bags & Wallets</option>
              <option value="Books & Stationery">Books & Stationery</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Status</label>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="unclaimed">Unclaimed</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="panel-card">
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Register Found Item</h3>
          {errorMsg && <div className="alert-error">{errorMsg}</div>}

          <form onSubmit={handleUploadAndPost}>
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
                <label>Location Found</label>
                <input type="text" className="form-control" value={locationFound} onChange={(e) => setLocationFound(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Date & Time Found</label>
                <input type="datetime-local" className="form-control" value={dateFound} onChange={(e) => setDateFound(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Description / Details</label>
              <textarea className="form-control" style={{ minHeight: '80px' }} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Upload Item Photo</label>
              <input type="file" accept="image/*" className="form-control" onChange={(e) => setFile(e.target.files[0])} />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '8px' }}>
              {loading ? 'Compressing & Uploading...' : 'Post Found Item'}
            </button>
          </form>
        </div>
      )}

      {claimingItem && (
        <div className="panel-card" style={{ border: '2px solid #4f46e5' }}>
          <h3 style={{ marginBottom: '8px' }}>Claim Item: {claimingItem.item_name}</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' }}>
            Provide distinctive details (e.g., serial number, unique wallpapers or marks) to prove ownership.
          </p>
          
          {claimSuccess && <div className="alert-success">{claimSuccess}</div>}

          <form onSubmit={handleClaimSubmit}>
            <div className="form-group">
              <label>Proof of Ownership</label>
              <textarea className="form-control" style={{ minHeight: '80px' }} value={proofText} onChange={(e) => setProofText(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary">Submit Claim</button>
              <button type="button" onClick={() => setClaimingItem(null)} className="btn btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {reviewItem && (
        <div className="panel-card" style={{ border: '2px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>Claims for: {reviewItem.item_name}</h3>
            <button onClick={() => setReviewItem(null)} className="btn btn-outline" style={{ padding: '4px 8px' }}>Close</button>
          </div>

          {claimsList.length === 0 ? (
            <p style={{ color: '#64748b' }}>No pending claims submitted for this item yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {claimsList.map((c) => (
                <div key={c.id} style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Submitted Proof</span>
                    <span className="badge">{c.status.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>"{c.proof_description}"</p>
                  
                  {c.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleApproveClaim(c.id)} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem', backgroundColor: '#059669' }}>
                        Approve Claim
                      </button>
                      <button onClick={() => handleRejectClaim(c.id)} className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {itemsLoading ? (
        <div className="items-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="panel-card" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
          No catalog items matching the selected filters.
        </div>
      ) : (
        <div className="items-grid">
          {filteredItems.map((item) => (
            <div key={item.id} className="item-card">
              {item.photo_url ? (
                <img src={item.photo_url} alt={item.item_name} className="item-card-image" />
              ) : (
                <div className="item-card-placeholder">No Photo Available</div>
              )}
              <div className="item-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge">{item.category}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.status?.toLowerCase() === 'claimed' ? '#166534' : '#d97706' }}>
                    {item.status?.toUpperCase()}
                  </span>
                </div>
                <h4 className="item-title">{item.item_name}</h4>
                <p className="item-meta">📍 Found at: {item.location_found}</p>
                <p className="item-desc">{item.description}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  {item.status?.toLowerCase() === 'unclaimed' && String(item.posted_by) !== String(userProfile?.id) && (
                    <button 
                      onClick={() => setClaimingItem(item)} 
                      className="btn btn-primary btn-full" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      🖐 Claim This Item
                    </button>
                  )}

                  {(String(item.posted_by) === String(userProfile?.id) || userProfile?.role === 'admin') && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => openReviewModal(item)} 
                        className="btn btn-outline btn-full" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Review Claims
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="btn btn-danger" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}