
import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X, Sliders } from 'lucide-react';

interface UploadAreaProps {
  onImageSelected: (base64: string) => void;
  selectedImage: string | null;
  onClear: () => void;
  onEdit: () => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onImageSelected, selectedImage, onClear, onEdit }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelected(result);
    };
    reader.readAsDataURL(file);
  };

  if (selectedImage) {
    return (
      <div className="relative group w-full max-w-md mx-auto aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-gray-100">
        <img 
          src={selectedImage} 
          alt="Original Product" 
          className="w-full h-full object-contain p-4"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button 
            onClick={onEdit}
            className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Sliders size={18} />
            Edit
          </button>
          <button 
            onClick={onClear}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <X size={18} />
            Remove
          </button>
        </div>
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
          Original
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full max-w-2xl mx-auto h-80 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center p-8
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
          : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
        <Upload size={32} />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Upload your product photo
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm">
        Drag and drop your image here, or click to browse. 
        Works best with clear backgrounds.
      </p>
      
      <label className="relative">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileInput}
        />
        <span className="cursor-pointer bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          Select File
        </span>
      </label>
    </div>
  );
};
