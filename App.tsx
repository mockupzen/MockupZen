
import React, { useState } from 'react';
import { Download, Sparkles, Image as ImageIcon, CheckCircle, AlertCircle, ZoomIn, RefreshCw, Eraser, Heart, PenTool } from 'lucide-react';
import { UploadArea } from './components/UploadArea';
import { Button } from './components/Button';
import { ImageModal } from './components/ImageModal';
import { ImageEditor } from './components/ImageEditor';
import { SceneSelector } from './components/SceneSelector';
import { generateSingleMockup } from './services/geminiService';
import { SCENES, VARIATION_PROMPTS } from './constants';
import { MockupResult, AppState, MockupScene } from './types';

// GLOBAL LIMIT
const MAX_MOCKUPS = 20;

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [results, setResults] = useState<MockupResult[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [zoomedResult, setZoomedResult] = useState<MockupResult | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Settings
  const [removeBackground, setRemoveBackground] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Initialize with all scenes selected by default
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>(SCENES.map(s => s.id));

  const toggleFavorite = (id: string) => {
    setResults(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, isFavorite: !r.isFavorite };
      }
      return r;
    }));
  };

  const isCustomMode = customPrompt.trim().length > 0;
  
  // If custom prompt is set, we generate 20 variations. Otherwise, we use selected count.
  const totalSelectionCount = isCustomMode ? 20 : selectedSceneIds.length;
  
  // Over limit checks mainly relevant if we allowed > 20 manual selections, but SCENES.length is 20.
  const isOverLimit = totalSelectionCount > MAX_MOCKUPS;

  const handleGenerate = async () => {
    if (!selectedImage || totalSelectionCount === 0 || isOverLimit) return;

    setAppState(AppState.GENERATING);
    setShowFavoritesOnly(false); // Reset filter on new generation
    
    let scenesToGenerate: MockupScene[] = [];

    if (isCustomMode) {
        // Generate 20 variations based on custom prompt
        scenesToGenerate = VARIATION_PROMPTS.map((variation, index) => ({
            id: `custom-var-${index}`,
            name: `Custom Var ${index + 1}`,
            category: 'Custom',
            prompt: `${customPrompt.trim()}. Camera/Angle: ${variation}`
        }));
    } else {
        // Use selected preset scenes
        scenesToGenerate = SCENES.filter(s => selectedSceneIds.includes(s.id));
    }
    
    // Initialize results state
    setResults(scenesToGenerate.map(scene => ({ id: scene.id, scene: scene.name, imageUrl: '', isLoading: true, isFavorite: false })));
    setCompletedCount(0);

    // Queue Processing Logic to avoid 429 Rate Limits
    // We use a worker pool pattern. 
    // CRITICAL: Concurrency set to 1 (Sequential) to prevent Rate Limit (429) errors on heavy image models.
    const CONCURRENCY_LIMIT = 1; 
    const queue = [...scenesToGenerate];
    
    const worker = async () => {
      while (queue.length > 0) {
        const scene = queue.shift();
        if (!scene) break;

        try {
          // Delay between processing items to reduce rate (2 seconds)
          // This is essential for preventing 429 errors when generating many images sequentially.
          await new Promise(r => setTimeout(r, 2000));

          const generatedImage = await generateSingleMockup(selectedImage, scene, removeBackground);
          
          setResults(prev => prev.map(r => {
            if (r.id === scene.id) {
              return { ...r, imageUrl: generatedImage, isLoading: false };
            }
            return r;
          }));
        } catch (error: any) {
          console.error(`Failed to generate ${scene.name}`);
          setResults(prev => prev.map(r => {
            if (r.id === scene.id) {
              return { 
                ...r, 
                isLoading: false, 
                error: true,
                errorMessage: error.message || "Failed to generate image"
              };
            }
            return r;
          }));
        } finally {
          setCompletedCount(c => c + 1);
        }
      }
    };

    // Spin up workers
    const workers = Array(Math.min(scenesToGenerate.length, CONCURRENCY_LIMIT))
      .fill(null)
      .map(() => worker());

    await Promise.all(workers);
    setAppState(AppState.COMPLETE);
  };

  const handleRetryScene = async (resultId: string) => {
    if (!selectedImage) return;
    
    let sceneToRetry: MockupScene | undefined;
    
    if (resultId.startsWith('custom-var-')) {
        // Reconstruct the custom scene for retry
        const index = parseInt(resultId.replace('custom-var-', ''));
        if (!isNaN(index) && index >= 0 && index < VARIATION_PROMPTS.length) {
            sceneToRetry = {
                id: resultId,
                name: `Custom Var ${index + 1}`,
                category: 'Custom',
                prompt: `${customPrompt.trim()}. Camera/Angle: ${VARIATION_PROMPTS[index]}`
            };
        }
    } else {
        sceneToRetry = SCENES.find(s => s.id === resultId);
    }

    if (!sceneToRetry) return;

    // Set loading state for specific item
    setResults(prev => prev.map(r => {
      if (r.id === resultId) {
        return { ...r, isLoading: true, error: false, errorMessage: undefined };
      }
      return r;
    }));

    try {
      const generatedImage = await generateSingleMockup(selectedImage, sceneToRetry, removeBackground);
      setResults(prev => prev.map(r => {
        if (r.id === resultId) {
          return { ...r, imageUrl: generatedImage, isLoading: false };
        }
        return r;
      }));
    } catch (error: any) {
      setResults(prev => prev.map(r => {
        if (r.id === resultId) {
          return { 
            ...r, 
            isLoading: false, 
            error: true, 
            errorMessage: error.message || "Retry failed. Please try again." 
          };
        }
        return r;
      }));
    }
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    // Download visible results (respecting filter)
    const resultsToDownload = showFavoritesOnly ? results.filter(r => r.isFavorite) : results;
    
    // Sequential download to avoid browser blocking multiple downloads
    for (let i = 0; i < resultsToDownload.length; i++) {
      const result = resultsToDownload[i];
      if (result.imageUrl && !result.error) {
        downloadImage(result.imageUrl, `mockupgen-${result.id}.png`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
      }
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setResults([]);
    setCompletedCount(0);
    setShowFavoritesOnly(false);
    // Keep selected image and settings for convenience
  };

  const handleSaveEditedImage = (newImage: string) => {
    setSelectedImage(newImage);
    setIsEditing(false);
  };

  const displayedResults = showFavoritesOnly 
    ? results.filter(r => r.isFavorite && !r.isLoading && !r.error) 
    : results;

  const favoriteCount = results.filter(r => r.isFavorite).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <Sparkles size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">MockupGen</span>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            High-Quality AI Product Photography
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero / Upload Section */}
        {appState === AppState.IDLE && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                Turn one photo into <span className="text-indigo-600">pro mockups</span>.
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload a simple product shot. Our AI places it in stunning environments instantly. 
                Perfect for Shopify, Amazon, and Etsy.
              </p>
            </div>

            <UploadArea 
              selectedImage={selectedImage} 
              onImageSelected={setSelectedImage} 
              onClear={() => setSelectedImage(null)}
              onEdit={() => setIsEditing(true)}
            />

            {/* Scene Selection */}
            <div className="mt-4 space-y-6">
              <div className={isCustomMode ? "opacity-50 pointer-events-none filter grayscale transition-all" : "transition-all"}>
                <SceneSelector 
                    scenes={SCENES}
                    selectedIds={selectedSceneIds}
                    onChange={setSelectedSceneIds}
                />
              </div>

              {/* Custom Prompt Section */}
              <div className={`max-w-4xl mx-auto bg-white p-5 rounded-xl border shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 ${isCustomMode ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold">
                  <div className="bg-indigo-100 p-1.5 rounded-md text-indigo-600">
                    <PenTool size={16} />
                  </div>
                  <h3>Custom Scene Mode</h3>
                  <span className="ml-auto text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                    {isCustomMode ? 'Overrides Presets' : 'Optional'}
                  </span>
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe a custom scene (e.g. 'Christmas morning', 'Cyberpunk city', 'Beach sunset'). We will generate 20 variations of this theme."
                  className="w-full border-gray-300 rounded-lg text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px] p-3 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Controls & Generate */}
            <div className="flex flex-col items-center mt-6 gap-4">
              
              {/* Background Removal Toggle */}
              <div className="flex items-center justify-center gap-3">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative">
                      <input 
                          type="checkbox" 
                          className="peer sr-only" 
                          checked={removeBackground} 
                          onChange={(e) => setRemoveBackground(e.target.checked)} 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </div>
                    <span className="text-gray-700 font-medium text-sm flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                        <Eraser size={16} className={removeBackground ? "text-indigo-600" : "text-gray-500"} />
                        Smart Background Removal
                    </span>
                </label>
                <span className="text-xs text-gray-400 hidden sm:inline-block border-l border-gray-300 pl-3">
                    Preserves product edges & details
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button 
                  disabled={!selectedImage || totalSelectionCount === 0 || isOverLimit} 
                  onClick={handleGenerate}
                  className="px-12 py-4 text-lg shadow-xl shadow-indigo-200"
                >
                  <Sparkles className="mr-2" size={20} />
                  Generate {totalSelectionCount} Mockup{totalSelectionCount !== 1 ? 's' : ''}
                </Button>
                {isOverLimit && (
                  <p className="text-red-500 text-sm font-medium animate-pulse flex items-center gap-1">
                    <AlertCircle size={14} />
                    You can generate up to {MAX_MOCKUPS} mockups at a time.
                  </p>
                )}
              </div>
            </div>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12 text-center">
              {[
                { title: 'Studio Quality', desc: 'Professional lighting and composition automatically applied.' },
                { title: 'Multiple Scenes', desc: 'Choose from luxury marble, cozy wood, neon, and more.' },
                { title: 'Commercial Use', desc: '100% royalty-free images ready for your store.' }
              ].map((f, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generation / Results Section */}
        {(appState === AppState.GENERATING || appState === AppState.COMPLETE) && (
          <div className="space-y-8 animate-fade-in">
            
            <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {appState === AppState.GENERATING ? 'Creating your studio...' : 'Your Mockups'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {appState === AppState.GENERATING 
                      ? `Processing ${completedCount} of ${results.length} scenes. This may take a minute.` 
                      : `Successfully generated ${results.filter(r => !r.error).length} mockups.`}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleReset}>
                    Start Over
                  </Button>
                  {appState === AppState.COMPLETE && displayedResults.length > 0 && (
                    <Button onClick={handleDownloadAll}>
                      <Download className="mr-2" size={18} />
                      Download {showFavoritesOnly ? 'Favorites' : 'All'}
                    </Button>
                  )}
                </div>
              </div>

              {/* View Filters */}
              {appState === AppState.COMPLETE && (
                <div className="flex items-center gap-2 border-t pt-4">
                  <button 
                    onClick={() => setShowFavoritesOnly(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${!showFavoritesOnly ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    All Results ({results.length})
                  </button>
                  <button 
                    onClick={() => setShowFavoritesOnly(true)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${showFavoritesOnly ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Heart size={14} className={showFavoritesOnly ? 'fill-current' : ''} />
                    Favorites ({favoriteCount})
                  </button>
                </div>
              )}
            </div>

            {/* Progress Bar (during generation) */}
            {appState === AppState.GENERATING && results.length > 0 && (
               <div className="w-full bg-gray-200 rounded-full h-2.5">
                 <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${(completedCount / results.length) * 100}%` }}
                  ></div>
               </div>
            )}

            {/* Empty State for Favorites */}
            {showFavoritesOnly && displayedResults.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                <Heart size={48} className="mx-auto text-gray-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No favorites yet</h3>
                <p className="text-gray-500">Click the heart icon on any image to add it to your favorites.</p>
                <button 
                  onClick={() => setShowFavoritesOnly(false)}
                  className="mt-4 text-indigo-600 font-medium hover:text-indigo-800"
                >
                  View all results
                </button>
              </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Original Image Reference - Only show in 'All' view */}
              {!showFavoritesOnly && (
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 relative group">
                  <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">Original</div>
                  <img src={selectedImage || ''} alt="Original" className="w-full h-full object-contain p-4 mix-blend-multiply opacity-75" />
                </div>
              )}

              {/* Generated Results */}
              {displayedResults.map((result) => (
                <div 
                  key={result.id} 
                  className={`aspect-square rounded-xl overflow-hidden relative bg-gray-100 shadow-sm border transition-all duration-300 
                    ${result.isLoading ? 'animate-pulse' : 'hover:shadow-lg hover:-translate-y-1'} 
                    ${!result.isLoading && !result.error ? 'cursor-zoom-in' : ''}
                  `}
                  onClick={() => !result.isLoading && !result.error && setZoomedResult(result)}
                >
                  {result.isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
                      <Sparkles className="animate-spin mb-3 text-indigo-400" size={24} />
                      <span className="text-sm font-medium">Rendering {result.scene}...</span>
                    </div>
                  ) : result.error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-600 p-4 text-center bg-red-50/50 border-red-100">
                      <AlertCircle className="mb-2 opacity-60" size={24} />
                      <span className="text-sm font-semibold mb-1">Generation Failed</span>
                      <p className="text-xs text-red-500 mb-3 px-2 line-clamp-3 leading-relaxed">
                        {result.errorMessage || "An unknown error occurred."}
                      </p>
                      <Button 
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetryScene(result.id);
                        }}
                        className="h-8 px-3 text-xs bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-none"
                      >
                        <RefreshCw size={12} className="mr-1.5" />
                        Retry Scene
                      </Button>
                    </div>
                  ) : (
                    <div className="group relative w-full h-full">
                      <img 
                        src={result.imageUrl} 
                        alt={result.scene} 
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Favorite Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(result.id);
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-full z-10 transition-all duration-200 
                          ${result.isFavorite 
                            ? 'bg-white text-pink-600 shadow-md scale-100 opacity-100' 
                            : 'bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 hover:scale-110'
                          }`}
                        title={result.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart size={18} className={result.isFavorite ? "fill-current" : ""} />
                      </button>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
                        <div className="flex items-center justify-between mb-3 text-white">
                          <p className="font-medium text-sm truncate pr-2">{result.scene}</p>
                          <ZoomIn size={16} className="text-white/70" />
                        </div>
                        <Button 
                          variant="secondary" 
                          className="w-full text-xs py-2 h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(result.imageUrl, `mockupgen-${result.id}.png`);
                          }}
                        >
                          <Download size={14} className="mr-2" /> Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p className="mb-4">MockupGen © {new Date().getFullYear()}. Built with Gemini AI.</p>
          <div className="flex justify-center gap-6">
            <a href="#" className="hover:text-gray-600">Privacy Policy</a>
            <a href="#" className="hover:text-gray-600">Terms of Service</a>
            <a href="#" className="hover:text-gray-600">Contact</a>
          </div>
        </div>
      </footer>

      {/* Image Modal / Lightbox */}
      {zoomedResult && (
        <ImageModal
          imageUrl={zoomedResult.imageUrl}
          altText={zoomedResult.scene}
          onClose={() => setZoomedResult(null)}
          onDownload={() => downloadImage(zoomedResult.imageUrl, `mockupgen-${zoomedResult.id}.png`)}
        />
      )}

      {/* Image Editor Modal */}
      {isEditing && selectedImage && (
        <ImageEditor 
          imageSrc={selectedImage}
          onSave={handleSaveEditedImage}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
