import { useState, useEffect } from 'react';

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedParents, setExpandedParents] = useState(new Set());
  const [showAddForm, setShowAddForm] = useState(null); // null or parentId
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
      const response = await fetch('/api/locations/all');
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

  const handleAddLocation = async (e, parentId) => {
    e.preventDefault();
    try {
      const parentLocation = locations.find(l => l.id === parentId);
      const newLevel = parentLocation ? parentLocation.level + 1 : 2;
      
      const slug = newLocation.nameEn.toLowerCase().replace(/\s+/g, '-');
      const payload = {
        nameEn: newLocation.nameEn,
        nameAr: newLocation.nameAr,
        slug,
        level: newLevel,
        parentId: parentId || null,
      };
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to add location');
      
      await fetchLocations();
      setShowAddForm(null);
      setNewLocation({ nameEn: '', nameAr: '', level: 2, parentId: null });
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error('Error adding location:', err);
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
              <button
                className="add-here-btn"
                onClick={() => {
                  setShowAddForm(item.id);
                  setNewLocation({ nameEn: '', nameAr: '', level: item.level + 1, parentId: item.id });
                }}
              >
                + Add here
              </button>
            </div>
          </div>
          
          {showAddForm === item.id && (
            <div className="add-location-form" style={{ marginLeft: `${(level + 1) * 20}px` }}>
              <form onSubmit={(e) => handleAddLocation(e, item.id)}>
                <input
                  type="text"
                  placeholder="English name"
                  value={newLocation.nameEn}
                  onChange={(e) => setNewLocation({ ...newLocation, nameEn: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Arabic name"
                  value={newLocation.nameAr}
                  onChange={(e) => setNewLocation({ ...newLocation, nameAr: e.target.value })}
                  required
                />
                <button type="submit">Add</button>
                <button type="button" onClick={() => setShowAddForm(null)}>Cancel</button>
              </form>
            </div>
          )}
          
          {expandedParents.has(item.id) && buildHierarchy(items, item.id, level + 1)}
        </div>
      ));
  };

  if (loading) return <div className="admin-page"><p>Loading locations...</p></div>;

  return (
    <div className="admin-page admin-locations">
      <div className="admin-header">
        <h1>Location Management</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="locations-tree">
        {buildHierarchy(locations)}
      </div>

      <style>{`
        .admin-locations {
          padding: 20px;
        }

        .locations-tree {
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          max-height: 600px;
          overflow-y: auto;
        }

        .location-item {
          margin: 10px 0;
        }

        .location-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .location-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .expand-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          padding: 4px 8px;
          color: #666;
        }

        .location-name {
          font-weight: 500;
          min-width: 200px;
        }

        .location-level {
          font-size: 12px;
          color: #999;
          background: #eee;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .listing-count {
          font-size: 12px;
          color: #666;
        }

        .add-here-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .add-here-btn:hover {
          background: #0056b3;
        }

        .add-location-form {
          background: #f0f8ff;
          border: 1px solid #b3d9ff;
          border-radius: 4px;
          padding: 12px;
          margin: 10px 0;
          display: flex;
          gap: 8px;
        }

        .add-location-form input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 12px;
        }

        .add-location-form button {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .add-location-form button[type="submit"] {
          background: #28a745;
          color: white;
        }

        .add-location-form button[type="submit"]:hover {
          background: #218838;
        }

        .add-location-form button[type="button"] {
          background: #6c757d;
          color: white;
        }

        .add-location-form button[type="button"]:hover {
          background: #5a6268;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
}
