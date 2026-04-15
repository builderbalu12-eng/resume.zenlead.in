import React, { useState } from 'react';
import { Loader2, Search, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchFormProps {
  onSubmit: (formData: any) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSubmit, isLoading = false, compact = false }) => {
  const [formData, setFormData] = useState({
    search_term: '',
    location: '',
    sites: ['linkedin', 'indeed', 'google'],
    is_remote: null as boolean | null,
    results_per_site: 25,
    hours_old: 72,
    include_naukri: true,
    naukri_pages: 2,
    top_n: 10,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCheckboxChange = (site: string) => {
    setFormData(prev => ({
      ...prev,
      sites: prev.sites.includes(site)
        ? prev.sites.filter(s => s !== site)
        : [...prev.sites, site],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.search_term.trim() || !formData.location.trim()) {
      alert('Please fill in Job Title and Location');
      return;
    }
    onSubmit(formData);
  };

  // ── COMPACT MODE ───────────────────────────────────────────────
  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Single search bar row */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          <Search className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
          <Input
            type="text"
            placeholder="Job title, role…"
            value={formData.search_term}
            onChange={(e) => setFormData(prev => ({ ...prev, search_term: e.target.value }))}
            disabled={isLoading}
            className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-0 bg-transparent"
          />
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
          <Input
            type="text"
            placeholder="Location…"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            disabled={isLoading}
            className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-0 bg-transparent"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-semibold px-5"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(v => !v)}
            className="shrink-0 text-slate-500 gap-1 px-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        {/* Collapsible advanced options */}
        {showAdvanced && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
            {/* Sites */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Job Sites</p>
              <div className="flex flex-wrap gap-4">
                {['indeed', 'linkedin', 'google'].map(site => (
                  <label key={site} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sites.includes(site)}
                      onChange={() => handleCheckboxChange(site)}
                      disabled={isLoading}
                      className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{site}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Work Type */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Work Type</p>
              <div className="flex gap-4">
                {[
                  { label: 'Any', value: null },
                  { label: 'Remote', value: true },
                  { label: 'On-site', value: false },
                ].map(({ label, value }) => (
                  <label key={label} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="remote"
                      checked={formData.is_remote === value}
                      onChange={() => setFormData(prev => ({ ...prev, is_remote: value }))}
                      disabled={isLoading}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Numeric settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Results / Site</label>
                <Input type="number" min="5" max="50" value={formData.results_per_site}
                  onChange={(e) => setFormData(prev => ({ ...prev, results_per_site: parseInt(e.target.value) || 25 }))}
                  disabled={isLoading} />
                <p className="text-xs text-slate-400 mt-0.5">5–50</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Hours Old</label>
                <Input type="number" min="1" value={formData.hours_old}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours_old: parseInt(e.target.value) || 72 }))}
                  disabled={isLoading} />
                <p className="text-xs text-slate-400 mt-0.5">e.g. 72 = 3 days</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Top N Results</label>
                <Input type="number" min="5" max="20" value={formData.top_n}
                  onChange={(e) => setFormData(prev => ({ ...prev, top_n: parseInt(e.target.value) || 10 }))}
                  disabled={isLoading} />
                <p className="text-xs text-slate-400 mt-0.5">5–20</p>
              </div>
            </div>

            {/* Naukri */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.include_naukri}
                  onChange={(e) => setFormData(prev => ({ ...prev, include_naukri: e.target.checked }))}
                  disabled={isLoading} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Include Naukri (India)</span>
              </label>
              {formData.include_naukri && (
                <div className="ml-6">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Naukri Pages</label>
                  <Input type="number" min="1" max="10" value={formData.naukri_pages}
                    onChange={(e) => setFormData(prev => ({ ...prev, naukri_pages: parseInt(e.target.value) || 2 }))}
                    disabled={isLoading} className="w-24" />
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    );
  }

  // ── FULL MODE (used in modals / recommendations view) ──────────
  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Job Title / Role</label>
          <Input type="text" placeholder="e.g., Full Stack Developer, Product Manager"
            value={formData.search_term}
            onChange={(e) => setFormData(prev => ({ ...prev, search_term: e.target.value }))}
            disabled={isLoading} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Location</label>
          <Input type="text" placeholder="e.g., San Francisco, CA"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            disabled={isLoading} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Job Sites</label>
        <div className="flex flex-wrap gap-4">
          {['indeed', 'linkedin', 'google'].map(site => (
            <label key={site} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.sites.includes(site)}
                onChange={() => handleCheckboxChange(site)} disabled={isLoading}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{site}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Work Type</label>
        <div className="flex gap-3">
          {[
            { label: 'Any', value: null },
            { label: 'Remote', value: true },
            { label: 'On-site', value: false },
          ].map(({ label, value }) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="remote" checked={formData.is_remote === value}
                onChange={() => setFormData(prev => ({ ...prev, is_remote: value }))}
                disabled={isLoading} className="w-4 h-4" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Results per Site</label>
          <Input type="number" min="5" max="50" value={formData.results_per_site}
            onChange={(e) => setFormData(prev => ({ ...prev, results_per_site: parseInt(e.target.value) || 25 }))}
            disabled={isLoading} />
          <p className="text-xs text-slate-500 mt-1">5–50</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Hours Old</label>
          <Input type="number" min="1" value={formData.hours_old}
            onChange={(e) => setFormData(prev => ({ ...prev, hours_old: parseInt(e.target.value) || 72 }))}
            disabled={isLoading} />
          <p className="text-xs text-slate-500 mt-1">e.g., 72 = 3 days</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Top N Results</label>
          <Input type="number" min="5" max="20" value={formData.top_n}
            onChange={(e) => setFormData(prev => ({ ...prev, top_n: parseInt(e.target.value) || 10 }))}
            disabled={isLoading} />
          <p className="text-xs text-slate-500 mt-1">5–20</p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.include_naukri}
            onChange={(e) => setFormData(prev => ({ ...prev, include_naukri: e.target.checked }))}
            disabled={isLoading} className="w-4 h-4 rounded" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Include Naukri (India)</span>
        </label>
        {formData.include_naukri && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Naukri Pages</label>
            <Input type="number" min="1" max="10" value={formData.naukri_pages}
              onChange={(e) => setFormData(prev => ({ ...prev, naukri_pages: parseInt(e.target.value) || 2 }))}
              disabled={isLoading} />
          </div>
        )}
      </div>

      <Button type="submit" disabled={isLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg font-bold py-3">
        {isLoading ? (
          <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Searching...</>
        ) : (
          <><Search className="h-5 w-5 mr-2" />Find My Jobs</>
        )}
      </Button>
    </form>
  );
};
