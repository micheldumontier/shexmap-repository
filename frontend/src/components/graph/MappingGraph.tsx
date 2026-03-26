import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface MappingGraphProps {
  sourceSchemaUrl: string;
  targetSchemaUrl: string;
  title: string;
}

/**
 * Visualises a ShExMap as a directed graph from source schema to target schema.
 * Nodes represent schemas/shapes; edges represent the mapping relationship.
 */
export default function MappingGraph({ sourceSchemaUrl, targetSchemaUrl, title }: MappingGraphProps) {
  const nodes: Node[] = [
    {
      id: 'source',
      position: { x: 0, y: 100 },
      data: { label: labelFromUrl(sourceSchemaUrl) },
      type: 'input',
      style: { background: '#e0e7ff', border: '1px solid #6366f1', borderRadius: 8 },
    },
    {
      id: 'map',
      position: { x: 250, y: 100 },
      data: { label: title },
      style: { background: '#fef9c3', border: '1px solid #ca8a04', borderRadius: 8, minWidth: 140 },
    },
    {
      id: 'target',
      position: { x: 500, y: 100 },
      data: { label: labelFromUrl(targetSchemaUrl) },
      type: 'output',
      style: { background: '#dcfce7', border: '1px solid #16a34a', borderRadius: 8 },
    },
  ];

  const edges: Edge[] = [
    { id: 'e-src-map', source: 'source', target: 'map', animated: true, label: 'maps from' },
    { id: 'e-map-tgt', source: 'map', target: 'target', animated: true, label: 'maps to' },
  ];

  return (
    <div className="react-flow-wrapper rounded-lg border border-gray-200 overflow-hidden">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

function labelFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = (u.pathname + u.hash).split('/').filter(Boolean);
    return parts[parts.length - 1] ?? url;
  } catch {
    return url;
  }
}
