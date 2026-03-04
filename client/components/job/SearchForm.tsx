import React, { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchFormProps {
  onSubmit: (formData: any) => void;
  isLoading?: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSubmit, isLoading = false }) => {
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

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
      {/* Row 1: Job Title & Location */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Job Title / Role
          </label>
          <Input
            type="text"
            placeholder="e.g., Full Stack Developer, Product Manager"
            value={formData.search_term}
            onChange={(e) => setFormData(prev => ({ ...prev, search_term: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Location
          </label>
          <Input
            type="text"
            placeholder="e.g., San Francisco, CA"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Row 2: Sites Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Job Sites
        </label>
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
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                {site}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Row 3: Remote Toggle */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Work Type
        </label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="remote"
              checked={formData.is_remote === null}
              onChange={() => setFormData(prev => ({ ...prev, is_remote: null }))}
              disabled={isLoading}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Any</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="remote"
              checked={formData.is_remote === true}
              onChange={() => setFormData(prev => ({ ...prev, is_remote: true }))}
              disabled={isLoading}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Remote</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="remote"
              checked={formData.is_remote === false}
              onChange={() => setFormData(prev => ({ ...prev, is_remote: false }))}
              disabled={isLoading}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">On-site</span>
          </label>
        </div>
      </div>

      {/* Row 4: Results Configuration */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Results per Site
          </label>
          <Input
            type="number"
            min="5"
            max="50"
            value={formData.results_per_site}
            onChange={(e) => setFormData(prev => ({ ...prev, results_per_site: parseInt(e.target.value) || 25 }))}
            disabled={isLoading}
          />
          <p className="text-xs text-slate-500 mt-1">5–50</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Hours Old
          </label>
          <Input
            type="number"
            min="1"
            value={formData.hours_old}
            onChange={(e) => setFormData(prev => ({ ...prev, hours_old: parseInt(e.target.value) || 72 }))}
            disabled={isLoading}
          />
          <p className="text-xs text-slate-500 mt-1">e.g., 72 = 3 days</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Top N Results
          </label>
          <Input
            type="number"
            min="5"
            max="20"
            value={formData.top_n}
            onChange={(e) => setFormData(prev => ({ ...prev, top_n: parseInt(e.target.value) || 10 }))}
            disabled={isLoading}
          />
          <p className="text-xs text-slate-500 mt-1">5–20</p>
        </div>
      </div>

      {/* Row 5: Naukri Settings */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.include_naukri}
            onChange={(e) => setFormData(prev => ({ ...prev, include_naukri: e.target.checked }))}
            disabled={isLoading}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Include Naukri (India)</span>
        </label>

        {formData.include_naukri && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Naukri Pages
            </label>
            <Input
              type="number"
              min="1"
              max="10"
              value={formData.naukri_pages}
              onChange={(e) => setFormData(prev => ({ ...prev, naukri_pages: parseInt(e.target.value) || 2 }))}
              disabled={isLoading}
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg font-bold py-3"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="h-5 w-5 mr-2" />
            Find My Jobs
          </>
        )}
      </Button>
    </form>
  );
};
