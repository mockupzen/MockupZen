
import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, createImage } from '../utils/canvasUtils';
import { Button } from './Button';
import { Check, X, ZoomIn, RotateCw, Sun, Contrast, FlipHorizontal, FlipVertical } from 'lucide-react';

interface ImageEditorProps {
  imageSrc: string;
  onSave: (editedImageSrc: string) => void;
  onCancel: () => void;
}

// Helper to flip the image source via canvas
const flipCanvas = async (src: string, h: boolean, v: boolean): Promise<string> => {
  if (!h && !v) return src;
  const image = await createImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  
  // Translate and scale to flip
  ctx.translate(h ? image.width : 0, v ? image.height : 0);
  ctx.scale(h ? -1 : 1, v ? -1 : 1);
  ctx.drawImage(image, 0, 0);
  
  return canvas.toDataURL();
};

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onSave, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  
  // Flip state
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });
  // Internal source that reflects the flip state
  const [internalImageSrc, setInternalImageSrc] = useState(imageSrc);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'crop' | 'adjust'>('crop');
  const [isProcessing, setIsProcessing] = useState(false);

  // Update internal image when flip state changes
  useEffect(() => {
    let active = true;
    const updateImage = async () => {
      // Avoid processing if no flip is active and we are already on base image (optimization could be added here)
      // But for simplicity/correctness, we regenerate if flip flags change.
      try {
        const flipped = await flipCanvas(imageSrc, flip.horizontal, flip.vertical);
        if (active) {
          setInternalImageSrc(flipped);
        }
      } catch (e) {
        console.error("Failed to flip image", e);
      }
    };
    updateImage();
    return () => { active = false; };
  }, [flip, imageSrc]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      // We pass the internal (potentially flipped) image to the cropper utility.
      // We do NOT pass the flip object to getCroppedImg because the source is already flipped.
      const croppedImage = await getCroppedImg(
        internalImageSrc,
        croppedAreaPixels,
        rotation,
        brightness,
        contrast
      );
      if (croppedImage) {
        onSave(croppedImage);
      }
    } catch (e) {
      console.error(e);
      alert('Could not save image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between bg-zinc-900 border-b border-zinc-800 text-white">
        <h3 className="font-semibold text-lg">Edit Image</h3>
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-grow relative bg-zinc-950 overflow-hidden">
        <Cropper
          image={internalImageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={undefined} // Free crop
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          style={{
            containerStyle: { backgroundColor: '#09090b' },
            mediaStyle: { 
                filter: `brightness(${brightness}%) contrast(${contrast}%)` 
            }
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-zinc-900 border-t border-zinc-800 text-white p-4 sm:p-6 pb-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          
          {/* Tab Selection */}
          <div className="flex justify-center mb-2">
             <div className="bg-zinc-800 p-1 rounded-lg flex gap-1">
                <button 
                  onClick={() => setActiveTab('crop')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'crop' ? 'bg-zinc-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                >
                    Transform
                </button>
                <button 
                  onClick={() => setActiveTab('adjust')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'adjust' ? 'bg-zinc-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                >
                    Adjust
                </button>
             </div>
          </div>

          {/* Sliders Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {activeTab === 'crop' ? (
              <>
                 {/* Zoom & Rotate Column */}
                 <div className="space-y-6">
                   <div className="space-y-3">
                      <div className="flex justify-between text-xs text-zinc-400 font-medium">
                          <span className="flex items-center gap-2"><ZoomIn size={14} /> Zoom</span>
                          <span>{Math.round(zoom * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between text-xs text-zinc-400 font-medium">
                          <span className="flex items-center gap-2"><RotateCw size={14} /> Rotate</span>
                          <span>{rotation}°</span>
                      </div>
                      <input
                        type="range"
                        value={rotation}
                        min={0}
                        max={360}
                        step={1}
                        aria-labelledby="Rotation"
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                   </div>
                 </div>

                 {/* Orientation Column */}
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium mb-1">
                        <span className="flex items-center gap-2">Orientation</span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setFlip({ ...flip, horizontal: !flip.horizontal })}
                            className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-lg text-xs font-medium transition-colors border border-transparent ${flip.horizontal ? 'bg-indigo-600 text-white shadow-md' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:border-zinc-600'}`}
                        >
                            <FlipHorizontal size={20} />
                            Flip Horizontally
                        </button>
                        <button
                            onClick={() => setFlip({ ...flip, vertical: !flip.vertical })}
                            className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-lg text-xs font-medium transition-colors border border-transparent ${flip.vertical ? 'bg-indigo-600 text-white shadow-md' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:border-zinc-600'}`}
                        >
                            <FlipVertical size={20} />
                            Flip Vertically
                        </button>
                    </div>
                 </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                        <span className="flex items-center gap-2"><Sun size={14} /> Brightness</span>
                        <span>{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      value={brightness}
                      min={0}
                      max={200}
                      step={1}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                        <span className="flex items-center gap-2"><Contrast size={14} /> Contrast</span>
                        <span>{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      value={contrast}
                      min={0}
                      max={200}
                      step={1}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                 </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-4 border-t border-zinc-800 pt-6">
            <Button variant="secondary" onClick={onCancel} className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800 hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isProcessing} className="px-8">
              <Check size={18} className="mr-2" />
              Apply Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
