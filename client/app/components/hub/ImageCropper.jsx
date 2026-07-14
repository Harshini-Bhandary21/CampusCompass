'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import Modal from '@/app/components/shared/Modal';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    return null;
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return croppedCanvas.toDataURL('image/jpeg');
}

export default function ImageCropper({ imageSrc, onSave, onCancel, aspect = 1 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal
      variant="bare"
      onClose={onCancel}
      closeOnBackdrop={false}
      backdropClassName="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 bg-black/80"
      bodyClassName="flex flex-col items-center w-full"
    >
      <div className="relative w-full max-w-[500px] h-[60vh] bg-gray-900 rounded-lg overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          cropShape={aspect === 1 ? 'round' : 'rect'}
          showGrid={false}
        />
      </div>

      <div className="w-full max-w-[500px] mt-4 bg-white p-4 rounded-lg flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="text-gray-700 text-sm">Zoom:</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="dashboard-btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="dashboard-btn-primary"
            onClick={handleSave}
          >
            Crop &amp; Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
