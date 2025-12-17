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
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4">
      <div
        ref={cardRef}
        className="bg-card border border-card-border rounded-xl p-6 max-w-md w-full pointer-events-auto shadow-card animate-fade-in"
      >
        {/* Spark text */}
        <p className="text-foreground text-lg mb-5 leading-relaxed font-light">
          {spark.text}
        </p>

        {/* Category and Location */}
        <div className="flex items-center gap-3 mb-6 text-sm">
          <span className="text-muted-foreground/80 uppercase tracking-wider text-xs font-medium">
            {spark.category}
          </span>
          <span className="text-muted/50">·</span>
          <span className="text-muted-foreground/70 font-light">
            {spark.locationDisplay}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onNext}
            className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-hover text-foreground/90 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Next spark
          </button>
          <button
            onClick={onAddSpark}
            className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-hover text-foreground/90 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Add your spark
          </button>
        </div>
      </div>
    </div>
  );
});

export default SparkCard;
