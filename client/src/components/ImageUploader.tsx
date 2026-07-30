import { DragEvent, useMemo, useRef, useState } from 'react';
import { ImagePlus, Trash2, GripVertical, ArrowLeft, ArrowRight, Star } from 'lucide-react';

type ImageItem = {
  id: string;
  src: string;
  file?: File;
  isExisting: boolean;
};

type Props = {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  uploadProgress?: number;
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ImageUploader({ images, onChange, uploadProgress = 0 }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newItems: ImageItem[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Only JPG, JPEG, PNG and WEBP files are accepted.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be 5MB or less.');
        continue;
      }
      const src = URL.createObjectURL(file);
      newItems.push({ id: `${file.name}-${file.size}-${Date.now()}`, src, file, isExisting: false });
    }
    if (newItems.length) {
      onChange([...images, ...newItems].slice(0, 8));
      setError(null);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const removeImage = (index: number) => {
    const removed = images[index];
    // revoke object URL for newly added files
    if (removed?.file) URL.revokeObjectURL(removed.src);
    onChange(images.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveImage = (from: number, to: number) => {
    if (from === to || to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    moveImage(index, 0);
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragEnter = (index: number) => {
    if (dragIndex.current === null || dragIndex.current === index) return;
    const current = dragIndex.current;
    moveImage(current, index);
    dragIndex.current = index;
  };

  const fileCountLabel = useMemo(() => {
    if (!images.length) return 'No images selected yet';
    return `${images.length} image${images.length > 1 ? 's' : ''} selected`;
  }, [images.length]);

  return (
    <div className="image-uploader">
      <div
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
      >
        <div className="dropzone-content">
          <ImagePlus size={24} />
          <div>
            <strong>Drag & drop images here</strong>
            <p>JPG, JPEG, PNG, WEBP • Up to 8 images • 5MB max each</p>
          </div>
        </div>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {error && <p className="field-error" style={{ marginTop: 12 }}>{error}</p>}
      <div className="uploader-status">
        <span>{fileCountLabel}</span>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <span>{Math.round(uploadProgress)}% uploading</span>
        )}
      </div>

      <div className="image-preview-grid">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="image-preview-card"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
          >
            <img
              src={image.src}
              alt={`Upload preview ${index + 1}`}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><rect width='100%' height='100%' fill='%23F4F4F2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236B6B6B' font-family='Inter, Arial, sans-serif' font-size='36'>Image%20unavailable</text></svg>"; }}
            />
            <div className="image-preview-actions">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" className="icon-button" title="Move left" onClick={() => moveImage(index, index - 1)}>
                  <ArrowLeft size={14} />
                </button>
                <button type="button" className="icon-button" title="Move right" onClick={() => moveImage(index, index + 1)}>
                  <ArrowRight size={14} />
                </button>
                <button type="button" className="icon-button" title="Set as cover" onClick={() => setAsCover(index)}>
                  <Star size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" className="icon-button" onClick={() => removeImage(index)}>
                  <Trash2 size={16} />
                </button>
                <div className="grab-handle" title="Drag to reorder">
                  <GripVertical size={18} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
