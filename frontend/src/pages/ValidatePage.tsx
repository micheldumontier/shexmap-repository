import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { useShExMapPairings, useShExMapPairing } from '../api/shexmaps.js';
import { apiClient } from '../api/client.js';

// ── Types (mirror the API response) ──────────────────────────────────────────

interface BindingEntry {
  variable: string;
  value: string;
  datatype?: string;
}

interface BindingNode {
  shape: string;
  focus: string;
  bindings: BindingEntry[];
  children: BindingNode[];
}

interface ValidationResult {
  valid: boolean;
  bindingTree: BindingNode[];
  bindings: Record<string, string>;
  targetRdf?: string;
  errors: string[];
}

// ── Sample data ───────────────────────────────────────────────────────────────

const FHIR_EXAMPLE_RDF = `@prefix fhir: <http://hl7.org/fhir-rdf/> .
@prefix sct:  <http://snomed.info/sct/> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .

<http://ex.org/obs1> a fhir:Observation ;
  fhir:subject   <http://ex.org/pat1> ;
  fhir:coding    <http://ex.org/coding1> ;
  fhir:component <http://ex.org/sysBP1> ;
  fhir:component <http://ex.org/diaBP1> .

<http://ex.org/coding1> fhir:code sct:Blood_Pressure .

<http://ex.org/pat1>
  fhir:givenName  "John"^^xsd:string ;
  fhir:familyName "Doe"^^xsd:string .

<http://ex.org/sysBP1> a fhir:Observation ;
  fhir:coding       <http://ex.org/sysCoding1> ;
  fhir:valueQuantity <http://ex.org/sysQ1> .
<http://ex.org/sysCoding1> fhir:code sct:Systolic_Blood_Pressure .
<http://ex.org/sysQ1>
  a fhir:Quantity ;
  fhir:value "120"^^xsd:float ;
  fhir:units "mm[Hg]"^^xsd:string .

<http://ex.org/diaBP1> a fhir:Observation ;
  fhir:coding        <http://ex.org/diaCoding1> ;
  fhir:valueQuantity <http://ex.org/diaQ1> .
<http://ex.org/diaCoding1> fhir:code sct:Diastolic_Blood_Pressure .
<http://ex.org/diaQ1>
  a fhir:Quantity ;
  fhir:value "80"^^xsd:float ;
  fhir:units "mm[Hg]"^^xsd:string .`;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ValidatePage() {
  const [pairingId, setPairingId] = useState('');
  const [sourceShEx, setSourceShEx] = useState('');
  const [targetShEx, setTargetShEx] = useState('');
  const [sourceRdf, setSourceRdf] = useState('');
  const [sourceNode, setSourceNode] = useState('http://ex.org/obs1');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pairingsQuery = useShExMapPairings({ limit: 50 });
  const pairingQuery = useShExMapPairing(pairingId);

  // Load ShEx files when a pairing is selected
  useEffect(() => {
    if (!pairingQuery.data) return;
    const p = pairingQuery.data;

    const loadFile = (fileName?: string, content?: string): Promise<string> => {
      if (content) return Promise.resolve(content);
      if (fileName)
        return apiClient
          .get(`/files/${encodeURIComponent(fileName)}`, { responseType: 'text' })
          .then((r) => r.data as string);
      return Promise.resolve('');
    };

    loadFile(p.sourceMap.fileName, p.sourceMap.content).then(setSourceShEx);
    loadFile(p.targetMap.fileName, p.targetMap.content).then(setTargetShEx);

    if (p.sourceMap.fileName?.toLowerCase().includes('fhir')) {
      setSourceRdf(FHIR_EXAMPLE_RDF);
      setSourceNode('http://ex.org/obs1');
    }

    setResult(null);
    setError('');
  }, [pairingQuery.data]);

  const handleValidate = async (materialize: boolean) => {
    if (!sourceShEx || !sourceRdf || !sourceNode) {
      setError('Please provide source ShExMap, source RDF data, and a focus node IRI.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await axios.post<ValidationResult>('/api/v1/validate', {
        sourceShEx,
        sourceRdf,
        sourceNode,
        ...(materialize && targetShEx ? { targetShEx } : {}),
      });
      setResult(data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err.response?.data?.error ?? err.message ?? 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const bindingCount = result ? Object.keys(result.bindings).length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ShExMap Validator</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Validate source RDF against a ShExMap, inspect extracted Map variable bindings, and
          materialize target data.
        </p>
      </div>

      {/* ─── 1. Load Pairing ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          1. Load an Existing Pairing
        </div>
        <div className="flex items-center gap-3">
          <select
            value={pairingId}
            onChange={(e) => setPairingId(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300"
          >
            <option value="">— select a pairing —</option>
            {pairingsQuery.data?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          {pairingId && (
            <Link
              to={`/pairings/${pairingId}`}
              className="text-xs text-violet-600 hover:text-violet-700 shrink-0"
            >
              View pairing →
            </Link>
          )}
        </div>
        {pairingQuery.isLoading && (
          <p className="text-xs text-slate-400 mt-2">Loading pairing…</p>
        )}
      </section>

      {/* ─── 2. ShExMap Editors ──────────────────────────────────────────────── */}
      <section className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          2. ShExMap Files
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <ShExEditor
            title="Source ShExMap"
            value={sourceShEx}
            onChange={setSourceShEx}
          />
          <ShExEditor
            title="Target ShExMap"
            value={targetShEx}
            onChange={setTargetShEx}
            dimmed={!targetShEx}
          />
        </div>
      </section>

      {/* ─── 3. Source RDF ───────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          3. Source RDF Data (Turtle)
        </div>
        <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
          <div className="flex items-center justify-between bg-slate-800 px-4 py-2.5">
            <span className="text-sm font-medium text-slate-100">source.ttl</span>
            <button
              onClick={() => { setSourceRdf(FHIR_EXAMPLE_RDF); setSourceNode('http://ex.org/obs1'); }}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Load FHIR example
            </button>
          </div>
          <Editor
            height={240}
            defaultLanguage="turtle"
            value={sourceRdf}
            onChange={(v) => setSourceRdf(v ?? '')}
            options={{ minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 12 }}
            theme="vs-dark"
          />
        </div>

        {/* Focus node input */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 shrink-0 w-28">
            Focus Node IRI
          </label>
          <input
            type="text"
            value={sourceNode}
            onChange={(e) => setSourceNode(e.target.value)}
            placeholder="http://ex.org/obs1"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-mono text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300"
          />
        </div>
      </section>

      {/* ─── 4. Actions ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => handleValidate(false)}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 text-white font-medium px-5 py-2.5 text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Validate'}
        </button>
        {targetShEx && (
          <button
            onClick={() => handleValidate(true)}
            disabled={loading}
            className="bg-violet-800 hover:bg-violet-700 text-white font-medium px-5 py-2.5 text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Running…' : 'Validate & Materialize →'}
          </button>
        )}
      </div>

      {/* ─── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="text-red-700 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* ─── 5. Results ──────────────────────────────────────────────────────── */}
      {result && (
        <section className="space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            5. Results
          </div>

          {/* API errors */}
          {result.errors.length > 0 && (
            <div className="text-red-700 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg space-y-1">
              {result.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}

          {/* Status badge */}
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border ${
              result.valid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            <span>{result.valid ? '✓' : '⚠'}</span>
            <span>
              {result.valid
                ? `${bindingCount} binding${bindingCount !== 1 ? 's' : ''} extracted`
                : 'No bindings found — check ShEx syntax and focus node'}
            </span>
          </div>

          {/* Flat bindings summary */}
          {bindingCount > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Extracted Bindings
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                {Object.entries(result.bindings).map(([variable, value]) => (
                  <div key={variable} className="flex items-start gap-2 text-xs font-mono py-0.5">
                    <span
                      className="text-amber-600 truncate shrink-0 max-w-[180px]"
                      title={variable}
                    >
                      {variable.split(/[#>]/).pop() ?? variable}
                    </span>
                    <span className="text-slate-400">=</span>
                    <span className="text-emerald-700 font-semibold break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Binding tree */}
          {result.bindingTree.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Binding Tree
              </div>
              <div className="font-mono text-xs space-y-0.5">
                {result.bindingTree.map((n, i) => (
                  <BindingNodeView key={i} node={n} depth={0} />
                ))}
              </div>
            </div>
          )}

          {/* Materialized target RDF */}
          {result.targetRdf && (
            <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
              <div className="flex items-center justify-between bg-slate-800 px-4 py-2.5">
                <span className="text-sm font-medium text-slate-100">
                  Materialized Target RDF
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(result.targetRdf!)}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Copy
                </button>
              </div>
              <Editor
                height={280}
                defaultLanguage="turtle"
                value={result.targetRdf}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 12,
                }}
                theme="vs-dark"
              />
            </div>
          )}
        </section>
      )}

      <p className="text-xs text-slate-400 text-center pb-4">
        Validation uses the ShExMap{' '}
        <code className="bg-slate-100 px-1 rounded">%Map:&#123; var %&#125;</code> extension to
        extract shared variables between source and target shapes.
      </p>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ShExEditor({
  title,
  value,
  onChange,
  dimmed = false,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  dimmed?: boolean;
}) {
  return (
    <div className={`flex-1 rounded-xl border shadow-sm overflow-hidden bg-white ${dimmed ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2.5">
        <span className="text-sm font-medium text-slate-100">{title}</span>
        {dimmed && (
          <span className="text-xs text-slate-500 italic">load a pairing or paste ShExC</span>
        )}
      </div>
      <Editor
        height={300}
        defaultLanguage="plaintext"
        value={value}
        onChange={(v) => onChange(v ?? '')}
        options={{ minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 12 }}
        theme="vs-dark"
      />
    </div>
  );
}

function BindingNodeView({ node, depth = 0 }: { node: BindingNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const hasContent = node.bindings.length > 0 || node.children.length > 0;

  return (
    <div style={{ marginLeft: depth * 14 }} className="my-0.5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-mono group w-full text-left"
      >
        <span className="text-slate-400 w-3 shrink-0">{open ? '▼' : '▶'}</span>
        <span className="font-semibold text-violet-700">{node.shape}</span>
        <span className="text-slate-400 mx-0.5">@</span>
        <span className="text-slate-500 truncate" title={node.focus}>
          {node.focus.length > 50 ? `…${node.focus.slice(-40)}` : node.focus}
        </span>
        {!hasContent && <span className="text-slate-300 italic ml-1">(empty)</span>}
      </button>

      {open && (
        <div className="ml-5">
          {node.bindings.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs font-mono py-0.5 pl-1">
              <span className="text-amber-600 shrink-0" title={b.variable}>
                {b.variable.split(/[#>]/).pop() ?? b.variable}
              </span>
              <span className="text-slate-400">=</span>
              <span className="text-emerald-700 font-semibold">{b.value}</span>
              {b.datatype && (
                <span className="text-slate-400 text-[10px] ml-0.5">
                  ({b.datatype.split('#').pop()})
                </span>
              )}
            </div>
          ))}
          {node.children.map((child, i) => (
            <BindingNodeView key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
