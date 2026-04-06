import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin-locations.css';

export default function AdminLocations() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [expandedParents, setExpandedParents] = useState(new Set([1]));
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    slug: '',
    level: 2,
    parentId: 1,
  });

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
      console.error('Error fetching locations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.nameEn || !formData.nameAr || !formData.slug) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add location');

      // Reset form and refresh
      setFormData({ nameEn: '', nameAr: '', slug: '', level: 2, parentId: 1 });
      setShowAddForm(false);
      await fetchLocations();
      alert('Location added successfully!');
    } catch (err) {
      console.error('Error adding location:', err);
      alert('Error adding location: ' + err.message);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete location');

      await fetchLocations();
      alert('Location deleted successfully!');
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Error deleting location: ' + err.message);
    }
  };

  const toggleParent = (parentId) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  const getLocationsByLevel = (level) => {
    return locations.filter((loc) => loc.level === level);
  };

  const getLocationsByParent = (parentId) => {
    return locations.filter((loc) => loc.parentId === parentId);
  };

  const getLevelName = (level) => {
    const names = { 1: 'Governorate', 2: 'City', 3: 'District', 4: 'Sub-area', 5: 'Compound' };
    return names[level] || `Level ${level}`;
  };

  if (loading) {
    return <div className="admin-locations loading">Loading locations...</div>;
  }

  return (
    <div className="admin-locations">
      <div className="admin-locations-header">
        <h1>Location Management</h1>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Location'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && (
        <div className="add-location-form">
          <h2>Add New Location</h2>
          <form onSubmit={handleAddLocation}>
            <div className="form-group">
              <label>Name (English) *</label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="e.g., Cairo"
              />
            </div>

            <div className="form-group">
              <label>Name (Arabic) *</label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="e.g., القاهرة"
                dir="rtl"
              />
            </div>

            <div className="form-group">
              <label>Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., cairo"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                >
                  <option value={2}>City</option>
                  <option value={3}>District</option>
                  <option value={4}>Sub-area</option>
                  <option value={5}>Compound</option>
                </select>
              </div>

              <div className="form-group">
                <label>Parent Location</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: Number(e.target.value) })}
                >
                  {locations
                    .filter((loc) => loc.level === formData.level - 1)
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nameEn}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-success">
              Add Location
            </button>
          </form>
        </div>
      )}

      <div className="location-tree-admin">
        <div className="tree-section">
          <h2>Location Hierarchy</h2>
          <div className="tree-content">
            {getLocationsByLevel(1).map((gov) => (
              <LocationTreeNode
                key={gov.id}
                location={gov}
                locations={locations}
                expandedParents={expandedParents}
                onToggle={toggleParent}
                onDelete={handleDeleteLocation}
                getLocationsByParent={getLocationsByParent}
              />
            ))}
          </div>
        </div>

        <div className="stats-section">
          <h2>Statistics</h2>
          <div className="stats-grid">
            {[1, 2, 3, 4, 5].map((level) => {
              const count = getLocationsByLevel(level).length;
              const totalListings = getLocationsByLevel(level).reduce(
                (sum, loc) => sum + (loc.listingCount || 0),
                0
              );
              return (
                <div key={level} className="stat-card">
                  <div className="stat-label">{getLevelName(level)}</div>
                  <div className="stat-value">{count}</div>
                  <div className="stat-sublabel">
                    {totalListings} listings
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationTreeNode({
  location,
  locations,
  expandedParents,
  onToggle,
  onDelete,
  getLocationsByParent,
}) {
  const children = getLocationsByParent(location.id);
  const isExpanded = expandedParents.has(location.id);

  return (
    <div className="tree-node">
      <div className="tree-node-item">
        {children.length > 0 && (
          <button
            className={`toggle-btn ${isExpanded ? 'expanded' : ''}`}
            onClick={() => onToggle(location.id)}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        {children.length === 0 && <span className="toggle-placeholder"></span>}

        <div className="node-info">
          <span className="node-name">{location.nameEn}</span>
          <span className="node-meta">
            {location.nameAr} • {location.listingCount || 0} listings
          </span>
        </div>

        <button
          className="btn-delete"
          onClick={() => onDelete(location.id)}
          title="Delete location"
        >
          ✕
        </button>
      </div>

      {isExpanded && children.length > 0 && (
        <div className="tree-children">
          {children.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child}
              locations={locations}
              expandedParents={expandedParents}
              onToggle={onToggle}
              onDelete={onDelete}
              getLocationsByParent={getLocationsByParent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
