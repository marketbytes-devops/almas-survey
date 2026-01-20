import React, { useRef, useState, useEffect } from 'react';
import { FaTimes, FaUndo, FaCheck } from 'react-icons/fa';

const SignatureModal = ({ isOpen, onClose, onSave, customerName }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // Set drawing styles
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [isOpen]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const saveSignature = () => {
    if (!hasDrawn) {
      alert('Please sign before saving');
      return;
    }

    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const file = new File([blob], `signature_${Date.now()}.png`, {
        type: 'image/png'
      });
      onSave(file);
      onClose();
    }, 'image/png');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all scale-100 opacity-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Digital Signature
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">
            {customerName ? `Customer: ${customerName}` : "Sign below:"}
          </p>

          {/* Canvas */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner relative group">
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-gray-300 text-2xl font-handwriting opacity-50 select-none">Sign Here</span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="w-full h-64 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          <p className="text-xs text-gray-600 mt-3 text-center">
            Use your mouse or finger to sign within the box.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={clearSignature}
            className="flex items-center gap-2 py-2 px-4 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
          >
            <FaUndo className="w-3 h-3" />
            Clear
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="py-2 px-4 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={saveSignature}
              disabled={!hasDrawn}
              className={`flex items-center gap-2 py-2 px-6 text-sm font-bold text-white rounded-lg shadow-sm transition-all ${hasDrawn
                ? 'bg-[#4c7085] hover:bg-[#3e5c6e] active:scale-95'
                : 'bg-gray-300 cursor-not-allowed'
                }`}
            >
              <FaCheck className="w-3 h-3" />
              Confirm Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;