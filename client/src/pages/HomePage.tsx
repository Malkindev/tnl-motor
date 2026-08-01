import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../layouts/AdminLayout';
import { useVehicleStore } from '../stores/vehicleStore';

const searchFields = ['make', 'model', 'location', 'bodyType', 'fuelType'];

function VehicleCard({ vehicle }: { vehicle: any }) {
  const placeholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><rect width='100%' height='100%' fill='%23F4F4F2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236B6B6B' font-family='Inter, Arial, sans-serif' font-size='36'>Image%20unavailable</text></svg>";
  const [src, setSrc] = useState(vehicle?.images?.[0] || placeholder);

  return (
    <article className="card vehicle-card">
      <div className="vehicle-image">
        <img loading="lazy" decoding="async" src={src} alt={`${vehicle.make} ${vehicle.model}`} onError={(e) => { setSrc(placeholder); }} />
      </div>
      <div className="card-body">
        <div className="card-headline">
          <span className="badge">{vehicle.featured ? 'Featured' : vehicle.sold ? 'Sold' : 'Available'}</span>
          <span className="vehicle-price">{vehicle.price ? `KSh ${vehicle.price.toLocaleString()}` : 'Ask Price'}</span>
        </div>
        <h3 className="card-title">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
        <p className="card-meta">{vehicle.location}</p>
        <div className="card-row">
          <span>{vehicle.mileage}</span>
          <span>{vehicle.transmission}</span>
          <span>{vehicle.fuelType}</span>
        </div>
        <div className="card-actions">
          <Link className="btn btn-secondary" to={`/vehicles/${vehicle.id}`}>View Details</Link>
          <button className="btn btn-light">Send Inquiry</button>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const { vehicles, setVehicles } = useVehicleStore();
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ make: '', model: '', year: '', fuelType: '', location: '' });
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    axios.get('/api/vehicles').then((response) => {
      setVehicles(response.data);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [setVehicles]);

  const filterOptions = useMemo(() => ({
    make: Array.from(new Set(vehicles.map((v: any) => v.make))).sort(),
    model: Array.from(new Set(vehicles.map((v: any) => v.model))).sort(),
    year: Array.from(new Set(vehicles.map((v: any) => v.year))).sort((a: any, b: any) => b - a),
    fuelType: Array.from(new Set(vehicles.map((v: any) => v.fuelType))).sort(),
    location: Array.from(new Set(vehicles.map((v: any) => v.location))).sort()
  }), [vehicles]);

  const featured = useMemo(() => vehicles.filter((vehicle) => vehicle.featured && !vehicle.sold).slice(0, 4), [vehicles]);

  const latest = useMemo(() => {
    return [...vehicles]
      .sort((a, b) => (new Date(b.createdAt || '').getTime() || 0) - (new Date(a.createdAt || '').getTime() || 0))
      .slice(0, 6);
  }, [vehicles]);

  const searchResults = useMemo(() => {
    let result = vehicles;
    if (search) {
      const query = search.toLowerCase();
      result = result.filter((vehicle: any) => searchFields.some((field) => String(vehicle[field] || '').toLowerCase().includes(query)));
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      result = result.filter((vehicle: any) => String(vehicle[key]).toLowerCase() === value.toLowerCase());
    });
    return result.sort((a: any, b: any) => {
      if (sort === 'price-low') return (a.price || 0) - (b.price || 0);
      if (sort === 'price-high') return (b.price || 0) - (a.price || 0);
      if (sort === 'year') return b.year - a.year;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [vehicles, search, filters, sort]);

  return (
    <AdminLayout>
      <main>
        <section className="hero hero-home">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="badge">TNL Motors</span>
              <h1>Drive Something Exceptional</h1>
              <p>Discover premium vehicles selected for quality, value and style. Search effortlessly and connect with TNL Motors today.</p>
              <div className="hero-search-card">
                <div className="hero-search-row">
                  <div className="search-control">
                    <label>Make</label>
                    <input value={filters.make} onChange={(e) => setFilters((prev) => ({ ...prev, make: e.target.value }))} placeholder="Any make" />
                  </div>
                  <div className="search-control">
                    <label>Model</label>
                    <input value={filters.model} onChange={(e) => setFilters((prev) => ({ ...prev, model: e.target.value }))} placeholder="Any model" />
                  </div>
                  <div className="search-control">
                    <label>Keyword</label>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by feature, location or trim" />
                  </div>
                </div>
                <div className="hero-search-row">
                  <div className="search-control">
                    <label>Year</label>
                    <select value={filters.year} onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}>
                      <option value="">All years</option>
                      {filterOptions.year.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </div>
                  <div className="search-control">
                    <label>Fuel type</label>
                    <select value={filters.fuelType} onChange={(e) => setFilters((prev) => ({ ...prev, fuelType: e.target.value }))}>
                      <option value="">All fuel types</option>
                      {filterOptions.fuelType.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}
                    </select>
                  </div>
                  <div className="search-control">
                    <label>Location</label>
                    <select value={filters.location} onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}>
                      <option value="">All locations</option>
                      {filterOptions.location.map((location) => <option key={location} value={location}>{location}</option>)}
                    </select>
                  </div>
                </div>
                <div className="hero-search-actions">
                  <button className="btn btn-primary">Search Available Vehicles</button>
                  <span>{searchResults.length} vehicles available</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-logo-visual">
                <div className="hero-logo-badge">
                  <img src="/assets/tnl-logo.png" alt="TNL Motors" />
                </div>
                <div className="hero-visual-copy">
                  <h2>Premium automotive curation</h2>
                  <p>Experience a clean, modern marketplace with trusted listings, transparent pricing, and premium service from TNL Motors.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section container" id="featured">
          <div className="section-header">
            <div>
              <h2>Featured Vehicles</h2>
              <p className="small-text">Handpicked listings from our premium inventory.</p>
            </div>
            <Link to="/vehicles" className="nav-link">Browse all vehicles</Link>
          </div>
          {loaded && !featured.length ? (
            <div className="empty-state">
              <h3>No featured vehicles yet.</h3>
              <p>New vehicles are arriving soon. Check back later or explore our full inventory.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {featured.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
            </div>
          )}
        </section>

        <section className="section section-alt container" id="latest">
          <div className="section-header">
            <div>
              <h2>Latest Arrivals</h2>
              <p className="small-text">See the newest vehicles added by our team.</p>
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="search-control">
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="year">Year</option>
            </select>
          </div>
          {loaded && !latest.length ? (
            <div className="empty-state">
              <h3>No vehicles available yet.</h3>
              <p>Our showroom is growing. Check back soon for the latest arrivals.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {latest.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
            </div>
          )}
        </section>

        <section className="section container" id="about">
          <div className="section-header">
            <div>
              <h2>Why choose TNL Motors</h2>
              <p className="small-text">A premium buying experience built on trust, clarity and quality.</p>
            </div>
          </div>
          <div className="category-grid">
            <article className="category-card">
              <h3>Quality Vehicles</h3>
              <p>Every vehicle is carefully selected and listed with transparent details so you can buy with confidence.</p>
            </article>
            <article className="category-card">
              <h3>Transparent Experience</h3>
              <p>Clear pricing, vehicle history and direct communication make every inquiry easy and reliable.</p>
            </article>
            <article className="category-card">
              <h3>Customer Support</h3>
              <p>Our team is here to help you choose the right vehicle and finalize the purchase smoothly.</p>
            </article>
          </div>
        </section>

        <section className="section section-alt container" id="contact">
          <div className="section-header">
            <div>
              <h2>Contact TNL Motors</h2>
              <p className="small-text">Mombasa, Kenya · +254 0781766193 · WhatsApp available</p>
            </div>
          </div>
          <div className="contact-panel">
            <div>
              <h3>Call Us</h3>
              <p>Speak with our team about available vehicles and booking a showcase.</p>
              <a className="btn btn-primary" href="tel:+2540781766193">Call +254 0781766193</a>
            </div>
            <div>
              <h3>WhatsApp</h3>
              <p>Start a WhatsApp conversation for a faster response.</p>
              <a className="btn btn-secondary" href="https://wa.me/254781766193" target="_blank" rel="noreferrer">WhatsApp Us</a>
            </div>
          </div>
        </section>
      </main>
    </AdminLayout>
  );
}
