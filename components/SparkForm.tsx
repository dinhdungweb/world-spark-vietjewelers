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

const SparkForm = memo(function SparkForm({ initialLocation, onSubmit, onCancel }: SparkFormProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [latitude, setLatitude] = useState<number | ''>(initialLocation?.lat ?? '');
  const [longitude, setLongitude] = useState<number | ''>(initialLocation?.lng ?? '');
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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card border border-card-border rounded-xl p-6 max-w-lg w-full shadow-card animate-fade-in">
        <h2 className="text-xl text-foreground mb-5 font-light">Add Your Spark</h2>

        {showSuccess && (
          <div className="mb-5 p-4 bg-green-900/30 border border-green-800/50 rounded-lg text-green-200 text-sm font-light animate-fade-in">
            Spark submitted successfully! It will appear on the globe after moderation.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Text input */}
          <div className="mb-5">
            <label htmlFor="spark-text" className="block text-sm text-muted-foreground mb-2 font-medium">
              Your thought
            </label>
            <textarea
              id="spark-text"
              value={text}
              onChange={handleTextChange}
              className="w-full px-4 py-3 bg-background border border-card-border rounded-lg text-foreground placeholder:text-muted/60 focus:outline-none focus:border-muted/50 focus:ring-1 focus:ring-muted/30 resize-none transition-all duration-200"
              rows={4}
              placeholder="Share your thought with the world..."
              disabled={isSubmitting}
            />
          </div>

          {/* Category selector */}
          <div className="mb-5">
            <label htmlFor="spark-category" className="block text-sm text-muted-foreground mb-2 font-medium">
              Category
            </label>
            <select
              id="spark-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:border-muted/50 focus:ring-1 focus:ring-muted/30 transition-all duration-200 cursor-pointer"
              disabled={isSubmitting}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Location selection method */}
          <div className="mb-5">
            <label className="block text-sm text-muted-foreground mb-2 font-medium">
              Location
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setLocationMethod('globe')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  locationMethod === 'globe'
                    ? 'bg-accent-hover text-foreground'
                    : 'bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground/90'
                }`}
                disabled={isSubmitting}
              >
                Click on globe
              </button>
              <button
                type="button"
                onClick={() => setLocationMethod('manual')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  locationMethod === 'manual'
                    ? 'bg-accent-hover text-foreground'
                    : 'bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground/90'
                }`}
                disabled={isSubmitting}
              >
                Enter manually
              </button>
            </div>

            {locationMethod === 'globe' && (
              <p className="text-xs text-muted/80 mb-2 font-light">
                {latitude !== '' && longitude !== ''
                  ? `Selected: ${Number(latitude).toFixed(2)}°, ${Number(longitude).toFixed(2)}°`
                  : 'Click on the globe to select a location'}
              </p>
            )}

            {locationMethod === 'manual' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="latitude" className="block text-xs text-muted/80 mb-1.5 font-medium">
                    Latitude (-90 to 90)
                  </label>
                  <input
                    id="latitude"
                    type="number"
                    step="0.1"
                    min="-90"
                    max="90"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground text-sm placeholder:text-muted/50 focus:outline-none focus:border-muted/50 focus:ring-1 focus:ring-muted/30 transition-all duration-200"
                    placeholder="e.g., 52.5"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-xs text-muted/80 mb-1.5 font-medium">
                    Longitude (-180 to 180)
                  </label>
                  <input
                    id="longitude"
                    type="number"
                    step="0.1"
                    min="-180"
                    max="180"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground text-sm placeholder:text-muted/50 focus:outline-none focus:border-muted/50 focus:ring-1 focus:ring-muted/30 transition-all duration-200"
                    placeholder="e.g., 13.4"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="mb-5 p-4 bg-red-900/30 border border-red-800/50 rounded-lg animate-fade-in">
              {validationErrors.map((error, index) => (
                <p key={index} className="text-red-200 text-sm font-light">
                  {error}
                </p>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-accent/70 hover:bg-accent text-foreground/80 hover:text-foreground rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-accent-hover hover:bg-muted text-foreground rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Spark'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default SparkForm;
