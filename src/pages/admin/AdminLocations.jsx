import React, { useState, useEffect } from 'react';

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedParents, setExpandedParents] = useState(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    nameEn: '',
    nameAr: '',
    level: 2,
    parentId: null,
  });

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setLocations(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (parentId) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      const slug = newLocation.nameEn.toLowerCase().replace(/\s+/g, '-');
      const payload = {
        nameEn: newLocation.nameEn,
        nameAr: newLocation.nameAr,
        slug,
        level: newLocation.level,
        parentId: newLocation.parentId,
      };
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add location');
      }
      
      setNewLocation({ nameEn: '', nameAr: '', level: 2, parentId: null });
      setShowAddForm(false);
      await fetchLocations();
    } catch (err) {
      setError(err.message);
      console.error('Error adding location:', err);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    
    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete location');
      }
      await fetchLocations();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting location:', err);
    }
  };

  const buildHierarchy = (items, parentId = null, level = 0) => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => (
        <div key={item.id} style={{ marginLeft: `${level * 20}px` }} className="location-item">
          <div className="location-row">
            <div className="location-info">
              {items.some(i => i.parentId === item.id) && (
                <button
                  className="expand-btn"
                  onClick={() => toggleExpand(item.id)}
                >
                  {expandedParents.has(item.id) ? '▼' : '▶'}
                </button>
              )}
              <span className="location-name">
                {item.nameEn} / {item.nameAr}
              </span>
              <span className="location-level">Level {item.level}</span>
              <span className="listing-count">({item.listingCount} listings)</span>
            </div>
            <button
              className="delete-btn"
              onClick={() => handleDeleteLocation(item.id)}
              title="Delete location"
            >
              ✕
            </button>
          </div>
          
          {expandedParents.has(item.id) && buildHierarchy(items, item.id, level + 1)}
        </div>
      ));
  };

  if (loading) return <div className="admin-page"><p>Loading locations...</p></div>;

  return (
    <div className="admin-page admin-locations">
      <div className="admin-header">
        <h1>Location Management</h1>
        <button
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Location'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && (
        <form className="add-location-form" onSubmit={handleAddLocation}>
          <div className="form-group">
            <label>English Name *</label>
            <input
              type="text"
              value={newLocation.nameEn}
              onChange={(e) => setNewLocation({ ...newLocation, nameEn: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Arabic Name *</label>
            <input
              type="text"
              value={newLocation.nameAr}
              onChange={(e) => setNewLocation({ ...newLocation, nameAr: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Level *</label>
            <select
              value={newLocation.level}
              onChange={(e) => setNewLocation({ ...newLocation, level: parseInt(e.target.value) })}
            >
              <option value={1}>1 - Governorate</option>
              <option value={2}>2 - City</option>
              <option value={3}>3 - District</option>
              <option value={4}>4 - Sub-area</option>
              <option value={5}>5 - Compound</option>
            </select>
          </div>
          <div className="form-group">
            <label>Parent Location (optional)</label>
            <select
              value={newLocation.parentId || ''}
              onChange={(e) => setNewLocation({ ...newLocation, parentId: e.target.value ? parseInt(e.target.value) : null })}
            >
              <option value="">None (Top Level)</option>
              {locations.filter(l => l.level < newLocation.level).map(l => (
                <option key={l.id} value={l.id}>
                  {l.nameEn} ({l.level})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">Add Location</button>
        </form>
      )}

      <div className="locations-tree">
        <h2>Location Hierarchy</h2>
        {locations.length === 0 ? (
          <p>No locations found</p>
        ) : (
          buildHierarchy(locations)
        )}
      </div>

      <style>{`
        .admin-locations {
          padding: 20px;
        }
        
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .add-location-form {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group label {
          font-weight: 600;
          margin-bottom: 5px;
          font-size: 14px;
        }
        
        .form-group input,
        .form-group select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .locations-tree {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
        }
        
        .location-item {
          margin-bottom: 10px;
        }
        
        .location-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 4px;
          border-left: 3px solid #c90411;
        }
        
        .location-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        
        .expand-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          padding: 0;
          width: 20px;
          text-align: center;
        }
        
        .location-name {
          font-weight: 600;
          flex: 1;
        }
        
        .location-level {
          background: #e8e8e8;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 12px;
        }
        
        .listing-count {
          font-size: 12px;
          color: #666;
        }
        
        .delete-btn {
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 5px 10px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .delete-btn:hover {
          background: #cc0000;
        }
        
        .btn-primary {
          background: #c90411;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        
        .btn-primary:hover {
          background: #a00310;
        }
        
        .error-message {
          background: #fee;
          color: #c00;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
}
