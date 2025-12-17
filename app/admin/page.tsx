'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Spark {
  id: string;
  text: string;
  category: string;
  locationDisplay: string;
  createdAt: string;
  approvedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
}

type TabType = 'pending' | 'approved' | 'rejected';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  /* New state for stats */
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      setSparks([]);
      setPage(0);
      setHasMore(true);
      setSelectedIds(new Set());
      fetchSparks(activeTab, 0, true);
      updateStats(); // Fetch stats on tab change or init
    }
  }, [status, activeTab]);

  const updateStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  const fetchSparks = async (tab: TabType, pageNum: number, isNewTab = false) => {
    try {
      if (isNewTab) setLoading(true);
      setError(null);

      const limit = 50;
      const skip = pageNum * limit;

      const response = await fetch(`/api/admin/sparks?status=${tab}&skip=${skip}&take=${limit}`);

      if (!response.ok) throw new Error('Failed to fetch sparks');

      const data = await response.json();

      if (isNewTab) {
        setSparks(data);
      } else {
        setSparks(prev => [...prev, ...data]);
      }

      setHasMore(data.length === limit);

    } catch (err) {
      console.error('Error:', err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSparks(activeTab, nextPage);
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSparks.length && filteredSparks.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSparks.map(s => s.id)));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0 || !confirm(`Confirm ${action.toUpperCase()} ${selectedIds.size} items?`)) return;

    setBulkLoading(true);
    const idsToProcess = Array.from(selectedIds);
    const batchSize = 10;
    const errors: string[] = [];
    const originalSparks = [...sparks];

    // Optimistic UI
    setSparks(sparks.filter(s => !selectedIds.has(s.id)));
    setSelectedIds(new Set());

    try {
      for (let i = 0; i < idsToProcess.length; i += batchSize) {
        const batch = idsToProcess.slice(i, i + batchSize);
        await Promise.all(batch.map(async (id) => {
          try {
            const res = await fetch(`/api/admin/sparks/${id}/${action}`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed');
          } catch { errors.push(id); }
        }));
      }
      // Update stats and refresh list if needed
      updateStats();
      if (errors.length > 0) fetchSparks(activeTab, 0, true);
    } catch (err) {
      setSparks(originalSparks);
      setError('Action failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleAction = async (sparkId: string, action: 'approve' | 'reject', e: React.MouseEvent) => {
    e.stopPropagation();
    const originalSparks = [...sparks];
    setSparks(sparks.filter(s => s.id !== sparkId));
    setActionLoading(sparkId);

    try {
      const response = await fetch(`/api/admin/sparks/${sparkId}/${action}`, { method: 'POST' });
      if (!response.ok) throw new Error(`Failed`);
      updateStats(); // Update stats on single action too
    } catch (err) {
      setSparks(originalSparks);
      setError(`Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSparks = useMemo(() => {
    return sparks.filter(spark => {
      const matchesSearch = spark.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spark.locationDisplay.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || spark.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [sparks, searchQuery, filterCategory]);

  const categories = ['All', 'Thought', 'Question', 'Observation', 'Dream', 'Memory'];
  const allSelected = filteredSparks.length > 0 && selectedIds.size === filteredSparks.length;

  if (status === 'loading' || status === 'unauthenticated') return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24">
      {/* Compact Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur-sm border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">

            {/* Left: Logo & Tabs - Compact Mode */}
            <div className="flex items-center gap-4 overflow-hidden flex-1 sm:flex-none">
              <h1 className="text-sm font-bold tracking-tight shrink-0 hidden sm:block">WS Admin</h1>

              <div className="flex bg-[#111] rounded-lg p-0.5 border border-[#222] w-full sm:w-auto whitespace-nowrap overflow-x-auto no-scrollbar scroll-smooth gap-0.5">
                {(['pending', 'approved', 'rejected'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`min-w-fit px-3 py-1.5 rounded-md text-[11px] font-medium transition-all capitalize flex items-center justify-center whitespace-nowrap ${activeTab === tab
                        ? 'bg-[#222] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    {tab === 'approved' ? 'Live' : tab}
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-black/30 text-gray-200' : 'bg-[#222] text-gray-600'
                      }`}>
                      {tab === 'pending' ? stats.pending : tab === 'approved' ? stats.approved : stats.rejected}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              {/* Search - Collapsible on small screens ideally, but keeps it simple here */}
              <div className="relative max-w-[200px] w-full hidden sm:block">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] text-gray-300 text-xs rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-[#444] transition-all"
                />
                <svg className="absolute left-2.5 top-2 text-gray-600 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>


              <button
                onClick={toggleSelectAll}
                className={`hidden sm:block text-[10px] font-medium px-3 py-1.5 rounded border transition-colors ${allSelected ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' : 'bg-[#111] text-gray-400 border-[#222] hover:bg-[#222]'}`}
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>

              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#111] hover:bg-[#222] border border-[#222] transition-colors"
                title="Log out"
              >
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>

          {/* Mobile Search & Actions Row */}
          <div className="sm:hidden pb-3 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] border border-[#222] text-gray-300 text-xs rounded-lg pl-8 pr-2 py-2 focus:outline-none focus:border-[#444]"
              />
              <svg className="absolute left-2.5 top-2.5 text-gray-600 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>

            <button
              onClick={toggleSelectAll}
              className={`shrink-0 text-[10px] font-medium px-3 rounded border transition-colors ${allSelected ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' : 'bg-[#111] text-gray-400 border-[#222] hover:bg-[#222]'}`}
            >
              {allSelected ? 'Deselect' : 'Select All'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error && <div className="bg-red-500/10 text-red-500 text-xs p-3 rounded mb-4">{error}</div>}

        {loading && page === 0 ? (
          <div className="py-20 flex justify-center"><LoadingSpinner message="" /></div>
        ) : filteredSparks.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-gray-600 text-sm">No sparks found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSparks.map((spark) => {
                const isSelected = selectedIds.has(spark.id);
                return (
                  <div
                    key={spark.id}
                    onClick={(e) => toggleSelect(spark.id, e)}
                    className={`group relative bg-[#0f0f0f] rounded-lg p-4 border cursor-pointer transition-all duration-200 flex flex-col h-full ${isSelected ? 'border-blue-500/40' : 'border-[#1a1a1a] hover:border-[#333]'
                      }`}
                  >
                    {/* Checkbox */}
                    <div className={`absolute top-3 right-3 w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-[#333] bg-[#1a1a1a] opacity-0 group-hover:opacity-100'
                      }`}>
                      {isSelected && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${spark.category === 'Thought' ? 'bg-blue-400' :
                          spark.category === 'Dream' ? 'bg-purple-400' :
                            spark.category === 'Question' ? 'bg-yellow-400' :
                              'bg-gray-400'
                          }`} />
                        <span className="text-[10px] text-gray-500 font-medium uppercase">{spark.category}</span>
                      </div>

                      <p className="text-gray-200 text-sm leading-relaxed mb-3 line-clamp-4 font-light">
                        {spark.text}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex items-center justify-between">
                      <span className="text-[10px] text-gray-600 truncate max-w-[100px]">{spark.locationDisplay}</span>

                      <div className="flex gap-1">
                        {activeTab === 'pending' && (
                          <>
                            <button onClick={(e) => handleAction(spark.id, 'reject', e)} disabled={actionLoading === spark.id} className="p-1.5 hover:bg-red-900/20 text-gray-500 hover:text-red-400 rounded transition-colors" title="Reject">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            <button onClick={(e) => handleAction(spark.id, 'approve', e)} disabled={actionLoading === spark.id} className="p-1.5 hover:bg-green-900/20 text-gray-500 hover:text-green-400 rounded transition-colors" title="Approve">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </button>
                          </>
                        )}
                        {activeTab === 'approved' && (
                          <button onClick={(e) => handleAction(spark.id, 'reject', e)} className="text-[10px] text-gray-500 hover:text-red-400 transition-colors">Delete</button>
                        )}
                        {activeTab === 'rejected' && (
                          <button onClick={(e) => handleAction(spark.id, 'approve', e)} className="text-[10px] text-gray-500 hover:text-green-400 transition-colors">Restore</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="mt-8 text-center pb-20">
                <button onClick={handleLoadMore} disabled={loading} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  {loading ? 'Loading...' : 'Load more items'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modern Floating Action Bar */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#111] border border-[#222] shadow-2xl rounded-full px-5 py-2 flex items-center gap-4 transition-all duration-300 z-50 ${selectedIds.size > 0 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
        }`}>
        <span className="text-xs font-semibold text-white">{selectedIds.size} Selected</span>
        <div className="w-[1px] h-4 bg-[#333]"></div>
        <div className="flex gap-2">
          {activeTab === 'pending' && (
            <>
              <button onClick={() => handleBulkAction('reject')} disabled={bulkLoading} className="text-xs font-medium text-red-400 hover:text-red-300 px-2 py-1">Reject All</button>
              <button onClick={() => handleBulkAction('approve')} disabled={bulkLoading} className="text-xs font-bold text-black bg-white hover:bg-gray-200 px-3 py-1.5 rounded-full shadow-lg">Approve All</button>
            </>
          )}
          {activeTab === 'approved' && <button onClick={() => handleBulkAction('reject')} className="text-xs text-red-400 hover:text-red-300">Delete Selected</button>}
          {activeTab === 'rejected' && <button onClick={() => handleBulkAction('approve')} className="text-xs text-green-400 hover:text-green-300">Restore Selected</button>}
        </div>
      </div>
    </div>
  );
}
