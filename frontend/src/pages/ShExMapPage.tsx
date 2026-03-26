import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { useShExMap, type ShExFile } from '../api/shexmaps.js';
import { apiClient } from '../api/client.js';

export default function ShExMapPage() {
  const { id } = useParams<{ id: string }>();
  const { data: map, isLoading, isError } = useShExMap(id ?? '');

  if (isLoading) return <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>;
  if (isError || !map) return (
    <div className="py-20 text-center">
      <p className="text-slate-500">ShExMap not found.</p>
    </div>
  );

  const srcFile = map.sourceFiles[0];
  const tgtFile = map.targetFiles[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{map.title}</h1>
            {map.description && (
              <p className="text-slate-500 mt-1.5 leading-relaxed">{map.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm shrink-0 text-slate-400 pt-1">
            <span className="text-amber-400 text-base">★</span>
            <span>{map.stars}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-slate-400">
          <span>by <span className="text-slate-600 font-medium">{map.authorName}</span></span>
          <span>v{map.version}</span>
          <span>Updated {new Date(map.modifiedAt).toLocaleDateString()}</span>
        </div>

        {map.tags.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {map.tags.map((tag) => (
              <span
                key={tag}
                className="bg-violet-50 text-violet-700 border border-violet-100 text-xs px-2.5 py-0.5 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Schema links */}
      <div className="grid grid-cols-2 gap-4">
        <SchemaCard label="Source Schema" url={map.sourceSchemaUrl} />
        <SchemaCard label="Target Schema" url={map.targetSchemaUrl} />
      </div>

      {/* ShEx file panels */}
      {(srcFile || tgtFile) && (
        <div className="flex flex-col gap-5">
          {srcFile && <ShExFilePanel file={srcFile} />}
          {tgtFile && <ShExFilePanel file={tgtFile} />}
        </div>
      )}
    </div>
  );
}

function SchemaCard({ label, url }: { label: string; url: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</div>
      <a
        href={url}
        className="text-sm text-violet-600 hover:text-violet-700 hover:underline break-all"
        target="_blank"
        rel="noreferrer"
      >
        {url}
      </a>
    </div>
  );
}

function ShExFilePanel({ file }: { file: ShExFile }) {
  const { data: content, isLoading, isError } = useQuery<string>({
    queryKey: ['shex-file', file.fileName],
    queryFn: () =>
      apiClient
        .get(`/files/${encodeURIComponent(file.fileName)}`, { responseType: 'text' })
        .then((r) => r.data as string),
    enabled: !!file.fileName,
  });

  return (
    <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
      {/* Panel header */}
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2.5">
        <span className="text-sm font-medium text-slate-100">{file.title ?? file.fileName}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
            {file.fileFormat}
          </span>
          {file.sourceUrl && (
            <a
              href={file.sourceUrl}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              target="_blank"
              rel="noreferrer"
              download={file.fileName}
            >
              ↓ download
            </a>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height: 384 }}>
          Loading…
        </div>
      )}
      {isError && (
        <div className="flex items-center justify-center text-red-400 text-sm" style={{ height: 384 }}>
          Could not load file.
        </div>
      )}
      {content !== undefined && (
        <Editor
          height={384}
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
        />
      )}
    </div>
  );
}
