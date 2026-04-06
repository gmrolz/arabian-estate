import React, { useState, useEffect } from 'react';

/**
 * CascadingLocationSelector
 * 4 cascading dropdowns (Levels 1–4) + manual text input for Level 5 (Compound)
 *
 * Props:
 *   locationId   – currently selected location ID (level 1–4)
 *   compound     – manual compound name (level 5 text)
 *   onChange     – ({ locationId, compound }) => void
 */
export function CascadingLocationSelector({ locationId, compound = '', onChange }) {
  const [level1List, setLevel1List] = useState([]);
  const [level2List, setLevel2List] = useState([]);
  const [level3List, setLevel3List] = useState([]);
  const [level4List, setLevel4List] = useState([]);

  const [sel1, setSel1] = useState(null); // Governorate id
  const [sel2, setSel2] = useState(null); // City id
  const [sel3, setSel3] = useState(null); // District id
  const [sel4, setSel4] = useState(null); // Sub-area id

  const [compoundName, setCompoundName] = useState(compound || '');
  const [initialized, setInitialized] = useState(false);

  // Load level 1 (Governorates) on mount
  useEffect(() => {
    fetch('/api/locations/level/1')
      .then(r => r.ok ? r.json() : [])
      .then(setLevel1List)
      .catch(() => {});
  }, []);

  // When locationId changes externally, resolve the hierarchy
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

      if (loc.level === 1) {
        setSel1(loc.id);
        loadChildren(loc.id, setLevel2List);
      } else if (loc.level === 2) {
        setSel2(loc.id);
        loadChildren(loc.id, setLevel3List);
        // Load parent chain
        if (loc.parentId) {
          const p1 = await fetch(`/api/locations/${loc.parentId}`).then(r => r.json());
          setSel1(p1.id);
          loadChildren(p1.id, setLevel2List);
        }
      } else if (loc.level === 3) {
        setSel3(loc.id);
        loadChildren(loc.id, setLevel4List);
        if (loc.parentId) {
          const p2 = await fetch(`/api/locations/${loc.parentId}`).then(r => r.json());
          setSel2(p2.id);
          loadChildren(p2.id, setLevel3List);
          if (p2.parentId) {
            const p1 = await fetch(`/api/locations/${p2.parentId}`).then(r => r.json());
            setSel1(p1.id);
            loadChildren(p1.id, setLevel2List);
          }
        }
      } else if (loc.level === 4) {
        setSel4(loc.id);
        if (loc.parentId) {
          const p3 = await fetch(`/api/locations/${loc.parentId}`).then(r => r.json());
          setSel3(p3.id);
          loadChildren(p3.id, setLevel4List);
          if (p3.parentId) {
            const p2 = await fetch(`/api/locations/${p3.parentId}`).then(r => r.json());
            setSel2(p2.id);
            loadChildren(p2.id, setLevel3List);
            if (p2.parentId) {
              const p1 = await fetch(`/api/locations/${p2.parentId}`).then(r => r.json());
              setSel1(p1.id);
              loadChildren(p1.id, setLevel2List);
            }
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

  function handleLevel1(id) {
    const numId = id ? Number(id) : null;
    setSel1(numId);
    setSel2(null); setSel3(null); setSel4(null);
    setLevel2List([]); setLevel3List([]); setLevel4List([]);
    if (numId) loadChildren(numId, setLevel2List);
    onChange({ locationId: numId, compound: compoundName });
  }

  function handleLevel2(id) {
    const numId = id ? Number(id) : null;
    setSel2(numId);
    setSel3(null); setSel4(null);
    setLevel3List([]); setLevel4List([]);
    if (numId) loadChildren(numId, setLevel3List);
    onChange({ locationId: numId || sel1, compound: compoundName });
  }

  function handleLevel3(id) {
    const numId = id ? Number(id) : null;
    setSel3(numId);
    setSel4(null);
    setLevel4List([]);
    if (numId) loadChildren(numId, setLevel4List);
    onChange({ locationId: numId || sel2 || sel1, compound: compoundName });
  }

  function handleLevel4(id) {
    const numId = id ? Number(id) : null;
    setSel4(numId);
    onChange({ locationId: numId || sel3 || sel2 || sel1, compound: compoundName });
  }

  function handleCompound(val) {
    setCompoundName(val);
    const currentLocId = sel4 || sel3 || sel2 || sel1 || locationId;
    onChange({ locationId: currentLocId, compound: val });
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
      {/* Level 1 & 2 */}
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Governorate (Level 1)</label>
          <select
            style={selectStyle}
            value={sel1 || ''}
            onChange={e => handleLevel1(e.target.value)}
          >
            <option value="">— Select Governorate —</option>
            {level1List.map(l => (
              <option key={l.id} value={l.id}>{l.nameEn} / {l.nameAr}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>City (Level 2)</label>
          <select
            style={{ ...selectStyle, opacity: level2List.length ? 1 : 0.5 }}
            value={sel2 || ''}
            onChange={e => handleLevel2(e.target.value)}
            disabled={!level2List.length}
          >
            <option value="">— Select City —</option>
            {level2List.map(l => (
              <option key={l.id} value={l.id}>{l.nameEn} / {l.nameAr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Level 3 & 4 */}
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>District (Level 3)</label>
          <select
            style={{ ...selectStyle, opacity: level3List.length ? 1 : 0.5 }}
            value={sel3 || ''}
            onChange={e => handleLevel3(e.target.value)}
            disabled={!level3List.length}
          >
            <option value="">— Select District —</option>
            {level3List.map(l => (
              <option key={l.id} value={l.id}>{l.nameEn} / {l.nameAr}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Sub-area (Level 4)</label>
          <select
            style={{ ...selectStyle, opacity: level4List.length ? 1 : 0.5 }}
            value={sel4 || ''}
            onChange={e => handleLevel4(e.target.value)}
            disabled={!level4List.length}
          >
            <option value="">— Select Sub-area —</option>
            {level4List.map(l => (
              <option key={l.id} value={l.id}>{l.nameEn} / {l.nameAr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Level 5 – Manual Compound Name */}
      <div>
        <label style={labelStyle}>Compound Name (Level 5 – enter manually)</label>
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
