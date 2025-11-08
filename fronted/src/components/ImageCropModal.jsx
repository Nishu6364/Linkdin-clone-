import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RxCross1 } from "react-icons/rx";
import { FiRotateCw, FiRotateCcw } from "react-icons/fi";
import { MdUndo } from "react-icons/md";

function ImageCropModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  aspectRatio = 1,
  onCropComplete,
  title = "Crop Image"
}) {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 300, height: 300 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 400 });

  useEffect(() => {
    if (imageUrl && isOpen) {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        initializeCrop();
      };
      img.src = imageUrl;
    }
  }, [imageUrl, isOpen]);

  const initializeCrop = () => {
    const containerWidth = Math.min(500, window.innerWidth - 100);
    const containerHeight = aspectRatio === 1 ? containerWidth * 0.8 : containerWidth * 0.6;
    
    setCanvasSize({ width: containerWidth, height: containerHeight });

    const cropSize = Math.min(containerWidth, containerHeight) * 0.7;
    const cropWidth = aspectRatio === 1 ? cropSize : cropSize * 1.5;
    const cropHeight = aspectRatio === 1 ? cropSize : cropSize * 0.8;

    setCrop({
      x: (containerWidth - cropWidth) / 2,
      y: (containerHeight - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight
    });
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.max(
      (canvas.width * zoom) / image.width,
      (canvas.height * zoom) / image.height
    );

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(crop.x, crop.y, crop.width, crop.height);
    ctx.globalCompositeOperation = 'source-over';

    ctx.strokeStyle = '#0077b5';
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

    const handleSize = 8;
    ctx.fillStyle = '#0077b5';
    ctx.fillRect(crop.x - handleSize/2, crop.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(crop.x + crop.width - handleSize/2, crop.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(crop.x - handleSize/2, crop.y + crop.height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(crop.x + crop.width - handleSize/2, crop.y + crop.height - handleSize/2, handleSize, handleSize);
  }, [image, crop, zoom, rotation]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= crop.x && x <= crop.x + crop.width && y >= crop.y && y <= crop.y + crop.height) {
      setIsDragging(true);
      setDragStart({ x: x - crop.x, y: y - crop.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newX = Math.max(0, Math.min(x - dragStart.x, canvasSize.width - crop.width));
    const newY = Math.max(0, Math.min(y - dragStart.y, canvasSize.height - crop.height));

    setCrop(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getCroppedImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return null;

    const croppedCanvas = document.createElement('canvas');
    const ctx = croppedCanvas.getContext('2d');

    const outputSize = aspectRatio === 1 ? 400 : { width: 800, height: 450 };
    croppedCanvas.width = aspectRatio === 1 ? outputSize : outputSize.width;
    croppedCanvas.height = aspectRatio === 1 ? outputSize : outputSize.height;

    const scale = Math.max(
      (canvas.width * zoom) / image.width,
      (canvas.height * zoom) / image.height
    );

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const imageX = (canvas.width - scaledWidth) / 2;
    const imageY = (canvas.height - scaledHeight) / 2;

    const cropStartX = (crop.x - imageX) / scale;
    const cropStartY = (crop.y - imageY) / scale;
    const cropWidth = crop.width / scale;
    const cropHeight = crop.height / scale;

    if (rotation !== 0) {
      ctx.translate(croppedCanvas.width / 2, croppedCanvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-croppedCanvas.width / 2, -croppedCanvas.height / 2);
    }

    ctx.drawImage(
      image,
      cropStartX,
      cropStartY,
      cropWidth,
      cropHeight,
      0,
      0,
      croppedCanvas.width,
      croppedCanvas.height
    );

    return croppedCanvas.toDataURL('image/jpeg', 0.9);
  };

  const handleApply = () => {
    const croppedImageUrl = getCroppedImage();
    if (croppedImageUrl) {
      onCropComplete(croppedImageUrl);
    }
    onClose();
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    initializeCrop();
  };

  if (!isOpen) return null;  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <RxCross1 size={20} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Canvas Area */}
          <div className="flex-1">
            <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ width: canvasSize.width, height: canvasSize.height }}>
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="lg:w-64 space-y-4">
            {/* Zoom Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoom: {Math.round(zoom * 100)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Rotation Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rotation: {rotation}°
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setRotation(prev => prev - 90)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <FiRotateCcw size={16} />
                  <span className="text-sm">-90°</span>
                </button>
                <button
                  onClick={() => setRotation(prev => prev + 90)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <FiRotateCw size={16} />
                  <span className="text-sm">+90°</span>
                </button>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              <MdUndo size={16} />
              Reset
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={!image}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
