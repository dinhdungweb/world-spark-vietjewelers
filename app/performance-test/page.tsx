'use client';

import { useState, useEffect } from 'react';
import Globe, { Spark } from '@/components/Globe';
import { performanceMonitor } from '@/lib/performance-monitor';

export default function PerformanceTestPage() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    current: 0,
    average: 0,
    min: 0,
    max: 0,
    acceptable: false,
  });

  // Fetch approved sparks
  useEffect(() => {
    const fetchSparks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/sparks');
        
        if (!response.ok) {
          throw new Error('Failed to fetch sparks');
        }
        
        const data = await response.json();
        
        const sparksWithDates = data.map((spark: any) => ({
          ...spark,
          createdAt: new Date(spark.createdAt)
        }));
        
        setSparks(sparksWithDates);
      } catch (err) {
        console.error('Error fetching sparks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sparks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSparks();
  }, []);

  // Update performance stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(performanceMonitor.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative w-full h-screen bg-black">
      {/* Performance stats overlay */}
      <div className="absolute top-4 left-4 z-50 bg-gray-900 bg-opacity-90 border border-gray-700 rounded-lg p-4 text-white font-mono text-sm">
        <h3 className="text-lg font-bold mb-2">Performance Stats</h3>
        <div className="space-y-1">
          <div>Sparks: <span className="text-yellow-400">{sparks.length.toLocaleString()}</span></div>
          <div>FPS: <span className={stats.current >= 30 ? 'text-green-400' : 'text-red-400'}>{stats.current}</span></div>
          <div>Avg FPS: <span className={stats.average >= 30 ? 'text-green-400' : 'text-red-400'}>{stats.average}</span></div>
          <div>Min FPS: <span className={stats.min >= 30 ? 'text-green-400' : 'text-red-400'}>{stats.min}</span></div>
          <div>Max FPS: <span className="text-blue-400">{stats.max}</span></div>
          <div className="pt-2 border-t border-gray-700">
            Status: <span className={stats.acceptable ? 'text-green-400' : 'text-red-400'}>
              {stats.acceptable ? '✓ Good' : '✗ Poor'}
            </span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
          Target: ≥30 FPS for acceptable performance
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-white">Loading sparks...</div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md mx-4">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Globe visualization */}
      {!error && <Globe sparks={sparks} />}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 right-4 text-center text-gray-500 text-sm">
        <p>Performance Test Page - Rotate and zoom the globe to test performance</p>
        <p className="text-xs mt-1">Run `npm run prisma:seed-performance` to create 10,000 test sparks</p>
      </div>
    </main>
  );
}
