import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../layouts/AdminLayout';
import { useVehicleStore } from '../stores/vehicleStore';

const filters = [
  { label: 'Make', key: 'make', options: ['Audi', 'BMW', 'Mercedes', 'Toyota'] },
  { label: 'Year', key: 'year', options: ['2024', '2023', '2022', '2021'] },
  { label: 'Fuel', key: 'fuelType', options: ['Petrol', 'Diesel', 'Hybrid', 'Electric'] }
];

function VehicleCard({ vehicle }: { vehicle: any }) {
  const placeholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><rect width='100%' height='100%' fill='%23F4F4F2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236B6B6B' font-family='Inter, Arial, sans-serif' font-size='36'>Image%20unavailable</text></svg>";
  let initial = vehicle?.images?.[0] || placeholder;
  if (typeof initial === 'string' && initial.startsWith('/') && !initial.startsWith('//') && !initial.startsWith('http')) {
    initial = `${window.location.origin}${initial}`;
  }
  const [src, setSrc] = useState(initial);

  return (
    <div className="card">
      <img loading="lazy" decoding="async" src={src} alt={`${vehicle.make} ${vehicle.model}`} onError={(e) => { setSrc(placeholder); }} />
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <p className="badge">{vehicle.sold ? 'Sold' : 'Available'}</p>
          <p style={{ color: '#111', fontWeight: 700 }}>${vehicle.price?.toLocaleString() ?? 'Ask Price'}</p>
        </div>
        <h3 className="card-title">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
        <p className="card-meta">{vehicle.location}</p>
        <div className="card-row">
          <span>{vehicle.transmission}</span>
          <span>{vehicle.condition || 'Used'}</span>
          <span>{vehicle.fuelType}</span>
        </div>
        <div className="card-actions">
          <Link className="btn btn-secondary" to={`/vehicles/${vehicle.id}`}>View Details</Link>
          <button className="btn btn-light">Send Inquiry</button>
        </div>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const { vehicles, setVehicles } = useVehicleStore();
  const [search, setSearch] = useState('');
  const [filtersState, setFiltersState] = useState<Record<string, string>>({ make: '', year: '', fuelType: '' });
  const [sortKey, setSortKey] = useState('newest');

  useEffect(() => {
    axios.get('/api/vehicles').then((response) => {
      setVehicles(response.data);
    });
  }, [setVehicles]);

  const filteredVehicles = useMemo(() => {
    let result = vehicles;
    if (search) {
      const query = search.toLowerCase();
      result = result.filter((vehicle) => [vehicle.make, vehicle.model, vehicle.location, vehicle.bodyType, vehicle.fuelType].some((value) => value.toLowerCase().includes(query)));
    }
    Object.entries(filtersState).forEach(([key, value]) => {
      if (!value) return;
      result = result.filter((vehicle) => {
        const field = (vehicle as Record<string, any>)[key];
        return field !== undefined && String(field).toLowerCase() === value.toLowerCase();
      });
    });
    return [...result].sort((a, b) => {
      if (sortKey === 'price-low') return (a.price || 0) - (b.price || 0);
      if (sortKey === 'price-high') return (b.price || 0) - (a.price || 0);
      if (sortKey === 'year') return b.year - a.year;
      return b.year - a.year;
    });
  }, [vehicles, search, filtersState, sortKey]);

  return (
    <AdminLayout>
      <main>
        <div className="section-header">
          <div>
            <h2>Browse Vehicles</h2>
            <p className="small-text">Find your next vehicle using search, filters, and easy browsing.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="search-control">
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="year">Year</option>
            </select>
          </div>
        </div>

        <div className="explore-bar">
          <div className="search-control">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by make, model or keyword" />
          </div>
          {filters.map((filter) => (
            <div key={filter.key} className="search-control">
              <select value={filtersState[filter.key] || ''} onChange={(e) => setFiltersState((prev) => ({ ...prev, [filter.key]: e.target.value }))}>
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="cards-grid mt-8">
          {filteredVehicles.length ? filteredVehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />) : <p>No vehicles matched your search.</p>}
        </div>
      </main>
    </AdminLayout>
  );
}
