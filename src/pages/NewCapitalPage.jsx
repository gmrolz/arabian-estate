import { useState, useMemo } from 'react';
import { useListings } from '../context/ListingsContext';
import { getUniqueValues } from '../data/newCapitalListings';
import PropertyCard from '../components/PropertyCard';

export default function NewCapitalPage() {
    const { listings } = useListings();
    const [filterDev, setFilterDev] = useState('');
    const [filterFinishing, setFilterFinishing] = useState('');
    const [filterDelivery, setFilterDelivery] = useState('');
    const [filterRooms, setFilterRooms] = useState('');

    const developers = getUniqueValues('developer');
    const finishings = getUniqueValues('finishing');
    const rooms = getUniqueValues('rooms').map(String);

    const filtered = useMemo(() => {
        return listings.filter((l) => {
            if (filterDev && l.developer !== filterDev) return false;
            if (filterFinishing && l.finishing !== filterFinishing) return false;
            if (filterRooms && String(l.rooms) !== filterRooms) return false;
            if (filterDelivery) {
                const ready = l.delivery?.toLowerCase().includes('ready');
                if (filterDelivery === 'ready' && !ready) return false;
                if (filterDelivery === 'offplan' && ready) return false;
            }
            return true;
        });
    }, [listings, filterDev, filterFinishing, filterRooms, filterDelivery]);

    const resetFilters = () => {
        setFilterDev('');
        setFilterFinishing('');
        setFilterDelivery('');
        setFilterRooms('');
    };

    return (
        <div className="listing-page">
            {/* PAGE HERO */}
            <div className="listing-hero">
                <div className="listing-hero-inner">
                    <div className="section-tag">Arabian Estate Inventory</div>
                    <h1 className="listing-title">
                        New <span>Capital</span> Properties
                    </h1>
                    <p className="listing-subtitle">
                        Browse {listings.length} exclusive listings — apartments from Egypt's top developers,
                        handpicked for value and location.
                    </p>

                    {/* FILTERS */}
                    <div className="filters">
                        <select
                            className="filter-select"
                            value={filterDev}
                            onChange={(e) => setFilterDev(e.target.value)}
                            aria-label="Filter by developer"
                        >
                            <option value="">All Developers</option>
                            {developers.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>

                        <select
                            className="filter-select"
                            value={filterFinishing}
                            onChange={(e) => setFilterFinishing(e.target.value)}
                            aria-label="Filter by finishing"
                        >
                            <option value="">All Finishing</option>
                            {finishings.map((f) => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>

                        <select
                            className="filter-select"
                            value={filterRooms}
                            onChange={(e) => setFilterRooms(e.target.value)}
                            aria-label="Filter by bedrooms"
                        >
                            <option value="">All Bedrooms</option>
                            {rooms.map((r) => (
                                <option key={r} value={r}>{r} Bedroom{r !== '1' ? 's' : ''}</option>
                            ))}
                        </select>

                        <select
                            className="filter-select"
                            value={filterDelivery}
                            onChange={(e) => setFilterDelivery(e.target.value)}
                            aria-label="Filter by delivery"
                        >
                            <option value="">All Status</option>
                            <option value="ready">Ready to Move</option>
                            <option value="offplan">Off-Plan</option>
                        </select>

                        <button className="filter-reset" onClick={resetFilters}>
                            Reset
                        </button>

                        <span className="results-count">
                            Showing <strong>{filtered.length}</strong> of {listings.length} listings
                        </span>
                    </div>
                </div>
            </div>

            {/* LISTINGS GRID */}
            <div className="listing-grid-section">
                <div className="listing-grid">
                    {filtered.length > 0 ? (
                        filtered.map((listing) => (
                            <PropertyCard key={listing.id} listing={listing} />
                        ))
                    ) : (
                        <div className="no-results">
                            <div className="no-results-icon" aria-hidden="true" />
                            <p>No listings match your filters. Try resetting.</p>
                        </div>
                    )}
                </div>
            </div>

            <footer className="footer">
                <div className="footer-logo">Arabian <span>Estate</span></div>
                <p className="footer-tagline">Your trusted partner in New Administrative Capital</p>
                <div className="footer-links">
                    <a href="/">Home</a>
                    <a href="/new-capital">New Capital</a>
                    <a href="#about">About</a>
                    <a href="#contact">Contact</a>
                    <a href="/admin">Admin</a>
                </div>
                <p className="footer-copy">© 2026 Arabian Estate. All rights reserved.</p>
                <p className="footer-credit">Made by <a href="https://wemake.deals" target="_blank" rel="noopener noreferrer">the deal maker</a></p>
                <p className="footer-version">Version 1.0</p>
            </footer>
        </div>
    );
}
