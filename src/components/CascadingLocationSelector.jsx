import { useState, useEffect } from 'react';

/**
 * CascadingLocationSelector
 * 3 cascading dropdowns (Levels 2–4) + manual text input for Level 5 (Compound)
 * Level 1 (Egypt) is skipped — Cities load directly on mount.
 *
 * Props:
 *   locationId   – currently selected location ID (level 2–4)
 *   compound     – manual compound name (level 5 text)
 *   onChange     – ({ locationId, compound }) => void
 */
export function CascadingLocationSelector({ locationId, compound = '', onChange }) {
  const [cityList, setCityList]       = useState([]); // Level 2
  const [collList, setCollList]       = useState([]); // Level 3
  const [areaList, setAreaList]       = useState([]); // Level 4

  const [selCity, setSelCity] = useState(null);
  const [selColl, setSelColl] = useState(null);
  const [selArea, setSelArea] = useState(null);

  const [compoundName, setCompoundName] = useState(compound || '');
  const [initialized, setInitialized]   = useState(false);

  // Load all Level-2 cities on mount (children of Egypt, id=39)
  useEffect(() => {
    fetch('/api/locations/39/children')
      .then(r => r.ok ? r.json() : [])
      .then(setCityList)
      .catch(() => {});
  }, []);

  // When locationId changes externally, resolve the full hierarchy
  useEffect(() => {
    if (!locationId || initialized) return;
    resolveHierarchy(locationId);
  }, [locationId, initialized]);

  // Sync compound text from prop
  useEffect(() => {
    setCompoundName(compound || '');
  }, [compound]);

  async function resolveHierarchy(id) {
    try {
      const res = await fetch(`/api/locations/${id}`);
      if (!res.ok) return;
      const loc = await res.json();

      if (loc.level === 2) {
        setSelCity(loc.id);
        loadChildren(loc.id, setCollList);
      } else if (loc.level === 3) {
        setSelColl(loc.id);
        loadChildren(loc.id, setAreaList);
        if (loc.parentId) {
          setSelCity(loc.parentId);
          loadChildren(loc.parentId, setCollList);
        }
      } else if (loc.level === 4) {
        setSelArea(loc.id);
        if (loc.parentId) {
          const p3 = await fetch(`/api/locations/${loc.parentId}`).then(r => r.json());
          setSelColl(p3.id);
          loadChildren(p3.id, setAreaList);
          if (p3.parentId) {
            setSelCity(p3.parentId);
            loadChildren(p3.parentId, setCollList);
          }
        }
      }
      setInitialized(true);
    } catch (e) {
      console.error('resolveHierarchy error', e);
    }
  }

  function loadChildren(parentId, setter) {
    fetch(`/api/locations/${parentId}/children`)
      .then(r => r.ok ? r.json() : [])
      .then(setter)
      .catch(() => {});
  }

  // Build a human-readable location string from current selections
  function buildLocationLabel(cityId, collId, areaId, compound) {
    const parts = [];
    if (areaId) {
      const a = areaList.find(l => l.id === areaId);
      if (a) parts.push(a.nameEn);
    }
    if (collId) {
      const c = collList.find(l => l.id === collId);
      if (c) parts.push(c.nameEn);
    }
    if (cityId) {
      const ci = cityList.find(l => l.id === cityId);
      if (ci) parts.push(ci.nameEn);
    }
    if (compound) parts.unshift(compound);
    return parts.join(', ');
  }

  function handleCity(id) {
    const numId = id ? Number(id) : null;
    setSelCity(numId);
    setSelColl(null); setSelArea(null);
    setCollList([]); setAreaList([]);
    if (numId) loadChildren(numId, setCollList);
    const label = buildLocationLabel(numId, null, null, compoundName);
    // Fetch the location to get its slug
    if (numId) {
      fetch(`/api/locations/${numId}`)
        .then(r => r.ok ? r.json() : null)
        .then(loc => {
          onChange({ locationId: numId, compound: compoundName, locationLabel: label, slug: loc?.slug });
        })
        .catch(() => onChange({ locationId: numId, compound: compoundName, locationLabel: label }));
    } else {
      onChange({ locationId: numId, compound: compoundName, locationLabel: label });
    }
  }

  function handleColl(id) {
    const numId = id ? Number(id) : null;
    setSelColl(numId);
    setSelArea(null);
    setAreaList([]);
    if (numId) loadChildren(numId, setAreaList);
    const label = buildLocationLabel(selCity, numId, null, compoundName);
    // Fetch the location to get its slug
    const locId = numId || selCity;
    if (locId) {
      fetch(`/api/locations/${locId}`)
        .then(r => r.ok ? r.json() : null)
        .then(loc => {
          onChange({ locationId: locId, compound: compoundName, locationLabel: label, slug: loc?.slug });
        })
        .catch(() => onChange({ locationId: locId, compound: compoundName, locationLabel: label }));
    } else {
      onChange({ locationId: locId, compound: compoundName, locationLabel: label });
    }
  }

  function handleArea(id) {
    const numId = id ? Number(id) : null;
    setSelArea(numId);
    const label = buildLocationLabel(selCity, selColl, numId, compoundName);
    // Fetch the location to get its slug
    const locId = numId || selColl || selCity;
    if (locId) {
      fetch(`/api/locations/${locId}`)
        .then(r => r.ok ? r.json() : null)
        .then(loc => {
          onChange({ locationId: locId, compound: compoundName, locationLabel: label, slug: loc?.slug });
        })
        .catch(() => onChange({ locationId: locId, compound: compoundName, locationLabel: label }));
    } else {
      onChange({ locationId: locId, compound: compoundName, locationLabel: label });
    }
  }

  function handleCompound(val) {
    setCompoundName(val);
    const currentLocId = selArea || selColl || selCity || locationId;
    const label = buildLocationLabel(selCity, selColl, selArea, val);
    onChange({ locationId: currentLocId, compound: val, locationLabel: label });
  }

  const selectStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#fff',
    color: '#1a202c',
    cursor: 'pointer',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#718096',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '12px',
  };

  return (
    <div className="cascading-location-selector">
      {/* Level 2 & 3 */}
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>City — المدينة</label>
          <select
            style={selectStyle}
            value={selCity || ''}
            onChange={e => handleCity(e.target.value)}
          >
            <option value="">— Select City —</option>
            {cityList.map(l => (
              <option key={l.id} value={l.id}>{l.nameEn} / {l.nameAr}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Collection — المنطقة (e.g. East Cairo, North Coast)</label>
          <select
            style={{ ...selectStyle, opacity: collList.length ? 1 : 0.5 }}
            value={selColl || ''}
            onChange={e => handleColl(e.target.value)}
            disabled={!collList.length}
          >
            <option value="">— Select Collection —</option>
            {collList.map(l => (
              <option key={l.id} value={l.id}>{l.nameEn} / {l.nameAr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Level 4 */}
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Neighborhood — الحي (e.g. New Capital, Madinaty)</label>
        <select
          style={{ ...selectStyle, opacity: areaList.length ? 1 : 0.5 }}
          value={selArea || ''}
          onChange={e => handleArea(e.target.value)}
          disabled={!areaList.length}
        >
          <option value="">— Select Neighborhood —</option>
          {areaList.map(l => (
            <option key={l.id} value={l.id}>{l.nameEn} / {l.nameAr}</option>
          ))}
        </select>
      </div>

      {/* Level 5 – Manual Compound Name */}
      <div>
        <label style={labelStyle}>Compound Name — اسم الكمباوند (enter manually)</label>
        <input
          type="text"
          className="admin-input"
          value={compoundName}
          onChange={e => handleCompound(e.target.value)}
          placeholder="e.g. Palm Hills, Hyde Park, Madinaty..."
          style={{ width: '100%' }}
        />
        <span style={{ fontSize: '11px', color: '#999', marginTop: '4px', display: 'block' }}>
          Type the compound name directly — this is Level 5 of the location hierarchy
        </span>
      </div>
    </div>
  );
}
