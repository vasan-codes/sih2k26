import type {
  CorrelationResult,
  ExternalObservation,
  KnowledgeGraph,
  MissionDetail,
  MissionSummary,
  Mode,
  ModelRegistryEntry,
  Observation,
  QueryUnderstanding,
  Region,
  ValidateInputsResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export function assetUrl(imagePath: string): string {
  return `${API_BASE}/static/imagery/${imagePath}`;
}

export const api = {
  health: () => request<{ status: string; mode: string }>('/api/health'),

  understandQuery: (query_text: string) =>
    request<QueryUnderstanding>('/api/understand-query', { method: 'POST', body: JSON.stringify({ query_text }) }),

  validateInputs: (mode: Mode, region_key: string) =>
    request<ValidateInputsResponse>('/api/validate-inputs', {
      method: 'POST',
      body: JSON.stringify({ mode, region_key }),
    }),

  analyze: (mode: Mode, region_key: string, query_text: string, title?: string) =>
    request<MissionDetail>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ mode, region_key, query_text, title }),
    }),

  listMissions: () => request<MissionSummary[]>('/api/missions'),
  getMission: (id: string) => request<MissionDetail>(`/api/missions/${id}`),
  updateMissionFeedback: (id: string, body: { saved?: boolean; user_feedback?: string }) =>
    request<MissionSummary>(`/api/missions/${id}/feedback`, { method: 'PATCH', body: JSON.stringify(body) }),

  getKnowledgeGraph: (missionId: string) => request<KnowledgeGraph>(`/api/knowledge-graph/${missionId}`),

  generateReport: (missionId: string) =>
    request<{ mission_id: string; format: string; content: string }>(`/api/report/${missionId}`, { method: 'POST' }),

  listModels: () => request<ModelRegistryEntry[]>('/api/models'),

  uploadObservation: async (
    file: File,
    role: string,
    mode: Mode,
    sensorType: 'optical' | 'sar' | 'multispectral',
    acquisitionDate?: string,
    regionKey?: string,
  ) => {
    const form = new FormData();
    form.append('file', file);
    form.append('role', role);
    form.append('mode', mode);
    form.append('sensor_type', sensorType);
    if (acquisitionDate) form.append('acquisition_date', acquisitionDate);
    if (regionKey) form.append('region_key', regionKey);
    const res = await fetch(`${API_BASE}/api/observations/upload`, { method: 'POST', body: form });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${res.status} ${res.statusText}: ${body}`);
    }
    return res.json() as Promise<Observation>;
  },

  listRegions: () => request<Region[]>('/api/regions'),
  getRegion: (key: string) => request<Region>(`/api/regions/${key}`),
  externalObservations: (key: string) => request<ExternalObservation[]>(`/api/regions/${key}/external-observations`),
  correlate: (key: string) => request<CorrelationResult>(`/api/regions/${key}/correlate`, { method: 'POST' }),
};
