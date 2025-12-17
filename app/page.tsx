'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import Globe, { Spark } from '@/components/Globe';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { SparkSubmission } from '@/components/SparkForm';

// Lazy load components that aren't needed immediately
const SparkCard = lazy(() => import('@/components/SparkCard'));
const SparkForm = lazy(() => import('@/components/SparkForm'));

export default function Home() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [selectedSpark, setSelectedSpark] = useState<Spark | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [globeClickLocation, setGlobeClickLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch approved sparks on load
  useEffect(() => {
    const fetchSparks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/sparks');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch sparks');
        }

        const data = await response.json();

        // Convert date strings to Date objects
        const sparksWithDates = data.map((spark: any) => ({
          ...spark,
          createdAt: new Date(spark.createdAt)
        }));

        setSparks(sparksWithDates);
      } catch (err) {
        console.error('Error fetching sparks:', err);

        // Provide user-friendly error messages
        if (err instanceof TypeError && err.message.includes('fetch')) {
          setError('Network error: Unable to connect to the server. Please check your internet connection.');
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load sparks. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSparks();
  }, []);

  // Handle spark click to show card
  const handleSparkClick = (spark: Spark) => {
    setSelectedSpark(spark);
    setShowForm(false); // Close form if open
  };

  // Handle "Next spark" button
  const handleNextSpark = async () => {
    try {
      const response = await fetch('/api/sparks/random');

      if (!response.ok) {
        if (response.status === 404) {
          // No sparks available - silently return
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch random spark');
      }

      const data = await response.json();
      const sparkWithDate = {
        ...data,
        createdAt: new Date(data.createdAt)
      };

      setSelectedSpark(sparkWithDate);
    } catch (err) {
      console.error('Error fetching random spark:', err);
      // Show error in a non-intrusive way - could add a toast notification here
      // For now, just log it
    }
  };

  // Handle "Add your spark" button
  const handleAddSpark = () => {
    setSelectedSpark(null);
    setShowForm(true);
    setGlobeClickLocation(undefined); // Reset location
  };

  // Handle globe click for location selection (only when form is open)
  const handleGlobeClick = (coordinates: { lat: number; lng: number }) => {
    setGlobeClickLocation(coordinates);
    if (!showForm) {
      setShowForm(true);
      setSelectedSpark(null); // Deselect any selected spark
    }
  };

  // Handle spark submission
  const handleSparkSubmit = async (data: SparkSubmission) => {
    try {
      const response = await fetch('/api/sparks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit spark');
      }

      // Success - form will show success message
      // Don't close form immediately to let user see the success message
    } catch (err) {
      // Re-throw to let form handle the error
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      }
      throw err;
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setGlobeClickLocation(undefined);
  };

  // Handle card close
  const handleCardClose = () => {
    setSelectedSpark(null);
  };

  const FloatingActionButton = () => (
    <button
      onClick={handleAddSpark}
      className="absolute bottom-20 md:bottom-8 right-6 md:right-8 z-20 w-14 h-14 bg-foreground text-background rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group"
      aria-label="Add Spark"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover:rotate-90 transition-transform duration-200"
      >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  );

  return (
    <main className="relative w-full h-[100dvh] bg-black overflow-hidden">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <LoadingSpinner message="Loading globe..." />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
          <div className="bg-card border border-card-border rounded-xl p-6 max-w-md w-full shadow-card animate-fade-in">
            <p className="text-red-400/90 text-sm mb-5 font-light">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-foreground/90 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Globe visualization */}
      {!error && (
        <Globe
          sparks={sparks}
          onSparkClick={handleSparkClick}
          onGlobeClick={handleGlobeClick}
        />
      )}

      {/* Floating Action Button */}
      {!error && !showForm && !selectedSpark && <FloatingActionButton />}

      {/* Spark card overlay */}
      {selectedSpark && !showForm && (
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <SparkCard
            spark={selectedSpark}
            onClose={handleCardClose}
            onNext={handleNextSpark}
            onAddSpark={handleAddSpark}
          />
        </Suspense>
      )}

      {/* Spark submission form */}
      {showForm && (
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <SparkForm
            initialLocation={globeClickLocation}
            onSubmit={handleSparkSubmit}
            onCancel={handleFormCancel}
          />
        </Suspense>
      )}

      {/* Footer - subtle and minimal per Requirement 7.3 */}
      <footer className="absolute bottom-6 md:bottom-3 left-0 right-0 text-center pointer-events-none select-none px-4">
        <p className="text-[11px] text-gray-600/70 tracking-wide font-light">
          World Spark is a quiet side project by Viet Jewelers, Hanoi.
        </p>
      </footer>
    </main>
  );
}
