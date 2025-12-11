import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  altText: string;
  onClose: () => void;
  onDownload: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, altText, onClose, onDownload }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      {/* Top Bar Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-20">
         <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm group"
            title="Download High Res"
         >
            <Download size={24} className="group-hover:scale-110 transition-transform" />
         </button>
         <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm group"
            title="Close"
         >
            <X size={24} className="group-hover:rotate-90 transition-transform" />
         </button>
      </div>

      {/* Main Content */}
      <div 
        className="relative w-full h-full p-4 flex flex-col items-center justify-center pointer-events-none" 
      >
        <img 
          src={imageUrl} 
          alt={altText} 
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()} // Clicking image shouldn't close modal
        />
        <div className="mt-6 pointer-events-auto px-6 py-2 bg-black/40 rounded-full backdrop-blur-sm border border-white/10">
            <p className="text-white/90 font-medium text-lg tracking-wide">
                {altText}
            </p>
        </div>
      </div>
    </div>
  );
};
