import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, Loader2, Trash2, ArrowUp, ArrowDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { JobCard } from '@/components/job/JobCard';
import { apiClient } from '@/services/api';
import { StaggerParent, FadeInItem } from '@/components/motion';
import { SearchForm } from '@/components/job/SearchForm';
import { MySearchesSidebar } from '@/components/job/MySearchesSidebar';
import { Page } from '@/components/layout/Page';
import { PremiumCard } from '@/components/premium/PremiumCard';
import { EmptyState } from '@/components/premium/States';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/premium/SectionHeader';

type View = 'default' | 'recommendations' | 'browse';

const API_HOST = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '')
).replace(/\/$/, '');

function apiUrl(path: string) {
  return API_HOST ? `${API_HOST}${path}` : path;
}

export const FindJob: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('auth_token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const [searchParams, setSearchParams] = useSearchParams();

  // view and selectedListId stay in React state — view is determined by API response, not user choice
  const [view, setView] = useState<View>('default');
  const [mobileSearchesOpen, setMobileSearchesOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(searchParams.get('list'));

  // URL-persisted: sort, page, filters (useful to bookmark/share)
  const sortBy = (searchParams.get('sort') as 'fit_score' | 'date_posted' | 'best_match') || 'best_match';
  const allJobsPage = Number(searchParams.get('page') || '1');
  const allJobsFilters = {
    search: searchParams.get('search') || '',
    site: searchParams.get('site') || '',
    is_remote: searchParams.get('remote') === 'true' ? true : searchParams.get('remote') === 'false' ? false : null,
    min_score: Number(searchParams.get('minScore') || '0'),
    sort_by: 'fit_score',
    sort_order: 'desc',
  };

  // URL helpers — only for sort/page/filters
  const setSortBy = (s: string) =>
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('sort', s); return n; });
  const setAllJobsPage = (p: number) =>
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('page', String(p)); return n; });
  const setAllJobsFilters = (patch: (prev: typeof allJobsFilters) => typeof allJobsFilters) => {
    const next = patch(allJobsFilters);
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev);
      if (next.search) n.set('search', next.search); else n.delete('search');
      if (next.site) n.set('site', next.site); else n.delete('site');
      if (next.is_remote !== null) n.set('remote', String(next.is_remote)); else n.delete('remote');
      if (next.min_score) n.set('minScore', String(next.min_score)); else n.delete('minScore');
      return n;
    });
  };

  const [isLoading, setIsLoading] = useState(true);
  const [defaultJobs, setDefaultJobs] = useState<any[]>([]);
  const [searches, setSearches] = useState<any[]>([]);
  const [selectedListJobs, setSelectedListJobs] = useState<any[]>([]);
  const [selectedListMeta, setSelectedListMeta] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [allJobsTotal, setAllJobsTotal] = useState(0);
  const [allJobsTotalPages, setAllJobsTotalPages] = useState(0);

  // Tracked job URLs — fetched once on mount so cards know their initial state
  const [trackedUrls, setTrackedUrls] = useState<Set<string>>(new Set());

  // Archetype filter (client-side)
  const [archetypeFilter, setArchetypeFilter] = useState<string>('');
  const ARCHETYPE_OPTIONS = [
    'AI Platform / LLMOps', 'Agentic / Automation', 'Technical AI PM',
    'Solutions Architect', 'Forward Deployed', 'Transformation Lead',
  ];

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.getApplicationHistory().then((apps: any[]) => {
      setTrackedUrls(new Set(apps.map((a: any) => a.jobUrl).filter(Boolean)));
    }).catch(() => {/* non-critical — cards just start as untracked */});
  }, [isAuthenticated]);

  // Load initial data
  useEffect(() => {
    if (!isAuthenticated) return;
    loadInitialData();
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(apiUrl('/api/jobs/default'), { headers });
      const data = await response.json();

      if (data.has_recommendations) {
        setView('recommendations');
        loadSearches();
      } else if (data.jobs && data.jobs.length > 0) {
        setView('default');
        setDefaultJobs(data.jobs);
      } else {
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
      const response = await fetch(apiUrl('/api/jobs/lists'), {
        headers,
      });
      const data = await response.json();
      if (data.success && data.lists) {
        setSearches(data.lists);
        // Load URL-specified list, or auto-select first
        const targetId = selectedListId || (data.lists.length > 0 ? data.lists[0].list_id : null);
        if (targetId) loadListJobs(targetId);
      }
    } catch (error) {
      console.error('Failed to load searches:', error);
    }
  };

  const loadListJobs = async (listId: string) => {
    try {
      setSelectedListId(listId);
      const response = await fetch(apiUrl(`/api/jobs/lists/${listId}`), {
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
      const response = await fetch(apiUrl('/api/jobs/recommend'), {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg: string = errData?.detail || errData?.message || 'Search failed';
        if (response.status === 403 || msg.toLowerCase().includes('insufficient')) {
          alert('Not enough credits to search for jobs. Visit /pricing to buy more credits.');
        } else {
          alert('Something went wrong. Please try again.');
        }
        return;
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
      const response = await fetch(apiUrl(`/api/jobs/lists/${listId}`), {
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

      const response = await fetch(apiUrl(`/api/jobs/all?${params}`), {
        headers,
      });
      const data = await response.json();
      if (data.success) {
        setAllJobs(data.jobs || []);
        setAllJobsTotal(data.total_records || 0);
        setAllJobsTotalPages(data.total_pages || 1);
        setAllJobsPage(page);   // syncs ?page= to URL
      }
    } catch (error) {
      console.error('Failed to load all jobs:', error);
    }
  };

  const getSortedJobs = (jobs: any[]) => {
    let filtered = archetypeFilter
      ? jobs.filter((j) => j.archetype === archetypeFilter)
      : jobs;
    const sorted = [...filtered];
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
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-3 bg-card">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Page>
    );
  }

  // VIEW 1: DEFAULT JOBS PAGE
  if (view === 'default') {
    return (
      <Page size="xl" className="space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Find Jobs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Discover opportunities matched to your resume.</p>
        </div>

        {/* Compact search bar — always visible */}
        <SearchForm compact onSubmit={handleSearch} isLoading={isSearching} />

        {/* Trending Jobs grid — visible immediately without scrolling */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {defaultJobs.length > 0 ? 'Jobs For You' : 'Trending Jobs Today'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {defaultJobs.length > 0
                  ? 'Based on your preferences and search history'
                  : 'Run a search above to get AI-matched jobs for your resume'}
              </p>
            </div>
            {defaultJobs.length > 0 && (
              <span className="text-xs text-slate-400">{defaultJobs.length} jobs</span>
            )}
          </div>

          {defaultJobs.length === 0 ? (
            <PremiumCard hover={false} className="p-10 text-center border-dashed">
              <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-base font-semibold mb-1">No jobs yet</h3>
              <p className="text-sm text-muted-foreground">Run a search above — results will appear here.</p>
            </PremiumCard>
          ) : (
            <StaggerParent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultJobs.map(job => (
                <FadeInItem key={job.job_url}><JobCard job={job} initialTracked={trackedUrls.has(job.job_url)} onTracked={(url) => setTrackedUrls(prev => new Set(prev).add(url))} /></FadeInItem>
              ))}
            </StaggerParent>
          )}
        </div>

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
      </Page>
    );
  }

  // VIEW 2: MY RECOMMENDATIONS
  if (view === 'recommendations') {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
        {/* Sidebar — desktop only */}
        <div className="hidden md:block">
          <MySearchesSidebar
            searches={searches}
            selectedListId={selectedListId}
            onSelectSearch={loadListJobs}
            onNewSearch={() => setShowSearchForm(true)}
            onDeleteSearch={handleDeleteSearch}
          />
        </div>

        {/* Mobile Sheet sidebar */}
        <Sheet open={mobileSearchesOpen} onOpenChange={setMobileSearchesOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <MySearchesSidebar
              searches={searches}
              selectedListId={selectedListId}
              onSelectSearch={(id) => { loadListJobs(id); setMobileSearchesOpen(false); }}
              onNewSearch={() => { setShowSearchForm(true); setMobileSearchesOpen(false); }}
              onDeleteSearch={handleDeleteSearch}
            />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Mobile header bar */}
          <div className="flex md:hidden items-center gap-3 px-4 py-2.5 border-b bg-card shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setMobileSearchesOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-sm font-semibold text-foreground">My Searches</span>
          </div>

          {/* Header */}
          {selectedListMeta && (
            <div className="border-b bg-card px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground leading-snug">
                    {selectedListMeta.search_term}
                    <span className="mx-1.5 text-muted-foreground font-normal">·</span>
                    <span className="text-muted-foreground font-normal">{selectedListMeta.location}</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedListMeta.total_jobs} jobs · searched{' '}
                    {new Date(selectedListMeta.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={archetypeFilter}
                    onChange={(e) => setArchetypeFilter(e.target.value)}
                    className="h-7 cursor-pointer rounded-md border border-border/70 bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">All Archetypes</option>
                    {ARCHETYPE_OPTIONS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="h-7 cursor-pointer rounded-md border border-border/70 bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="best_match">Best Match</option>
                    <option value="fit_score">Highest Score</option>
                    <option value="date_posted">Newest</option>
                  </select>
                </div>
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
              <StaggerParent className="grid md:grid-cols-2 gap-6">
                {getSortedJobs(selectedListJobs).map(job => (
                  <FadeInItem key={job.job_url}><JobCard job={job} initialTracked={trackedUrls.has(job.job_url)} onTracked={(url) => setTrackedUrls(prev => new Set(prev).add(url))} /></FadeInItem>
                ))}
              </StaggerParent>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
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
                setAllJobsFilters(() => ({
                  search: '',
                  site: '',
                  is_remote: null,
                  min_score: 0,
                  sort_by: 'fit_score',
                  sort_order: 'desc',
                }));
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
            <StaggerParent className="grid md:grid-cols-2 gap-6">
              {allJobs.map(job => (
                <FadeInItem key={job.id || job.job_url}><JobCard job={job} initialTracked={trackedUrls.has(job.job_url)} onTracked={(url) => setTrackedUrls(prev => new Set(prev).add(url))} /></FadeInItem>
              ))}
            </StaggerParent>
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
