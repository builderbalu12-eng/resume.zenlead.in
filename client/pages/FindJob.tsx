import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, Loader2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobCard } from '@/components/job/JobCard';
import { SearchForm } from '@/components/job/SearchForm';
import { MySearchesSidebar } from '@/components/job/MySearchesSidebar';
import { Page } from '@/components/layout/Page';
import { PremiumCard } from '@/components/premium/PremiumCard';
import { EmptyState, LoadingState } from '@/components/premium/States';
import { SectionHeader } from '@/components/premium/SectionHeader';

type View = 'default' | 'recommendations' | 'browse';

export const FindJob: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('auth_token');
  const headers = { 'Authorization': `Bearer ${token}` };

  // State
  const [view, setView] = useState<View>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [defaultJobs, setDefaultJobs] = useState<any[]>([]);
  const [searches, setSearches] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedListJobs, setSelectedListJobs] = useState<any[]>([]);
  const [selectedListMeta, setSelectedListMeta] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [sortBy, setSortBy] = useState<'fit_score' | 'date_posted' | 'best_match'>('best_match');
  const [allJobsPage, setAllJobsPage] = useState(1);
  const [allJobsFilters, setAllJobsFilters] = useState({
    search: '',
    site: '',
    is_remote: null as boolean | null,
    min_score: 0,
    sort_by: 'fit_score',
    sort_order: 'desc',
  });
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [allJobsTotal, setAllJobsTotal] = useState(0);
  const [allJobsTotalPages, setAllJobsTotalPages] = useState(0);

  // Load initial data
  useEffect(() => {
    if (!isAuthenticated) return;
    loadInitialData();
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/api/jobs/default', {
        headers,
      });
      const data = await response.json();

      if (data.has_recommendations) {
        // User has recommendations - show VIEW 2
        setView('recommendations');
        loadSearches();
      } else if (data.jobs && data.jobs.length > 0) {
        // No recommendations - show VIEW 1 with default jobs
        setView('default');
        setDefaultJobs(data.jobs);
      } else {
        // No jobs at all - show VIEW 1 empty state
        setView('default');
        setDefaultJobs([]);
      }
    } catch (error) {
      console.error('Failed to load default jobs:', error);
      setView('default');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSearches = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/jobs/lists', {
        headers,
      });
      const data = await response.json();
      if (data.success && data.lists) {
        setSearches(data.lists);
        if (data.lists.length > 0 && !selectedListId) {
          loadListJobs(data.lists[0].list_id);
        }
      }
    } catch (error) {
      console.error('Failed to load searches:', error);
    }
  };

  const loadListJobs = async (listId: string) => {
    try {
      setSelectedListId(listId);
      const response = await fetch(`http://localhost:8000/api/jobs/lists/${listId}`, {
        headers,
      });
      const data = await response.json();
      if (data.success) {
        setSelectedListJobs(data.jobs || []);
        setSelectedListMeta({
          search_term: data.search_term,
          location: data.location,
          total_jobs: data.total_jobs,
          created_at: data.created_at,
        });
      }
    } catch (error) {
      console.error('Failed to load list jobs:', error);
    }
  };

  const handleSearch = async (formData: any) => {
    setIsSearching(true);
    try {
      const response = await fetch('http://localhost:8000/api/jobs/recommend', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      if (data.success) {
        setShowSearchForm(false);
        setView('recommendations');
        await loadSearches();
      }
    } catch (error) {
      alert('Something went wrong. Please try again.');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteSearch = async (listId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/jobs/lists/${listId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setSearches(searches.filter(s => s.list_id !== listId));
        if (selectedListId === listId) {
          setSelectedListId(null);
          setSelectedListJobs([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete search:', error);
    }
  };

  const loadAllJobs = async (page: number = 1) => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      params.set("search", allJobsFilters.search || "");
      params.set("site", allJobsFilters.site || "");
      if (allJobsFilters.is_remote !== null) {
        params.set("is_remote", String(allJobsFilters.is_remote));
      }
      params.set("min_score", String(allJobsFilters.min_score || 0));
      params.set("sort_by", allJobsFilters.sort_by || "fit_score");
      params.set("sort_order", allJobsFilters.sort_order || "desc");

      const response = await fetch(`http://localhost:8000/api/jobs/all?${params}`, {
        headers,
      });
      const data = await response.json();
      if (data.success) {
        setAllJobs(data.jobs || []);
        setAllJobsTotal(data.total_records || 0);
        setAllJobsTotalPages(data.total_pages || 1);
        setAllJobsPage(page);
      }
    } catch (error) {
      console.error('Failed to load all jobs:', error);
    }
  };

  const getSortedJobs = (jobs: any[]) => {
    const sorted = [...jobs];
    if (sortBy === 'fit_score') {
      return sorted.sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));
    } else if (sortBy === 'date_posted') {
      return sorted.sort((a, b) => new Date(b.date_posted).getTime() - new Date(a.date_posted).getTime());
    }
    return sorted;
  };

  if (!isAuthenticated) {
    return (
      <Page size="md">
        <EmptyState
          title="Find jobs"
          description="Sign in to discover job opportunities matched to your resume."
          action={
            <Button variant="gradient" asChild>
              <a href="/login">Sign in</a>
            </Button>
          }
        />
      </Page>
    );
  }

  if (isLoading) {
    return (
      <Page size="md">
        <LoadingState title="Loading jobs" description="Fetching your job feed…" />
      </Page>
    );
  }

  // VIEW 1: DEFAULT JOBS PAGE
  if (view === 'default') {
    return (
      <Page size="xl" className="space-y-10">
        <SectionHeader
          title="Find jobs"
          description="Discover opportunities matched to your resume."
        />

          {/* Search Form */}
          {!isSearching && <SearchForm onSubmit={handleSearch} isLoading={isSearching} />}

          {/* Loading Overlay */}
          {isSearching && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 max-w-md w-full text-center space-y-4">
                <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Searching jobs across LinkedIn, Indeed, Google & Naukri...</h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">AI is ranking them against your resume. This takes ~30–60 seconds.</p>
                </div>
              </div>
            </div>
          )}

          {/* Default Jobs Grid */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Trending Jobs Today</h2>
              <p className="text-slate-600 dark:text-slate-400">Run a search above to get AI-matched jobs for YOUR resume</p>
            </div>

            {defaultJobs.length === 0 ? (
              <PremiumCard hover={false} className="p-12 text-center border-dashed">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-1">No jobs available yet</h3>
                <p className="text-sm text-muted-foreground">Be the first to run a search.</p>
              </PremiumCard>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {defaultJobs.map(job => (
                  <JobCard key={job.job_url} job={job} />
                ))}
              </div>
            )}
          </div>
      </Page>
    );
  }

  // VIEW 2: MY RECOMMENDATIONS
  if (view === 'recommendations') {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
        {/* Sidebar */}
        <MySearchesSidebar
          searches={searches}
          selectedListId={selectedListId}
          onSelectSearch={loadListJobs}
          onNewSearch={() => setShowSearchForm(true)}
          onDeleteSearch={handleDeleteSearch}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Header */}
          {selectedListMeta && (
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedListMeta.search_term} • {selectedListMeta.location}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {selectedListMeta.total_jobs} jobs found • searched on{' '}
                {new Date(selectedListMeta.created_at).toLocaleDateString()}
              </p>

              {/* Sort */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                >
                  <option value="best_match">Best Match</option>
                  <option value="fit_score">Highest Score</option>
                  <option value="date_posted">Newest</option>
                </select>
              </div>
            </div>
          )}

          {/* Jobs Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedListJobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">No jobs in this search</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {getSortedJobs(selectedListJobs).map(job => (
                  <JobCard key={job.job_url} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Form Modal */}
        {showSearchForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">New Job Search</h2>
              <SearchForm onSubmit={handleSearch} isLoading={isSearching} />
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowSearchForm(false)}
                disabled={isSearching}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isSearching && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 max-w-md w-full text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Searching jobs...</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">This takes ~30–60 seconds.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 3: BROWSE ALL JOBS
  return (
    <Page size="xl" className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Browse All Jobs</h1>
          <p className="text-slate-600 dark:text-slate-400">Explore jobs from across all sources</p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Filters</h3>
          <div className="grid md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search..."
              value={allJobsFilters.search}
              onChange={(e) => {
                setAllJobsFilters(prev => ({ ...prev, search: e.target.value }));
              }}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
            />
            <select
              value={allJobsFilters.site}
              onChange={(e) => {
                setAllJobsFilters(prev => ({ ...prev, site: e.target.value }));
                loadAllJobs(1);
              }}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
            >
              <option value="">All Sites</option>
              <option value="indeed">Indeed</option>
              <option value="linkedin">LinkedIn</option>
              <option value="naukri">Naukri</option>
              <option value="google">Google</option>
            </select>
            <select
              value={allJobsFilters.is_remote === null ? '' : String(allJobsFilters.is_remote)}
              onChange={(e) => {
                const value = e.target.value === '' ? null : e.target.value === 'true';
                setAllJobsFilters(prev => ({ ...prev, is_remote: value }));
                loadAllJobs(1);
              }}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="true">Remote</option>
              <option value="false">On-site</option>
            </select>
            <input
              type="range"
              min="0"
              max="100"
              value={allJobsFilters.min_score}
              onChange={(e) => {
                setAllJobsFilters(prev => ({ ...prev, min_score: parseInt(e.target.value) }));
                loadAllJobs(1);
              }}
              className="px-3 py-2"
            />
            <Button
              variant="outline"
              onClick={() => {
                setAllJobsFilters({
                  search: '',
                  site: '',
                  is_remote: null,
                  min_score: 0,
                  sort_by: 'fit_score',
                  sort_order: 'desc',
                });
                loadAllJobs(1);
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {(allJobsPage - 1) * 20 + 1}–{Math.min(allJobsPage * 20, allJobsTotal)} of {allJobsTotal} jobs | Page {allJobsPage} of {allJobsTotalPages}
          </p>

          {allJobs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
              <Briefcase className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No jobs found</h3>
              <p className="text-slate-600 dark:text-slate-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {allJobs.map(job => (
                <JobCard key={job.id || job.job_url} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {allJobsTotalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <Button
              variant="outline"
              disabled={allJobsPage === 1}
              onClick={() => loadAllJobs(allJobsPage - 1)}
            >
              ← Previous
            </Button>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Page {allJobsPage} of {allJobsTotalPages}
            </span>
            <Button
              variant="outline"
              disabled={allJobsPage === allJobsTotalPages}
              onClick={() => loadAllJobs(allJobsPage + 1)}
            >
              Next →
            </Button>
          </div>
        )}
    </Page>
  );
};
