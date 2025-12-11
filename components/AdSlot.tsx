import React from 'react';

interface AdSlotProps {
  className?: string;
  label?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ className = '', label = "Advertisement" }) => {
  return (
    <div className={`w-full bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 p-4 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider mb-2">{label}</span>
      <div className="w-full h-24 bg-gray-200/50 rounded flex items-center justify-center">
        <span className="text-sm">Ad Space Available</span>
      </div>
    </div>
  );
};
