import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useShExMap, useShExMapVersions, useShExMapVersion, useSaveShExMapVersion } from '../api/shexmaps.js';
import { apiClient } from '../api/client.js';
import ShExEditor from '../components/editor/ShExEditor.js';

export default function ShExMapPage() {
  const { id } = useParams<{ id: string }>();
  const { data: map, isLoading, isError } = useShExMap(id ?? '');

  if (isLoading) return <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>;
  if (isError || !map) return (
    <div className="py-20 text-center">
      <p className="text-slate-500">ShExMap not found.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-400">
        <Link to="/browse" className="hover:text-violet-600 transition-colors">Browse</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-600">{map.title}</span>
      </nav>

      {/* Header card */}
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

      {/* Metadata grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetaRow label="Author" value={map.authorName} />
        <MetaRow label="Version" value={`v${map.version}`} />
        <MetaRow label="Created" value={new Date(map.createdAt).toLocaleDateString()} />
        <MetaRow label="Updated" value={new Date(map.modifiedAt).toLocaleDateString()} />
        {map.fileName && (
          <MetaRow label="File" value={map.fileName} mono />
        )}
        <MetaRow label="Format" value={map.fileFormat} mono />
        {map.schemaUrl && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Schema</div>
            <Link
              to={`/browse?tab=schemas&schema=${encodeURIComponent(map.schemaUrl)}`}
              className="text-sm text-violet-600 hover:underline font-medium"
            >
              {map.schemaUrl.split('/').pop() ?? map.schemaUrl}
            </Link>
            <div className="text-xs text-slate-400 break-all mt-0.5">{map.schemaUrl}</div>
          </div>
        )}
        {map.sourceUrl && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Source URL</div>
            <a
              href={map.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-violet-600 hover:underline break-all"
            >
              {map.sourceUrl}
            </a>
          </div>
        )}
      </div>

      {/* File content — inline ShEx editor with LSP support */}
      <FileContentPanel
        mapId={map.id}
        fileName={map.fileName}
        fileFormat={map.fileFormat}
        inlineContent={map.content}
      />
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-sm text-slate-700 ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

function FileContentPanel({
  mapId,
  fileName,
  fileFormat,
  inlineContent,
}: {
  mapId: string;
  fileName?: string;
  fileFormat: string;
  inlineContent?: string;
}) {
  const [loadingVersionNumber, setLoadingVersionNumber] = useState<number | null>(null);

  const { data: fetchedContent, isLoading, isError } = useQuery<string>({
    queryKey: ['shex-file', fileName],
    queryFn: () =>
      apiClient
        .get(`/files/${encodeURIComponent(fileName!)}`, { responseType: 'text' })
        .then((r) => r.data as string),
    enabled: !inlineContent && !!fileName,
  });

  const { data: serverVersions } = useShExMapVersions(mapId);
  const { data: loadedServerVersion } = useShExMapVersion(mapId, loadingVersionNumber);
  const saveVersionMutation = useSaveShExMapVersion(mapId);

  // When a server version is loaded, use its content; otherwise fall back to file/inline
  const content = loadedServerVersion?.content ?? inlineContent ?? fetchedContent;

  if (!fileName && !inlineContent) return null;

  return (
    <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
      {/* Panel header */}
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2.5">
        <span className="text-sm font-medium text-slate-100 font-mono">
          {loadedServerVersion
            ? `${fileName ?? mapId} @ v${loadedServerVersion.versionNumber}`
            : (fileName ?? 'inline content')}
        </span>
        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
          {fileFormat}
        </span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height: 400 }}>
          Loading file…
        </div>
      )}
      {isError && (
        <div className="flex items-center justify-center text-red-400 text-sm" style={{ height: 400 }}>
          Could not load file.
        </div>
      )}
      {content !== undefined && (
        <ShExEditor
          value={content}
          mapId={mapId}
          fileName={fileName}
          fileFormat={fileFormat}
          height={400}
          readOnly={true}
          serverVersions={serverVersions}
          onSaveServerVersion={(c, msg) => saveVersionMutation.mutate({ content: c, commitMessage: msg })}
          isSavingServerVersion={saveVersionMutation.isPending}
          onLoadServerVersion={(vn) => setLoadingVersionNumber(vn)}
        />
      )}
    </div>
  );
}
