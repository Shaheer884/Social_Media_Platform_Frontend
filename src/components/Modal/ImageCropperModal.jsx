import React, { useState, useRef, useEffect } from 'react';
import Spinner from '../Loader/Spinner';

const ImageCropperModal = ({ isOpen, imageSrc, aspectRatio = 1, onCrop, onClose, title = "Crop Image" }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 300 });

  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Measure container size dynamically for responsiveness
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          setContainerSize({
            width: width || 400,
            height: height || 300
          });
        }
      });
      resizeObserver.observe(containerRef.current);
      
      // Initial measurement
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({
        width: rect.width || 400,
        height: rect.height || 300
      });

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [isOpen]);

  const containerWidth = containerSize.width;
  const containerHeight = containerSize.height;

  // Compute crop box dimensions based on aspect ratio (e.g. 1 for avatar, 3 for cover)
  // Let the crop box cover up to 80% of container size
  let cropWidth = Math.round(containerWidth * 0.8);
  let cropHeight = Math.round(cropWidth / aspectRatio);

  if (cropHeight > containerHeight * 0.8) {
    cropHeight = Math.round(containerHeight * 0.8);
    cropWidth = Math.round(cropHeight * aspectRatio);
  }

  const cropLeft = (containerWidth - cropWidth) / 2;
  const cropTop = (containerHeight - cropHeight) / 2;

  // Reset cropper state when open or when image source changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setLoading(true);
    }
  }, [isOpen, imageSrc]);

  if (!isOpen) return null;

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
    
    // Scale image to cover the crop box
    const scale = Math.max(cropWidth / naturalWidth, cropHeight / naturalHeight);
    
    setImgSize({
      width: naturalWidth * scale,
      height: naturalHeight * scale
    });
    setLoading(false);
  };

  const handleStartDrag = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({
      x: clientX - offset.x,
      y: clientY - offset.y
    });
  };

  const handleDragMove = (clientX, clientY) => {
    if (!isDragging || loading) return;
    
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    // Contain within bounds to avoid empty space inside crop box
    const cx = containerWidth / 2;
    const cy = containerHeight / 2;
    const halfW = (imgSize.width * zoom) / 2;
    const halfH = (imgSize.height * zoom) / 2;

    const minX = cropLeft + cropWidth - cx - halfW;
    const maxX = cropLeft - cx + halfW;
    const minY = cropTop + cropHeight - cy - halfH;
    const maxY = cropTop - cy + halfH;

    setOffset({
      x: Math.min(Math.max(newX, minX), maxX),
      y: Math.min(Math.max(newY, minY), maxY)
    });
  };

  const handleEndDrag = () => {
    setIsDragging(false);
  };

  // Mouse Handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleStartDrag(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    handleDragMove(e.clientX, e.clientY);
  };

  // Touch Handlers for Mobile support
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleZoomChange = (e) => {
    const nextZoom = parseFloat(e.target.value);
    setZoom(nextZoom);

    // Contain the offset after zoom changes
    setOffset(prev => {
      const cx = containerWidth / 2;
      const cy = containerHeight / 2;
      const halfW = (imgSize.width * nextZoom) / 2;
      const halfH = (imgSize.height * nextZoom) / 2;

      const minX = cropLeft + cropWidth - cx - halfW;
      const maxX = cropLeft - cx + halfW;
      const minY = cropTop + cropHeight - cy - halfH;
      const maxY = cropTop - cy + halfH;

      return {
        x: Math.min(Math.max(prev.x, minX), maxX),
        y: Math.min(Math.max(prev.y, minY), maxY)
      };
    });
  };

  const handleCropSubmit = () => {
    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');

    const cx = containerWidth / 2;
    const cy = containerHeight / 2;
    
    // Top-left of scaled image in container coordinates
    const imgLeft = cx + offset.x - (imgSize.width * zoom) / 2;
    const imgTop = cy + offset.y - (imgSize.height * zoom) / 2;

    // Offset of crop box relative to image top-left
    const dx = cropLeft - imgLeft;
    const dy = cropTop - imgTop;

    // Scale ratio between screen representation and natural image
    const ratio = (imgSize.width * zoom) / naturalSize.width;

    // Source coordinates on natural image
    const sx = dx / ratio;
    const sy = dy / ratio;
    const sWidth = cropWidth / ratio;
    const sHeight = cropHeight / ratio;

    ctx.drawImage(
      imgRef.current,
      sx,
      sy,
      sWidth,
      sHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    canvas.toBlob((blob) => {
      if (blob) {
        // Create a File object
        const file = new File([blob], 'cropped_image.png', { type: 'image/png' });
        onCrop(file, canvas.toDataURL('image/png'));
      }
    }, 'image/png');
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 2000 }} onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '500px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: 0 }}>{title}</h3>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              lineHeight: 1
            }}
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Cropper Container */}
          <div
            ref={containerRef}
            style={{
              width: '100%',
              aspectRatio: '4 / 3',
              maxWidth: '450px',
              position: 'relative',
              backgroundColor: '#111',
              borderRadius: '12px',
              overflow: 'hidden',
              userSelect: 'none',
              touchAction: 'none'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleEndDrag}
            onMouseLeave={handleEndDrag}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleEndDrag}
          >
            {imageSrc && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop Target"
                onLoad={handleImageLoad}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: imgSize.width ? `${imgSize.width}px` : 'auto',
                  height: imgSize.height ? `${imgSize.height}px` : 'auto',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                  transformOrigin: 'center',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  display: loading ? 'none' : 'block',
                  maxWidth: 'none',
                  maxHeight: 'none'
                }}
              />
            )}

            {loading && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
                <Spinner />
              </div>
            )}

            {/* Dark Mask Overlay with Cutout */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                boxShadow: `inset 0 0 0 9999px rgba(0, 0, 0, 0.65)`
              }}
            />

            {/* Highlighted Crop Area Box */}
            <div
              style={{
                position: 'absolute',
                left: `${cropLeft}px`,
                top: `${cropTop}px`,
                width: `${cropWidth}px`,
                height: `${cropHeight}px`,
                border: '2px solid white',
                borderRadius: aspectRatio === 1 ? '50%' : '4px', // Circular for avatar
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.05)',
                pointerEvents: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Zoom Slider */}
          <div style={{ width: '100%', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="4"
              step="0.01"
              value={zoom}
              onChange={handleZoomChange}
              style={{
                width: '100%',
                accentColor: 'var(--purple)',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleCropSubmit} disabled={loading}>
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
