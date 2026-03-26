import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface CoverageReport {
  schemaUrl: string;
  schemaTitle: string;
  totalShapes: number;
  mappedShapes: number;
  coveragePercent: number;
  computedAt: string;
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

export interface ShapeGap {
  schemaUrl: string;
  shapeUrl: string;
  shapeLabel: string;
  hasMappings: boolean;
  mappingCount: number;
}

export function useCoverageOverview() {
  return useQuery<CoverageOverview>({
    queryKey: ['coverage'],
    queryFn: () => apiClient.get('/coverage').then((r) => r.data),
  });
}

export function useGapAnalysis(schemaUrl?: string) {
  return useQuery<ShapeGap[]>({
    queryKey: ['coverage', 'gaps', schemaUrl],
    queryFn: () =>
      apiClient
        .get('/coverage/gaps', { params: schemaUrl ? { schema: schemaUrl } : {} })
        .then((r) => r.data),
  });
}
