import { useState } from 'react';
import { useCoverageOverview, useGapAnalysis } from '../api/coverage.js';
import CoverageHeatmap from '../components/coverage/CoverageHeatmap.js';

export default function CoveragePage() {
  const { data: overview, isLoading } = useCoverageOverview();
  const [selectedSchema, setSelectedSchema] = useState<string | undefined>();
  const { data: gaps } = useGapAnalysis(selectedSchema);

  if (isLoading) return <div className="text-gray-500">Loading coverage data...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coverage Overview</h1>
        <p className="text-gray-600 mt-1">
          Tracks how much of each ShEx-defined standard has corresponding ShExMaps.
        </p>
      </div>

      {overview && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total ShExMaps', value: overview.totalShexMaps },
              { label: 'Schemas Tracked', value: overview.totalSchemas },
              { label: 'Shapes Mapped', value: `${overview.totalMappedShapes} / ${overview.totalShapes}` },
              { label: 'Overall Coverage', value: `${overview.overallCoveragePercent}%` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-indigo-700">{value}</div>
                <div className="text-sm text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Coverage by Schema</h2>
            <p className="text-sm text-gray-500 mb-3">
              Size = number of shapes · Color: green ≥80%, yellow ≥50%, orange ≥20%, red &lt;20%
            </p>
            <CoverageHeatmap data={overview.bySchema} />
          </div>

          {/* Per-schema table */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Schema Detail</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-2 pr-4 font-medium text-gray-700">Schema</th>
                  <th className="py-2 pr-4 font-medium text-gray-700 text-right">Shapes</th>
                  <th className="py-2 pr-4 font-medium text-gray-700 text-right">Mapped</th>
                  <th className="py-2 font-medium text-gray-700 text-right">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {overview.bySchema.map((r) => (
                  <tr
                    key={r.schemaUrl}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedSchema(r.schemaUrl === selectedSchema ? undefined : r.schemaUrl)}
                  >
                    <td className="py-2 pr-4">
                      <div className="font-medium text-gray-900">{r.schemaTitle}</div>
                      <div className="text-xs text-gray-400 truncate max-w-xs">{r.schemaUrl}</div>
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-700">{r.totalShapes}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{r.mappedShapes}</td>
                    <td className="py-2 text-right">
                      <span className={`font-semibold ${coverageColor(r.coveragePercent)}`}>
                        {r.coveragePercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gap analysis */}
          {selectedSchema && gaps && gaps.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Unmapped Shapes in Selected Schema
              </h2>
              <div className="space-y-1">
                {gaps.map((g) => (
                  <div key={g.shapeUrl} className="bg-red-50 border border-red-100 rounded px-3 py-2 text-sm">
                    <span className="font-medium text-gray-800">{g.shapeLabel}</span>
                    <span className="text-gray-400 ml-2 text-xs">{g.shapeUrl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function coverageColor(pct: number): string {
  if (pct >= 80) return 'text-green-600';
  if (pct >= 50) return 'text-yellow-600';
  if (pct >= 20) return 'text-orange-600';
  return 'text-red-600';
}
