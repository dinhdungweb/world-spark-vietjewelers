'use client';

import React, { useEffect, useRef, memo } from 'react';

export interface Spark {
  id: string;
  text: string;
  latitude: number;
  longitude: number;
  category: string;
  locationDisplay: string;
  createdAt: Date;
}

interface SparkCardProps {
  spark: Spark;
  onClose: () => void;
  onNext: () => void;
  onAddSpark: () => void;
}

const SparkCard = memo(function SparkCard({ spark, onClose, onNext, onAddSpark }: SparkCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close card
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4 bg-black/40 backdrop-blur-[2px] transition-all duration-300">
      <div
        ref={cardRef}
        className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6 max-w-md w-full pointer-events-auto shadow-2xl animate-fade-in"
      >
        {/* Spark text */}
        <p className="text-white text-lg mb-6 leading-relaxed font-light">
          "{spark.text}"
        </p>

        {/* Category and Location */}
        <div className="flex items-center gap-3 mb-8 text-sm border-t border-[#2a2a2a] pt-4">
          <span className="text-blue-400 uppercase tracking-wider text-[10px] font-semibold bg-blue-900/10 px-2 py-1 rounded">
            {spark.category}
          </span>
          <span className="text-gray-500 font-light text-xs flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            {spark.locationDisplay}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onNext}
            className="flex-1 px-4 py-2 bg-[#222] hover:bg-[#333] text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-all duration-200"
          >
            Next spark
          </button>
          <button
            onClick={onAddSpark}
            className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg text-sm font-medium transition-all duration-200"
          >
            Add your spark
          </button>
        </div>
      </div>
    </div>
  );
});

export default SparkCard;
