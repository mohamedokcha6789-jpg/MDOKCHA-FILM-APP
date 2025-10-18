import React from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { playClick } from '../services/soundService';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) {
    return null;
  }

  const handleClose = () => {
    playClick();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn"
      style={{ animationDuration: '0.3s' }}
      onClick={handleClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] p-4 bg-gray-900 rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={imageUrl} alt="عرض مكبر" className="max-w-full max-h-[85vh] object-contain rounded" />
        <button
          onClick={handleClose}
          className="absolute -top-4 -right-4 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors z-10"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

export default ImageModal;