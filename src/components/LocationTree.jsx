import React, { useState, useEffect } from 'react';
import '../styles/location-tree.css';

export default function LocationTree({ onLocationSelect, selectedLocationId }) {
  const [locations, setLocations] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set([1])); // Expand Egypt by default
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      const governorates = await response.json();

      // Fetch all locations to build the tree
      const allLocations = await Promise.all([
        Promise.resolve(governorates),
        ...governorates.map((gov) => fetchLocationChildren(gov.id)),
      ]);

      setLocations(governorates);
      setError(null);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationChildren = async (parentId) => {
    try {
      const response = await fetch(`/api/locations/${parentId}/children`);
      if (!response.ok) return [];
      return await response.json();
    } catch (err) {
      console.error(`Error fetching children for ${parentId}:`, err);
      return [];
    }
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleLocationClick = (location) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  if (loading) {
    return <div className="location-tree loading">Loading locations...</div>;
  }

  if (error) {
    return <div className="location-tree error">Error: {error}</div>;
  }

  return (
    <div className="location-tree">
      <div className="location-tree-header">
        <h3>Locations</h3>
      </div>
      <div className="location-tree-content">
        {locations.map((location) => (
          <LocationNode
            key={location.id}
            location={location}
            level={location.level}
            isExpanded={expandedNodes.has(location.id)}
            onToggle={toggleNode}
            onSelect={handleLocationClick}
            isSelected={selectedLocationId === location.id}
          />
        ))}
      </div>
    </div>
  );
}

function LocationNode({ location, level, isExpanded, onToggle, onSelect, isSelected }) {
  const [children, setChildren] = useState([]);
  const [hasChildren, setHasChildren] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);

  useEffect(() => {
    // Check if location has children
    if (level < 5) {
      checkForChildren();
    }
  }, [location.id, level]);

  const checkForChildren = async () => {
    try {
      const response = await fetch(`/api/locations/${location.id}/children`);
      if (response.ok) {
        const childData = await response.json();
        setHasChildren(childData.length > 0);
        if (isExpanded && childData.length > 0) {
          setChildren(childData);
        }
      }
    } catch (err) {
      console.error('Error checking for children:', err);
    }
  };

  const handleToggle = async () => {
    onToggle(location.id);

    if (!isExpanded && children.length === 0 && hasChildren) {
      setLoadingChildren(true);
      try {
        const response = await fetch(`/api/locations/${location.id}/children`);
        if (response.ok) {
          const childData = await response.json();
          setChildren(childData);
        }
      } catch (err) {
        console.error('Error fetching children:', err);
      } finally {
        setLoadingChildren(false);
      }
    }
  };

  const indent = (level - 1) * 20;
  const listingCount = location.listingCount || 0;

  return (
    <div className="location-node">
      <div
        className={`location-node-item ${isSelected ? 'selected' : ''}`}
        style={{ marginLeft: `${indent}px` }}
      >
        {hasChildren && (
          <button
            className={`toggle-btn ${isExpanded ? 'expanded' : ''}`}
            onClick={handleToggle}
            disabled={loadingChildren}
          >
            {loadingChildren ? '...' : isExpanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="toggle-placeholder"></span>}

        <button
          className="location-name-btn"
          onClick={() => onSelect(location)}
        >
          <span className="location-name">{location.nameEn}</span>
          <span className={`listing-count ${listingCount > 0 ? 'active' : 'empty'}`}>
            ({listingCount})
          </span>
        </button>
      </div>

      {isExpanded && children.length > 0 && (
        <div className="location-children">
          {children.map((child) => (
            <LocationNode
              key={child.id}
              location={child}
              level={child.level}
              isExpanded={expandedNodes?.has(child.id) || false}
              onToggle={onToggle}
              onSelect={onSelect}
              isSelected={selectedLocationId === child.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper hook to manage expanded state
function useExpandedNodes(initialExpanded = new Set([1])) {
  const [expandedNodes, setExpandedNodes] = React.useState(initialExpanded);
  return [expandedNodes, setExpandedNodes];
}
