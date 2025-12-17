'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Spark {
  id: string;
  text: string;
  category: string;
  locationDisplay: string;
  createdAt: string;
  latitude: number;
  longitude: number;
  status: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPendingSparks();
    }
  }, [status]);

  const fetchPendingSparks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/sparks/pending');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch pending sparks');
      }
      
      const data = await response.json();
      setSparks(data);
    } catch (err) {
      console.error('Error fetching pending sparks:', err);
      
      // Provide user-friendly error messages
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Unable to connect to the server. Please check your internet connection.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sparkId: string) => {
    // Optimistic update
    const originalSparks = [...sparks];
    setSparks(sparks.filter(s => s.id !== sparkId));
    setActionLoading(sparkId);

    try {
      const response = await fetch(`/api/admin/sparks/${sparkId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to approve spark');
      }
    } catch (err) {
      console.error('Error approving spark:', err);
      
      // Rollback on error
      setSparks(originalSparks);
      
      // Provide user-friendly error messages
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Unable to approve spark. Please check your internet connection.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to approve spark. Please try again.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (sparkId: string) => {
    // Optimistic update
    const originalSparks = [...sparks];
    setSparks(sparks.filter(s => s.id !== sparkId));
    setActionLoading(sparkId);

    try {
      const response = await fetch(`/api/admin/sparks/${sparkId}/reject`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reject spark');
      }
    } catch (err) {
      console.error('Error rejecting spark:', err);
      
      // Rollback on error
      setSparks(originalSparks);
      
      // Provide user-friendly error messages
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Unable to reject spark. Please check your internet connection.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reject spark. Please try again.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-light">Admin Panel</h1>
          <p className="text-muted-foreground text-sm font-light">
            {session?.user?.email}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 text-red-200 px-4 py-3 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in">
            <span className="font-light">{error}</span>
            <button
              onClick={() => {
                setError(null);
                fetchPendingSparks();
              }}
              className="px-4 py-1.5 bg-red-800/50 hover:bg-red-700/50 text-red-100 rounded-lg text-sm font-medium transition-all duration-200"
            >
              Retry
            </button>
          </div>
        )}

        <div className="bg-card border border-card-border rounded-xl p-4 sm:p-6 shadow-card">
          <h2 className="text-lg sm:text-xl font-light mb-6 text-foreground/90">Pending Sparks</h2>

          {loading ? (
            <div className="text-center py-12">
              <LoadingSpinner message="Loading pending sparks..." />
            </div>
          ) : sparks.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground text-lg font-light">No pending sparks</p>
              <p className="text-muted text-sm mt-2 font-light">
                All sparks have been reviewed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sparks.map((spark) => (
                <div
                  key={spark.id}
                  className="bg-background rounded-xl p-4 sm:p-6 border border-card-border card-hover animate-fade-in"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <p className="text-foreground text-base sm:text-lg mb-3 font-light leading-relaxed">{spark.text}</p>
                      <div className="flex flex-wrap gap-3 sm:gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="text-muted text-xs uppercase tracking-wider">Category:</span>
                          <span className="text-foreground/80 font-light">{spark.category}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-muted text-xs uppercase tracking-wider">Location:</span>
                          <span className="text-foreground/80 font-light">{spark.locationDisplay}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-muted text-xs uppercase tracking-wider">Submitted:</span>
                          <span className="text-foreground/80 font-light">
                            {new Date(spark.createdAt).toLocaleString()}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(spark.id)}
                      disabled={actionLoading === spark.id}
                      className="px-4 py-2.5 bg-green-700/80 hover:bg-green-600/80 text-green-50 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {actionLoading === spark.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(spark.id)}
                      disabled={actionLoading === spark.id}
                      className="px-4 py-2.5 bg-red-700/80 hover:bg-red-600/80 text-red-50 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {actionLoading === spark.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
