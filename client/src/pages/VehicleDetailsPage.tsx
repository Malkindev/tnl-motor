import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function VehicleDetailsPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/vehicles/${id}`).then((response) => setVehicle(response.data));
  }, [id]);

  const sendInquiry = async () => {
    if (!vehicle) return;
    await axios.post('/api/inquiries', {
      vehicleId: vehicle.id,
      name: 'Anonymous Visitor',
      email: 'visitor@example.com',
      phone: '',
      message: message || `I am interested in ${vehicle.make} ${vehicle.model}.`,
    });
    setStatus('Inquiry sent successfully.');
  };

  if (!vehicle) {
    return (
      <div>
        <Header />
        <main className="container section">
          <p>Loading vehicle details…</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="container section">
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="hero-image" style={{ minHeight: 420 }}>
              <img src={vehicle.images?.[0] || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><rect width='100%' height='100%' fill='%23F4F4F2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236B6B6B' font-family='Inter, Arial, sans-serif' font-size='36'>Image%20unavailable</text></svg>"} alt={`${vehicle.make} ${vehicle.model}`} onError={(e) => { (e.currentTarget as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><rect width='100%' height='100%' fill='%23F4F4F2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236B6B6B' font-family='Inter, Arial, sans-serif' font-size='36'>Image%20unavailable</text></svg>"; }} />
            </div>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {(vehicle.images || []).slice(1, 5).map((src: string) => (
                <div key={src} style={{ borderRadius: 18, overflow: 'hidden' }}>
                  <img src={src || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><rect width='100%' height='100%' fill='%23F4F4F2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236B6B6B' font-family='Inter, Arial, sans-serif' font-size='36'>Image%20unavailable</text></svg>"} alt={`${vehicle.make} ${vehicle.model}`} onError={(e) => { (e.currentTarget as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><rect width='100%' height='100%' fill='%23F4F4F2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236B6B6B' font-family='Inter, Arial, sans-serif' font-size='36'>Image%20unavailable</text></svg>"; }} />
                </div>
              ))}
            </div>
          </div>

          <div className="form-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <p className="badge">{vehicle.sold ? 'Sold' : 'Available'}</p>
                <h1 style={{ margin: '0.75rem 0' }}>{vehicle.year} {vehicle.make} {vehicle.model}</h1>
                <p style={{ color: '#555', margin: 0 }}>{vehicle.location}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>${vehicle.price?.toLocaleString() ?? 'Ask Price'}</p>
                <p style={{ color: '#666' }}>{vehicle.mileage}</p>
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: '1.75rem' }}>
              {[
                ['Transmission', vehicle.transmission],
                ['Fuel type', vehicle.fuelType],
                ['Condition', vehicle.condition || 'Used'],
                ['Body type', vehicle.bodyType],
                ['Engine', vehicle.engine],
                ['Seats', vehicle.seats],
                ['Doors', vehicle.doors],
                ['Exterior', vehicle.exterior],
                ['Interior', vehicle.interior],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <strong>{label}</strong>
                  <p style={{ margin: '0.5rem 0 0', color: '#555' }}>{value}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3>Description</h3>
              <p style={{ color: '#555' }}>{vehicle.description}</p>
            </div>

            <div className="form-card" style={{ marginTop: '2rem' }}>
              <h3>Send Inquiry</h3>
              <div className="input-group">
                <label>Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask about this vehicle" />
              </div>
              <button className="btn btn-primary" onClick={sendInquiry}>Send Inquiry</button>
              {status ? <p style={{ marginTop: '1rem', color: '#0a7' }}>{status}</p> : null}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
