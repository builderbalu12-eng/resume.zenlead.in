import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Briefcase, Search, Loader2, Trash2, Sparkles, MapPin, DollarSign } from 'lucide-react';
import { JobListPanel } from '@/components/job/JobListPanel';
import { JobRecommendModal } from '@/components/job/JobRecommendModal';
import { JobListingCard } from '@/components/job/JobListingCard';

export const FindJob: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'all'>('feed');
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const [jobLists, setJobLists] = useState<any[]>([]);
  const [defaultJobs, setDefaultJobs] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [remoteFilter, setRemoteFilter] = useState<boolean | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      // First check if user has recommendations
      const defaultResponse = await fetch('/api/jobs/default', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const defaultData = await defaultResponse.json();

      if (defaultData.has_recommendations) {
        // User has recommendations - load their lists
        setHasRecommendations(true);
        const listsResponse = await fetch('/api/jobs/lists', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        const listsData = await listsResponse.json();
        if (listsData.success) {
          setJobLists(listsData.lists || []);
        }
      } else {
        // No recommendations yet - show default jobs
        setHasRecommendations(false);
        setDefaultJobs(defaultData.jobs || []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllJobs = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search: searchQuery,
        ...(siteFilter && { site: siteFilter }),
        ...(remoteFilter !== null && { is_remote: String(remoteFilter) }),
        ...(minScore > 0 && { min_score: String(minScore) }),
      });

      const response = await fetch(`/api/jobs/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFilteredJobs(data.jobs || []);
        setCurrentPage(page);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this job list?')) return;

    try {
      const response = await fetch(`/api/jobs/lists/${listId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (response.ok) {
        setJobLists(jobLists.filter(l => l.list_id !== listId));
        setSelectedList(null);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <Briefcase className="h-16 w-16 mx-auto mb-4 text-slate-400" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Find Your Next Job</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Log in to access job recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">Find Jobs</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Discover job opportunities matched to your resume</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'feed', label: hasRecommendations ? 'My Recommendations' : 'Job Feed' },
            { id: 'all', label: 'Browse All Jobs' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'all') loadAllJobs(1);
              }}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {hasRecommendations ? (
              <>
                {/* User has recommendations */}
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Job Recommendations</h2>
                  <Button
                    onClick={() => setShowRecommendModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Find More Jobs
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : jobLists.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                    <Briefcase className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Recommendations Yet</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Start by searching for jobs matching your resume</p>
                    <Button
                      onClick={() => setShowRecommendModal(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      Find Jobs Now
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {jobLists.map(list => (
                      <div
                        key={list.list_id}
                        onClick={() => setSelectedList(list)}
                        className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 p-6 cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{list.search_term}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">📍 {list.location}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-black text-purple-600">{list.total_jobs}</div>
                            <p className="text-xs text-slate-500">jobs found</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {new Date(list.created_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteList(list.list_id);
                            }}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedList && <JobListPanel list={selectedList} onClose={() => setSelectedList(null)} />}
              </>
            ) : (
              <>
                {/* User has no recommendations - show default jobs */}
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recommended for You</h2>
                  <Button
                    onClick={() => setShowRecommendModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Find Jobs
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : defaultJobs.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                    <Search className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Jobs Available</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Start by searching for jobs matching your profile</p>
                    <Button
                      onClick={() => setShowRecommendModal(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      Find Jobs Now
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {defaultJobs.map(job => (
                      <JobListingCard key={job.job_url} job={job} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Filter Jobs</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Search</label>
                  <Input
                    placeholder="Job title, company..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    onKeyUp={() => loadAllJobs(1)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Site</label>
                  <select
                    value={siteFilter}
                    onChange={(e) => {
                      setSiteFilter(e.target.value);
                      loadAllJobs(1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white text-sm"
                  >
                    <option value="">All Sites</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="indeed">Indeed</option>
                    <option value="naukri">Naukri</option>
                    <option value="google">Google</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Remote</label>
                  <select
                    value={remoteFilter === null ? '' : remoteFilter.toString()}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        setRemoteFilter(null);
                      } else {
                        setRemoteFilter(e.target.value === 'true');
                      }
                      loadAllJobs(1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white text-sm"
                  >
                    <option value="">Any</option>
                    <option value="true">Remote Only</option>
                    <option value="false">On-site Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Min Score</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => {
                      setMinScore(parseInt(e.target.value) || 0);
                      loadAllJobs(1);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Jobs Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                <Search className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Jobs Found</h3>
                <p className="text-slate-600 dark:text-slate-400">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredJobs.map(job => (
                  <JobListingCard key={job.id} job={job} />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => loadAllJobs(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => loadAllJobs(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommendation Modal */}
      {showRecommendModal && (
        <JobRecommendModal
          onClose={() => setShowRecommendModal(false)}
          onSuccess={() => {
            setShowRecommendModal(false);
            loadRecommendations();
          }}
        />
      )}
    </div>
  );
};
