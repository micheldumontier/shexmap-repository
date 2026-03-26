import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { CoverageReport } from '../../api/coverage.js';

interface CoverageHeatmapProps {
  data: CoverageReport[];
}

interface TreemapEntry {
  name: string;
  size: number;
  coverage: number;
}

export default function CoverageHeatmap({ data }: CoverageHeatmapProps) {
  const treemapData: TreemapEntry[] = data.map((r) => ({
    name: r.schemaTitle,
    size: r.totalShapes,
    coverage: r.coveragePercent,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        data={treemapData}
        dataKey="size"
        nameKey="name"
        content={<CustomCell />}
      >
        <Tooltip
          formatter={(value: number, name: string, props) => [
            `${(props.payload as TreemapEntry).coverage}% covered (${value} shapes)`,
            name,
          ]}
        />
      </Treemap>
    </ResponsiveContainer>
  );
}

function CustomCell(props: {
  x?: number; y?: number; width?: number; height?: number;
  name?: string; coverage?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name, coverage = 0 } = props;
  const fill = coverageColor(coverage);

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" strokeWidth={2} />
      {width > 60 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fill="#1f2937"
        >
          {name}
        </text>
      )}
      {width > 60 && height > 50 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fill="#374151"
        >
          {coverage}%
        </text>
      )}
    </g>
  );
}

function coverageColor(pct: number): string {
  if (pct >= 80) return '#86efac'; // green
  if (pct >= 50) return '#fde68a'; // yellow
  if (pct >= 20) return '#fdba74'; // orange
  return '#fca5a5';                // red
}
