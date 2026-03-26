export interface CoverageReport {
  schemaUrl: string;
  schemaTitle: string;
  totalShapes: number;
  mappedShapes: number;
  coveragePercent: number;
  computedAt: string;
}

export interface ShapeGap {
  schemaUrl: string;
  shapeUrl: string;
  shapeLabel: string;
  hasMappings: boolean;
  mappingCount: number;
}

export interface CoverageOverview {
  totalSchemas: number;
  totalShexMaps: number;
  totalShapes: number;
  totalMappedShapes: number;
  overallCoveragePercent: number;
  bySchema: CoverageReport[];
  computedAt: string;
}
