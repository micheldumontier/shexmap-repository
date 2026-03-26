import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShExMaps, type ShExMapFilters } from '../api/shexmaps.js';

export default function BrowsePage() {
  const [filters, setFilters] = useState<ShExMapFilters>({ page: 1, limit: 20, sort: 'modified' });
  const { data, isLoading, isError } = useShExMaps(filters);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Browse ShExMaps</h1>
        <p className="text-slate-500 mt-1">Explore community-contributed mappings between RDF shapes.</p>
      </div>

      {/* Search + sort toolbar */}
      <div className="flex gap-3">
        <input
          type="search"
          placeholder="Search by title, tag, or schema…"
          className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))}
        />
        <select
          className="bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as ShExMapFilters['sort'], page: 1 }))}
        >
          <option value="modified">Recently Updated</option>
          <option value="created">Newest</option>
          <option value="stars">Most Starred</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading…</div>
      )}
      {isError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          Failed to load ShExMaps.
        </div>
      )}

      <div className="space-y-3">
        {data?.items.map((map) => (
          <Link
            key={map.id}
            to={`/maps/${map.id}`}
            className="group flex items-start justify-between bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 hover:border-violet-300 hover:shadow-md transition-all"
          >
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">
                {map.title}
              </div>
              {map.description && (
                <div className="text-sm text-slate-500 mt-0.5 truncate">{map.description}</div>
              )}
              <div className="text-xs text-slate-400 mt-1.5">
                by {map.authorName} · v{map.version} · {new Date(map.modifiedAt).toLocaleDateString()}
              </div>
              {map.tags.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {map.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-violet-50 text-violet-700 border border-violet-100 text-xs px-2 py-0.5 rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-400 ml-4 shrink-0 pt-0.5">
              <span className="text-amber-400">★</span>
              <span>{map.stars}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {data && data.total > (filters.limit ?? 20) && (
        <div className="flex gap-2 justify-center pt-2">
          <button
            disabled={(filters.page ?? 1) <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="px-4 py-2 text-sm text-slate-500 self-center">Page {filters.page}</span>
          <button
            onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
