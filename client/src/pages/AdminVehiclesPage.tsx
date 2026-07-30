import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios, { AxiosProgressEvent } from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AdminSidebar from '../components/AdminSidebar';
import { useVehicleStore } from '../stores/vehicleStore';
import ImageUploader from '../components/ImageUploader';

type ImageItem = {
  id: string;
  src: string;
  file?: File;
  isExisting: boolean;
};

export default function AdminVehiclesPage() {
  const { vehicles, setVehicles } = useVehicleStore();
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [featuresInput, setFeaturesInput] = useState('');
  const { register, handleSubmit, reset, watch } = useForm<any>({
    defaultValues: {
      make: '',
      model: '',
      year: '',
      price: '',
      askPrice: 'false',
      mileage: '',
      condition: 'Used',
      transmission: '',
      fuelType: '',
      bodyType: '',
      engine: '',
      seats: '',
      doors: '',
      exterior: '',
      interior: '',
      location: '',
      description: '',
      featured: false,
      sold: false
    }
  });

  useEffect(() => {
    axios.get('/api/admin/vehicles').then((response) => setVehicles(response.data));
  }, [setVehicles]);

  const [inquiriesCount, setInquiriesCount] = useState(0);
  useEffect(() => {
    axios.get('/api/admin/inquiries').then((res) => setInquiriesCount(res.data.length)).catch(() => setInquiriesCount(0));
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      reset({
        make: selectedVehicle.make,
        model: selectedVehicle.model,
        year: selectedVehicle.year,
        price: selectedVehicle.price,
        askPrice: selectedVehicle.askPrice ? 'true' : 'false',
        mileage: selectedVehicle.mileage,
        condition: selectedVehicle.condition || 'Used',
        transmission: selectedVehicle.transmission,
        fuelType: selectedVehicle.fuelType,
        bodyType: selectedVehicle.bodyType,
        engine: selectedVehicle.engine,
        seats: selectedVehicle.seats,
        doors: selectedVehicle.doors,
        exterior: selectedVehicle.exterior,
        interior: selectedVehicle.interior,
        location: selectedVehicle.location,
        description: selectedVehicle.description,
        featured: selectedVehicle.featured,
        sold: selectedVehicle.sold
      });
      setFeaturesInput((selectedVehicle.features || []).join(', '));
      setImages(
        (selectedVehicle.images || []).map((src: string, index: number) => ({
          id: `${src}-${index}`,
          src,
          isExisting: true
        }))
      );
    } else {
      reset({
        make: '',
        model: '',
        year: '',
        price: '',
        askPrice: 'false',
        mileage: '',
        condition: 'Used',
        transmission: '',
        fuelType: '',
        bodyType: '',
        engine: '',
        seats: '',
        doors: '',
        exterior: '',
        interior: '',
        location: '',
        description: '',
        featured: false,
        sold: false
      });
      setFeaturesInput('');
      setImages([]);
    }
  }, [selectedVehicle, reset]);

  const onSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append('make', data.make || '');
    formData.append('model', data.model || '');
    formData.append('year', String(data.year || ''));
    formData.append('price', data.price ? String(data.price) : '');
    formData.append('askPrice', data.askPrice || 'false');
    formData.append('mileage', data.mileage || '');
    formData.append('condition', data.condition || 'Used');
    formData.append('transmission', data.transmission || '');
    formData.append('fuelType', data.fuelType || '');
    formData.append('bodyType', data.bodyType || '');
    formData.append('engine', data.engine || '');
    formData.append('seats', String(data.seats || ''));
    formData.append('doors', String(data.doors || ''));
    formData.append('exterior', data.exterior || '');
    formData.append('interior', data.interior || '');
    formData.append('location', data.location || '');
    formData.append('description', data.description || '');
    formData.append('features', JSON.stringify(featuresInput.split(',').map((value: string) => value.trim()).filter(Boolean)));
    formData.append('featured', data.featured ? 'true' : 'false');
    formData.append('sold', data.sold ? 'true' : 'false');

    const existingImages = images.filter((image) => image.isExisting).map((image) => image.src);
    formData.append('existingImages', JSON.stringify(existingImages));
    images.filter((image) => !image.isExisting && image.file).forEach((image) => {
      if (image.file) {
        formData.append('images', image.file);
      }
    });

    try {
      setUploadProgress(10);
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event: AxiosProgressEvent) => {
          if (event.total) {
            setUploadProgress((event.loaded / event.total) * 100);
          }
        }
      };

      if (selectedVehicle) {
        const response = await axios.patch(`/api/admin/vehicles/${selectedVehicle.id}`, formData, config);
        setVehicles(vehicles.map((vehicle) => (vehicle.id === selectedVehicle.id ? response.data : vehicle)));
      } else {
        const response = await axios.post('/api/admin/vehicles', formData, config);
        setVehicles([...vehicles, response.data]);
      }
      setSelectedVehicle(null);
      reset({
        make: '',
        model: '',
        year: '',
        price: '',
        askPrice: 'false',
        mileage: '',
        condition: 'Used',
        transmission: '',
        fuelType: '',
        bodyType: '',
        engine: '',
        seats: '',
        doors: '',
        exterior: '',
        interior: '',
        location: '',
        description: '',
        featured: false,
        sold: false
      });
      setFeaturesInput('');
      setImages([]);
      setUploadProgress(0);
    } catch (error) {
      setUploadProgress(0);
      console.error(error);
    }
  };

  const removeVehicle = async (vehicleId: string) => {
    const confirmed = window.confirm('Delete this vehicle from inventory?');
    if (!confirmed) return;
    await axios.delete(`/api/admin/vehicles/${vehicleId}`);
    setVehicles(vehicles.filter((vehicle) => vehicle.id !== vehicleId));
    if (selectedVehicle?.id === vehicleId) setSelectedVehicle(null);
  };

  const startEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle);
  };

  return (
    <div>
      <Header />
      <main className="container section">
        <div className="dashboard-layout">
          <AdminSidebar />
          <div className="dashboard-main">
            <div className="section-header">
              <div>
                <h2>Vehicle Inventory</h2>
                <p className="small-text">Add, edit, or manage premium TNL Motors listings.</p>
              </div>
            </div>
            <div className="form-card">
              <div className="admin-stats" style={{ marginBottom: 12 }}>
                <div className="admin-stat-card">
                  <div className="stat-icon">🚗</div>
                  <div>
                    <div className="stat-value">{vehicles.length}</div>
                    <div className="stat-label">Total Vehicles</div>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon">✅</div>
                  <div>
                    <div className="stat-value">{vehicles.filter((v: any) => !v.sold).length}</div>
                    <div className="stat-label">Available</div>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon">🏁</div>
                  <div>
                    <div className="stat-value">{vehicles.filter((v: any) => v.sold).length}</div>
                    <div className="stat-label">Sold</div>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon">✉️</div>
                  <div>
                    <div className="stat-value">{inquiriesCount}</div>
                    <div className="stat-label">Pending Inquiries</div>
                  </div>
                </div>
              </div>
              <h3>{selectedVehicle ? 'Edit Vehicle Listing' : 'Publish New Vehicle'}</h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Make</label>
                    <input {...register('make', { required: 'Make is required' })} />
                  </div>
                  <div className="input-group">
                    <label>Model</label>
                    <input {...register('model', { required: 'Model is required' })} />
                  </div>
                  <div className="input-group">
                    <label>Year</label>
                    <input type="number" {...register('year', { required: 'Year is required' })} />
                  </div>
                  <div className="input-group">
                    <label>Price</label>
                    <input type="number" {...register('price')} />
                  </div>
                  <div className="input-group">
                    <label>Ask Price</label>
                    <select {...register('askPrice')}>
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Mileage</label>
                    <input {...register('mileage')} />
                  </div>
                  <div className="input-group">
                    <label>Condition</label>
                    <select {...register('condition')}>
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Transmission</label>
                    <input {...register('transmission')} />
                  </div>
                  <div className="input-group">
                    <label>Fuel Type</label>
                    <input {...register('fuelType')} />
                  </div>
                  <div className="input-group">
                    <label>Body Type</label>
                    <input {...register('bodyType')} />
                  </div>
                  <div className="input-group">
                    <label>Engine</label>
                    <input {...register('engine')} />
                  </div>
                  <div className="input-group">
                    <label>Seats</label>
                    <input type="number" {...register('seats')} />
                  </div>
                  <div className="input-group">
                    <label>Doors</label>
                    <input type="number" {...register('doors')} />
                  </div>
                  <div className="input-group">
                    <label>Exterior Color</label>
                    <input {...register('exterior')} />
                  </div>
                  <div className="input-group">
                    <label>Interior Color</label>
                    <input {...register('interior')} />
                  </div>
                  <div className="input-group">
                    <label>Location</label>
                    <input {...register('location')} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea {...register('description')} />
                </div>
                <div className="input-group">
                  <label>Features</label>
                  <input value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)} placeholder="e.g. Leather seats, Navigation, Premium audio" />
                  <p className="small-text">Separate features with commas for accurate listing details.</p>
                </div>
                <div className="input-group">
                  <label>Upload Vehicle Images</label>
                  <ImageUploader images={images} onChange={setImages} uploadProgress={uploadProgress} />
                </div>
                <div className="grid-2" style={{ alignItems: 'center' }}>
                  <label className="checkbox-label">
                    <input type="checkbox" {...register('featured')} /> Featured Listing
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" {...register('sold')} /> Sold
                  </label>
                </div>
                <div className="form-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-primary" disabled={uploadProgress > 0 && uploadProgress < 100}>{selectedVehicle ? 'Save Changes' : 'Publish Vehicle'}</button>
                  {selectedVehicle && (
                    <button type="button" className="btn btn-secondary" onClick={() => setSelectedVehicle(null)}>Cancel Edit</button>
                  )}
                </div>
              </form>
            </div>
            <div className="section-header" style={{ marginTop: '2rem' }}>
              <div>
                <h3>Existing Listings</h3>
                <p className="small-text">Review every vehicle currently in the showroom.</p>
              </div>
            </div>
            <div className="cards-grid">
              {vehicles.map((vehicle: any) => (
                <article key={vehicle.id} className="card">
                  {
                    (() => {
                      const placeholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><rect width='100%' height='100%' fill='%23F4F4F2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236B6B6B' font-family='Inter, Arial, sans-serif' font-size='36'>Image%20unavailable</text></svg>";
                      let imgSrc = vehicle.images?.[0] || placeholder;
                      if (typeof imgSrc === 'string' && imgSrc.startsWith('/') && !imgSrc.startsWith('//') && !imgSrc.startsWith('http')) imgSrc = `${window.location.origin}${imgSrc}`;
                      return <img src={imgSrc} alt={`${vehicle.make} ${vehicle.model}`} onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholder; }} />;
                    })()
                  }
                  <div className="card-body">
                    <div className="card-headline">
                      <span className="badge">{vehicle.condition || 'Used'}</span>
                      <span className="vehicle-price">{vehicle.price ? `KSh ${Number(vehicle.price).toLocaleString()}` : 'Ask Price'}</span>
                    </div>
                    <h3 className="card-title">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <p className="card-meta">{vehicle.location}</p>
                    <div className="card-row">
                      <span>{vehicle.fuelType}</span>
                      <span>{vehicle.transmission}</span>
                      <span>{vehicle.mileage}</span>
                    </div>
                    <div className="card-actions">
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-secondary" onClick={() => startEdit(vehicle)}>Edit</button>
                        <button type="button" className="btn btn-light" onClick={() => removeVehicle(vehicle.id)}>Delete</button>
                      </div>
                      <div style={{ marginTop: 8, color: 'var(--muted)' }}>{(vehicle.images || []).length} Photos</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
