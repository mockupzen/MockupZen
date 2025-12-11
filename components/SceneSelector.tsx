
import React, { useState, useMemo } from 'react';
import { Check, CheckSquare, Square } from 'lucide-react';
import { MockupScene } from '../types';

interface SceneSelectorProps {
  scenes: MockupScene[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const SceneSelector: React.FC<SceneSelectorProps> = ({
  scenes,
  selectedIds,
  onChange,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(scenes.map(s => s.category)));
    return ['All', ...cats.sort()];
  }, [scenes]);

  // Filter scenes based on active category
  const displayedScenes = useMemo(() => {
    if (activeCategory === 'All') return scenes;
    return scenes.filter(s => s.category === activeCategory);
  }, [scenes, activeCategory]);

  // Handle toggling a single scene
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(sid => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  // Select all currently displayed scenes
  const handleSelectDisplayed = () => {
    const displayedIds = displayedScenes.map(s => s.id);
    const newSelected = new Set([...selectedIds, ...displayedIds]);
    onChange(Array.from(newSelected));
  };

  // Deselect all currently displayed scenes
  const handleDeselectDisplayed = () => {
    const displayedIds = new Set(displayedScenes.map(s => s.id));
    onChange(selectedIds.filter(id => !displayedIds.has(id)));
  };

  // Check if all displayed scenes are selected
  const areAllDisplayedSelected = displayedScenes.length > 0 && displayedScenes.every(s => selectedIds.includes(s.id));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in">
      
      {/* Header & Controls */}
      <div className="flex flex-col space-y-4 border-b border-gray-100 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            Select Scenes
            <span className="bg-indigo-100 text-indigo-700 text-xs py-0.5 px-2 rounded-full">
              {selectedIds.length} / {scenes.length}
            </span>
          </h3>
          
          {/* Bulk Actions for Displayed Items */}
          <div className="flex gap-2 text-xs font-medium">
             <button
               onClick={areAllDisplayedSelected ? handleDeselectDisplayed : handleSelectDisplayed}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-100 text-indigo-600 transition-colors"
             >
               {areAllDisplayedSelected ? (
                 <><Square size={14} /> Deselect {activeCategory === 'All' ? 'All' : activeCategory}</>
               ) : (
                 <><CheckSquare size={14} /> Select {activeCategory === 'All' ? 'All' : activeCategory}</>
               )}
             </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 
                ${activeCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {displayedScenes.map((scene) => {
          const isSelected = selectedIds.includes(scene.id);
          return (
            <div
              key={scene.id}
              onClick={() => handleToggle(scene.id)}
              className={`
                group cursor-pointer rounded-lg p-3 border text-left transition-all duration-200 select-none relative overflow-hidden
                ${isSelected 
                  ? 'bg-indigo-50/50 border-indigo-200 shadow-sm ring-1 ring-indigo-200' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`
                  w-4 h-4 rounded border flex items-center justify-center transition-colors duration-200
                  ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white group-hover:border-gray-400'}
                `}>
                  {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                    {scene.category}
                </span>
              </div>
              <p className={`text-xs font-medium leading-tight line-clamp-2 ${isSelected ? 'text-indigo-900' : 'text-gray-600'}`}>
                {scene.name}
              </p>
              
              {/* Subtle background decoration for selected items */}
              {isSelected && (
                <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-indigo-100 rounded-full blur-xl opacity-50 pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>
      
      {displayedScenes.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
              No scenes found in this category.
          </div>
      )}
    </div>
  );
};
