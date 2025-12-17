'use client';

import React, { useState, useEffect, memo } from 'react';
import { contentFilterService } from '@/lib/content-filter-service';

export interface SparkSubmission {
  text: string;
  latitude: number;
  longitude: number;
  category: string;
}

interface SparkFormProps {
  initialLocation?: { lat: number; lng: number };
  onSubmit: (data: SparkSubmission) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES = ['Thought', 'Question', 'Observation', 'Dream', 'Memory'];

import { locationService } from '@/lib/location-service';

const SparkForm = memo(function SparkForm({ initialLocation, onSubmit, onCancel }: SparkFormProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [latitude, setLatitude] = useState<number | ''>(initialLocation?.lat ?? '');
  const [longitude, setLongitude] = useState<number | ''>(initialLocation?.lng ?? '');
  const [locationName, setLocationName] = useState<string>('');
  const [locationMethod, setLocationMethod] = useState<'globe' | 'manual'>(
    initialLocation ? 'globe' : 'manual'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Update location when initialLocation changes (from globe click)
  useEffect(() => {
    if (initialLocation) {
      setLatitude(initialLocation.lat);
      setLongitude(initialLocation.lng);
      setLocationMethod('globe');

      // Fetch location name
      setLocationName('Locating...');
      locationService.reverseGeocode(initialLocation.lat, initialLocation.lng)
        .then(name => setLocationName(name))
        .catch(() => setLocationName('Unknown location'));
    }
  }, [initialLocation]);

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Validate text with content filter
    const contentValidation = contentFilterService.validate(text);
    if (!contentValidation.isValid) {
      errors.push(...contentValidation.errors);
    }

    // Validate location
    if (latitude === '' || longitude === '') {
      errors.push('Please select a location on the globe or enter coordinates manually');
    } else {
      const lat = Number(latitude);
      const lng = Number(longitude);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push('Latitude must be between -90 and 90');
      }

      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      await onSubmit({
        text,
        latitude: Number(latitude),
        longitude: Number(longitude),
        category
      });

      // Show success message
      setShowSuccess(true);

      // Reset form
      setText('');
      setLatitude('');
      setLongitude('');
      setCategory(CATEGORIES[0]);
      setLocationMethod('manual');

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      // Handle submission errors
      if (error instanceof Error) {
        // Check for network errors
        if (error.message.includes('fetch') || error.message.includes('network')) {
          setValidationErrors([
            'Network error: Unable to connect to the server. Please check your internet connection and try again.'
          ]);
        } else {
          setValidationErrors([error.message]);
        }
      } else {
        setValidationErrors(['Failed to submit spark. Please try again.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Clear validation errors when user types
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm px-4 transition-all duration-300">
      <div className="relative bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6 max-w-lg w-full shadow-2xl animate-fade-in overflow-hidden">

        <h2 className="text-xl text-white mb-6 font-medium tracking-tight">Share Your Spark</h2>

        {showSuccess && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>Spark submitted! It will appear on the globe after review.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Text input */}
          <div className="space-y-2">
            <label htmlFor="spark-text" className="block text-xs uppercase tracking-wider text-gray-500 font-medium">
              Your thought
            </label>
            <textarea
              id="spark-text"
              value={text}
              onChange={handleTextChange}
              className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-white/40 focus:ring-0 resize-none transition-all duration-200 min-h-[120px] text-sm"
              rows={4}
              placeholder="What's on your mind? Share a thought, question, or dream..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category selector */}
            <div className="space-y-2">
              <label htmlFor="spark-category" className="block text-xs uppercase tracking-wider text-gray-500 font-medium">
                Category
              </label>
              <div className="relative">
                <select
                  id="spark-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white appearance-none focus:outline-none focus:border-white/40 focus:ring-0 transition-all duration-200 cursor-pointer text-sm"
                  disabled={isSubmitting}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#111]">
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>
            </div>

            {/* Location Display */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium">
                Location
              </label>
              <div className="px-4 py-3 bg-[#111] border border-[#333] rounded-lg flex items-center justify-between h-[46px]">
                <div className="flex items-center gap-2 overflow-hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <div className="truncate text-sm text-gray-300">
                    {locationMethod === 'globe' && latitude !== ''
                      ? (locationName || `${Number(latitude).toFixed(2)}°, ${Number(longitude).toFixed(2)}°`)
                      : 'Manual Input'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Controls */}
          <div className="p-1 bg-[#111] rounded-lg flex gap-1 border border-[#222]">
            <button
              type="button"
              onClick={() => setLocationMethod('globe')}
              className={`flex-1 px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 ${locationMethod === 'globe'
                  ? 'bg-[#222] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
              Standard (Globe)
            </button>
            <button
              type="button"
              onClick={() => setLocationMethod('manual')}
              className={`flex-1 px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 ${locationMethod === 'manual'
                  ? 'bg-[#222] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              Manual coords
            </button>
          </div>

          {locationMethod === 'manual' && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in bg-[#111] p-4 rounded-lg border border-[#222]">
              <div>
                <label htmlFor="latitude" className="block text-xs text-gray-500 mb-1.5 font-medium">Latitude (-90 to 90)</label>
                <input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  min="-90"
                  max="90"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#000] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:border-white/40"
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-xs text-gray-500 mb-1.5 font-medium">Longitude (-180 to 180)</label>
                <input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  min="-180"
                  max="180"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#000] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:border-white/40"
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-red-900/10 border border-red-900/30 rounded-lg animate-fade-in">
              {validationErrors.map((error, index) => (
                <p key={index} className="text-red-400 text-sm flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {error}
                </p>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2.5 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Sending...
                </span>
              ) : 'Ignite Spark'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default SparkForm;
