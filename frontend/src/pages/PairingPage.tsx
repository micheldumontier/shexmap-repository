import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import type * as MonacoType from 'monaco-editor';
import { useShExMapPairing, type ShExMap } from '../api/shexmaps.js';
import { apiClient } from '../api/client.js';

// ─── Variable coloring ────────────────────────────────────────────────────────

const VAR_COLOR_PALETTE = [
  { bg: 'rgba(239,68,68,0.3)',   border: '#ef4444' },
  { bg: 'rgba(59,130,246,0.3)',  border: '#3b82f6' },
  { bg: 'rgba(34,197,94,0.3)',   border: '#22c55e' },
  { bg: 'rgba(249,115,22,0.3)',  border: '#f97316' },
  { bg: 'rgba(168,85,247,0.3)',  border: '#a855f7' },
  { bg: 'rgba(234,179,8,0.3)',   border: '#eab308' },
  { bg: 'rgba(6,182,212,0.3)',   border: '#06b6d4' },
  { bg: 'rgba(236,72,153,0.3)',  border: '#ec4899' },
];

let colorsInjected = false;
function injectVarColors() {
  if (colorsInjected) return;
  colorsInjected = true;
  const style = document.createElement('style');
  style.textContent = VAR_COLOR_PALETTE.map((c, i) =>
    `.shex-var-${i} { background: ${c.bg} !important; border-bottom: 2px solid ${c.border}; border-radius: 2px; }`
  ).join('\n');
  document.head.appendChild(style);
}

function extractVars(content: string): string[] {
  const vars = new Set<string>();
  // Standard: %Map:{ bp:varName %}
  for (const m of content.matchAll(/%Map:\{\s*([^\s%{}]+)\s*%\}/g)) {
    vars.add(m[1]!);
  }
  // Regex named groups with namespace: (?<ns:name>...)
  for (const m of content.matchAll(/\(\?<([^>]+:[^>]+)>/g)) {
    vars.add(m[1]!);
  }
  return [...vars];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PairingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: pairing, isLoading, isError } = useShExMapPairing(id ?? '');

  const srcFileName = pairing?.sourceMap.fileName;
  const tgtFileName = pairing?.targetMap.fileName;

  const { data: srcFetched } = useQuery<string>({
    queryKey: ['shex-file', srcFileName],
    queryFn: () =>
      apiClient.get(`/files/${encodeURIComponent(srcFileName!)}`, { responseType: 'text' })
        .then((r) => r.data as string),
    enabled: !!srcFileName,
  });

  const { data: tgtFetched } = useQuery<string>({
    queryKey: ['shex-file', tgtFileName],
    queryFn: () =>
      apiClient.get(`/files/${encodeURIComponent(tgtFileName!)}`, { responseType: 'text' })
        .then((r) => r.data as string),
    enabled: !!tgtFileName,
  });

  const srcContent = srcFetched ?? pairing?.sourceMap.content;
  const tgtContent = tgtFetched ?? pairing?.targetMap.content;

  // Shared mapping variables → color index
  const varColorMap = useMemo<Map<string, number>>(() => {
    if (!srcContent || !tgtContent) return new Map();
    const srcVars = extractVars(srcContent);
    const tgtSet = new Set(extractVars(tgtContent));
    const shared = srcVars.filter((v) => tgtSet.has(v));
    return new Map(shared.map((v, i) => [v, i % VAR_COLOR_PALETTE.length]));
  }, [srcContent, tgtContent]);

  if (isLoading) return <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>;
  if (isError || !pairing) return (
    <div className="py-20 text-center"><p className="text-slate-500">Pairing not found.</p></div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-400">
        <Link to="/browse" className="hover:text-violet-600 transition-colors">Browse</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-600">{pairing.title}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{pairing.title}</h1>
            {pairing.description && (
              <p className="text-slate-500 mt-1.5 leading-relaxed">{pairing.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm shrink-0 text-slate-400 pt-1">
            <span className="text-amber-400 text-base">★</span>
            <span>{pairing.stars}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-slate-400">
          <span>by <span className="text-slate-600 font-medium">{pairing.authorName}</span></span>
          <span>v{pairing.version}</span>
          <span>Updated {new Date(pairing.modifiedAt).toLocaleDateString()}</span>
        </div>
        {pairing.tags.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {pairing.tags.map((tag) => (
              <span key={tag} className="bg-violet-50 text-violet-700 border border-violet-100 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Shared variable legend */}
      {varColorMap.size > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Shared mapping variables
          </div>
          <div className="flex flex-wrap gap-2">
            {[...varColorMap.entries()].map(([varName, colorIdx]) => (
              <span
                key={varName}
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{
                  background: VAR_COLOR_PALETTE[colorIdx]!.bg,
                  borderBottom: `2px solid ${VAR_COLOR_PALETTE[colorIdx]!.border}`,
                }}
              >
                {varName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ShEx file panels */}
      <div className="flex flex-col gap-5">
        <ShExFilePanel map={pairing.sourceMap} role="Source" content={srcContent} varColorMap={varColorMap} />
        <ShExFilePanel map={pairing.targetMap} role="Target" content={tgtContent} varColorMap={varColorMap} />
      </div>
    </div>
  );
}

// ─── File panel ───────────────────────────────────────────────────────────────

function ShExFilePanel({
  map,
  role,
  content,
  varColorMap,
}: {
  map: ShExMap;
  role: string;
  content: string | undefined;
  varColorMap: Map<string, number>;
}) {
  const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<MonacoType.editor.IEditorDecorationsCollection | null>(null);

  const applyDecorations = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !content || varColorMap.size === 0) return;
    injectVarColors();
    decorationsRef.current?.clear();
    const model = editor.getModel();
    if (!model) return;
    const newDecos: MonacoType.editor.IModelDeltaDecoration[] = [];
    for (const [varName, colorIdx] of varColorMap) {
      for (const match of model.findMatches(varName, true, false, true, null, true)) {
        newDecos.push({
          range: match.range,
          options: { inlineClassName: `shex-var-${colorIdx}` },
        });
      }
    }
    decorationsRef.current = editor.createDecorationsCollection(newDecos);
  }, [content, varColorMap]);

  useEffect(() => {
    applyDecorations();
  }, [applyDecorations]);

  return (
    <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
      {/* Panel header */}
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{role}</span>
          <span className="text-slate-500">·</span>
          <Link
            to={`/maps/${map.id}`}
            className="text-sm font-medium text-slate-100 hover:text-violet-300 transition-colors"
          >
            {map.title || map.id}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {map.fileName && (
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
              {map.fileFormat}
            </span>
          )}
          {map.sourceUrl && (
            <a
              href={map.sourceUrl}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              target="_blank"
              rel="noreferrer"
              download={map.fileName}
            >
              ↓ download
            </a>
          )}
        </div>
      </div>

      {!content && (
        <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height: 400 }}>
          Loading…
        </div>
      )}
      {content !== undefined && (
        <Editor
          height={400}
          defaultLanguage="turtle"
          value={content}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
          }}
          theme="vs-dark"
          onMount={(editor) => {
            editorRef.current = editor;
            applyDecorations();
          }}
        />
      )}
    </div>
  );
}
