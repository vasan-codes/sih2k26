export type Mode = 'single_image' | 'optical_sar' | 'bi_temporal' | 'region_centric';

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
  bbox?: number[];
}

export interface CheckItem {
  key: string;
  label: string;
  status: boolean;
  detail: string;
}

export interface Observation {
  id: string;
  region_key: string;
  name: string;
  sensor_type: string;
  modality: string;
  role: string;
  acquisition_time: string;
  crs: string;
  resolution_m: number;
  bands: string[];
  footprint_geometry: GeoPolygon;
  preprocessing: string;
  image_path: string;
  width: number;
  height: number;
}

export interface EvidenceItem {
  id: string;
  mission_id: string;
  type: string;
  source_service: string;
  title: string;
  description: string;
  geometry: GeoPolygon | null;
  metrics: Record<string, unknown> | null;
  supporting_observation_ids: string[];
  validation_status: 'supported' | 'partially_supported' | 'conflict' | 'insufficient' | string;
  strength: number;
}

export interface ExecutionStep {
  id: string;
  step_index: number;
  stage: string;
  service_name: string;
  status: 'waiting' | 'running' | 'completed' | 'warning' | 'failed' | string;
  input_summary: string;
  output_summary: string;
  warnings: string[];
  started_at: string | null;
  completed_at: string | null;
}

export interface ModelRegistryEntry {
  id: string;
  name: string;
  version: string;
  task: string;
  input_type: string;
  output_type: string;
  capabilities: string;
  status: string;
  performance_notes: string;
}

export interface SelectedModel {
  task: string;
  model_id: string;
  name: string;
  version: string;
  capabilities?: string;
}

export interface Workflow {
  primary_task: string;
  supporting_tasks: string[];
  validation_tasks: string[];
  limitations: string[];
  selected_models: SelectedModel[];
}

export interface QueryUnderstanding {
  normalized_query: string;
  intent: string;
  keywords_matched: Record<string, string[]>;
  wants_cross_sensor_verification: boolean;
  wants_quantification: boolean;
  wants_grounding: boolean;
  temporal_reference_detected: boolean;
  spatial_reference_detected: boolean;
}

export interface Validation {
  input_checks: CheckItem[];
  geo_checks: CheckItem[];
  footprint_overlap_ratio: number;
}

export interface ConfidenceBreakdown {
  label: string;
  weights: Record<string, number>;
  components: Record<string, number>;
  overall_percent: number;
  cross_sensor_applicable: boolean;
}

export interface SensorConsistency {
  level: 'HIGH_AGREEMENT' | 'PARTIAL_AGREEMENT' | 'CONFLICT_DETECTED' | string;
  optical_interpretation: string;
  sar_interpretation: string;
  conflict_ratio: number;
  disputed_area_ha: number;
}

export interface MissionResult {
  answer: string;
  key_findings: string[];
  uncertainty: string[];
  evidence_validation: { status: string; notes: string[] };
  sensor_consistency: SensorConsistency | null;
  demo_label: string;
}

export interface Region {
  key: string;
  label: string;
  description: string;
  bbox: number[];
  modes: Mode[];
  observations: Observation[];
}

export interface MissionSummary {
  id: string;
  title: string;
  query_text: string;
  mode: Mode;
  region_key: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | string;
  is_demo: boolean;
  saved: boolean;
  created_at: string;
  updated_at: string;
}

export interface MissionDetail extends MissionSummary {
  result: MissionResult | null;
  confidence: ConfidenceBreakdown | null;
  workflow: Workflow | null;
  query_understanding: QueryUnderstanding | null;
  validation: Validation | null;
  region: Region;
  observations: Observation[];
  evidence_items: EvidenceItem[];
  execution_steps: ExecutionStep[];
}

export interface KGNode {
  id: string;
  type: string;
  label: string;
  detail: Record<string, unknown>;
}
export interface KGEdge {
  source: string;
  target: string;
  relationship: string;
  detail: Record<string, unknown>;
}
export interface KnowledgeGraph {
  mission_id: string;
  nodes: KGNode[];
  edges: KGEdge[];
}

export interface ExternalObservation {
  id: string;
  region_key: string;
  source: string;
  signal_type: string;
  observed_at: string;
  geometry: { cx: number; cy: number };
  value: number;
  unit: string;
  notes: string;
}

export interface CorrelationResult {
  region_key: string;
  trend_slope_per_day: number;
  spatial_overlap: boolean;
  support_level: string;
  strength: number;
  narrative: string;
  disclaimer: string;
  external_points: ExternalObservation[];
}

export interface ValidateInputsResponse {
  checks: CheckItem[];
  observations_count: number;
  overall_status: boolean;
  footprint_overlap_ratio?: number;
}
