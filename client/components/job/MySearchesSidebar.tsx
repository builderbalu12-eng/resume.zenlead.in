import React from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MySearchesSidebarProps {
  searches: any[];
  selectedListId: string | null;
  onSelectSearch: (listId: string) => void;
  onNewSearch: () => void;
  onDeleteSearch: (listId: string) => void;
  isLoading?: boolean;
}

export const MySearchesSidebar: React.FC<MySearchesSidebarProps> = ({
  searches,
  selectedListId,
  onSelectSearch,
  onNewSearch,
  onDeleteSearch,
  isLoading = false,
}) => {
  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Searches</h2>
        <Button
          onClick={onNewSearch}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Search
        </Button>
      </div>

      {/* Search List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : searches.length === 0 ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm">No searches yet. Start searching to see them here!</p>
          </div>
        ) : (
          <div className="space-y-1 p-3">
            {searches.map(search => (
              <button
                key={search.list_id}
                onClick={() => onSelectSearch(search.list_id)}
                className={`w-full text-left p-3 rounded-lg transition-colors group ${
                  selectedListId === search.list_id
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm truncate ${
                      selectedListId === search.list_id
                        ? 'text-purple-900 dark:text-purple-300'
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {search.search_term}
                    </h3>
                    <p className={`text-xs truncate ${
                      selectedListId === search.list_id
                        ? 'text-purple-700 dark:text-purple-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      📍 {search.location}
                    </p>
                    <div className={`text-xs mt-1 ${
                      selectedListId === search.list_id
                        ? 'text-purple-700 dark:text-purple-400'
                        : 'text-slate-500 dark:text-slate-500'
                    }`}>
                      {search.total_jobs} jobs •{' '}
                      {new Date(search.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this search and all job cards?')) {
                        onDeleteSearch(search.list_id);
                      }
                    }}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all text-red-600 dark:text-red-400 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
