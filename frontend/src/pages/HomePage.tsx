import { Link } from 'react-router-dom';
import { useShExMaps, useSchemas, useShExMapPairings } from '../api/shexmaps.js';

export default function HomePage() {
  const { data: maps } = useShExMaps({ limit: 5, sort: 'modified' });
  const { data: schemas } = useSchemas();
  const { data: pairings } = useShExMapPairings({ limit: 1 });

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="relative rounded-2xl overflow-hidden bg-slate-900 px-8 py-16 text-center">
        {/* subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(139,92,246,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,.4) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative">
          <span className="inline-block mb-4 rounded-full bg-violet-900/60 border border-violet-700/50 px-3 py-1 text-xs font-medium text-violet-300 tracking-wide uppercase">
            Open ShEx Mapping Repository
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            ShEx<span className="text-violet-400">Map</span> Repository
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            A community hub for ShExMaps — bidirectional mappings between RDF shapes.
            Browse, contribute, and explore coverage across semantic web standards.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/browse"
              className="bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Browse Maps
            </Link>
            <Link
              to="/submit"
              className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Submit a Map
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Schemas', value: schemas?.length, tab: 'schemas' },
          { label: 'ShExMap Files', value: maps?.total, tab: 'shexmaps' },
          { label: 'Pairings', value: pairings?.total, tab: 'pairings' },
        ].map(({ label, value, tab }) => (
          <Link
            key={label}
            to={`/browse?tab=${tab}`}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center hover:border-violet-300 hover:shadow-md transition-all group"
          >
            <div className="text-3xl font-bold text-violet-600 group-hover:text-violet-700">
              {value ?? '—'}
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">{label}</div>
          </Link>
        ))}
      </section>

      {/* Recent maps */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-slate-800">Recently Updated</h2>
          <Link to="/browse" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {maps?.items.map((map) => (
            <Link
              key={map.id}
              to={`/maps/${map.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 hover:border-violet-300 hover:shadow-md transition-all group"
            >
              <div>
                <div className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">
                  {map.title}
                </div>
                <div className="text-sm text-slate-400 mt-0.5">
                  by {map.authorName} · {new Date(map.modifiedAt).toLocaleDateString()}
                </div>
              </div>
              <span className="text-slate-300 group-hover:text-violet-400 text-lg transition-colors">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
