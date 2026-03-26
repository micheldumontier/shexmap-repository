import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface ShExFile {
  id: string;
  title?: string;
  fileName: string;
  fileFormat: string;
  sourceUrl?: string;
}

export interface ShExMap {
  id: string;
  title: string;
  description?: string;
  content: string;
  sourceSchemaUrl: string;
  targetSchemaUrl: string;
  sourceFiles: ShExFile[];
  targetFiles: ShExFile[];
  tags: string[];
  license?: string;
  version: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  modifiedAt: string;
  stars: number;
}

export interface ShExMapListResult {
  items: ShExMap[];
  total: number;
}

export interface ShExMapFilters {
  q?: string;
  tag?: string;
  author?: string;
  page?: number;
  limit?: number;
  sort?: 'created' | 'modified' | 'title' | 'stars';
  order?: 'asc' | 'desc';
}

export function useShExMaps(filters: ShExMapFilters = {}) {
  return useQuery<ShExMapListResult>({
    queryKey: ['shexmaps', filters],
    queryFn: () => apiClient.get('/shexmaps', { params: filters }).then((r) => r.data),
  });
}

export function useShExMap(id: string) {
  return useQuery<ShExMap>({
    queryKey: ['shexmap', id],
    queryFn: () => apiClient.get(`/shexmaps/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateShExMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ShExMap, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'modifiedAt' | 'stars' | 'sourceFiles' | 'targetFiles'>) =>
      apiClient.post('/shexmaps', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shexmaps'] }),
  });
}

export function useDeleteShExMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/shexmaps/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shexmaps'] }),
  });
}
