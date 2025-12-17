'use client';

import { useState, useEffect } from 'react';

export default function TestGlobe() {
  const [sparks, setSparks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/sparks')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched sparks:', data);
        setSparks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl mb-4">Globe Test Page</h1>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      <div className="mb-4">
        <p>Total sparks: {sparks.length}</p>
      </div>

      <div className="space-y-2">
        {sparks.map((spark, i) => (
          <div key={spark.id} className="border border-gray-700 p-3 rounded">
            <p className="text-sm text-gray-400">#{i + 1}</p>
            <p className="font-medium">{spark.text}</p>
            <p className="text-sm text-gray-500">
              {spark.locationDisplay} - {spark.category}
            </p>
            <p className="text-xs text-gray-600">
              Lat: {spark.latitude}, Lng: {spark.longitude}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
