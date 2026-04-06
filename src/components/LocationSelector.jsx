import React, { useState, useEffect, useRef } from 'react';

export function LocationSelector({ value, onChange, placeholder = 'Search locations...' }) {
  const [search, setSearch] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch locations on mount and when search changes
  useEffect(() => {
    if (!search.trim()) {
      setLocations([]);
      return;
    }

    const fetchLocations = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(search)}`);
        if (response.ok) {
          const data = await response.json();
          setLocations(data);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchLocations, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch selected location details
  useEffect(() => {
    if (value && !selectedLocation) {
      fetch(`/api/locations/${value}`)
        .then((res) => res.ok && res.json())
        .then((data) => setSelectedLocation(data))
        .catch((err) => console.error('Error fetching location:', err));
    }
  }, [value, selectedLocation]);

  const handleSelect = (location) => {
    setSelectedLocation(location);
    onChange(location.id);
    setSearch('');
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedLocation(null);
    onChange(null);
    setSearch('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="location-selector">
      <div className="location-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={search || (selectedLocation ? selectedLocation.nameEn : '')}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="location-input"
        />
        {selectedLocation && (
          <button
            type="button"
            className="location-clear-btn"
            onClick={handleClear}
            title="Clear selection"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div ref={dropdownRef} className="location-dropdown">
          {loading && <div className="location-loading">Loading...</div>}
          {!loading && locations.length === 0 && search && (
            <div className="location-empty">No locations found</div>
          )}
          {!loading && locations.length > 0 && (
            <ul className="location-list">
              {locations.map((loc) => (
                <li key={loc.id} className="location-item">
                  <button
                    type="button"
                    onClick={() => handleSelect(loc)}
                    className="location-button"
                  >
                    <span className="location-name">{loc.nameEn}</span>
                    <span className="location-meta">
                      {loc.nameAr} • Level {loc.level}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedLocation && (
        <div className="location-selected">
          <strong>{selectedLocation.nameEn}</strong>
          <span className="location-breadcrumb">{selectedLocation.nameAr}</span>
        </div>
      )}
    </div>
  );
}
