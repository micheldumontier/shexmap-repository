import { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

const DEFAULT_QUERY = `PREFIX shexmap: <https://shexmap.example.org/ontology#>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?id ?title ?created WHERE {
  ?id a shexmap:ShExMap ;
      dct:title ?title ;
      dct:created ?created .
}
ORDER BY DESC(?created)
LIMIT 10`;

interface SparqlResult {
  head: { vars: string[] };
  results: { bindings: Record<string, { type: string; value: string }>[] };
}

export default function SparqlPage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [result, setResult] = useState<SparqlResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runQuery = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/sparql', {
        params: { query },
        headers: { Accept: 'application/sparql-results+json' },
      });
      setResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SPARQL Query</h1>
        <p className="text-gray-600 mt-1 text-sm">
          Query the ShExMap repository directly using SPARQL 1.1. Endpoint:{' '}
          <code className="bg-gray-100 px-1 rounded">/sparql</code>
        </p>
      </div>

      <div className="rounded-lg border border-gray-300 overflow-hidden">
        <Editor
          height="250px"
          defaultLanguage="sparql"
          value={query}
          onChange={(val) => setQuery(val ?? '')}
          options={{ minimap: { enabled: false }, scrollBeyondLastLine: false }}
          theme="vs"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={runQuery}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Run Query'}
        </button>
      </div>

      {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>}

      {result && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                {result.head.vars.map((v) => (
                  <th key={v} className="py-2 pr-4 text-left font-medium text-gray-700">{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.results.bindings.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  {result.head.vars.map((v) => (
                    <td key={v} className="py-1.5 pr-4 text-gray-800 max-w-xs truncate">
                      {row[v]?.value ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-gray-400 mt-2">{result.results.bindings.length} results</div>
        </div>
      )}
    </div>
  );
}
