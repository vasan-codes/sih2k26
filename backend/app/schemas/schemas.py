from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ObservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    region_key: str
    name: str
    sensor_type: str
    modality: str
    role: str
    acquisition_time: datetime
    crs: str
    resolution_m: float
    bands: list
    footprint_geometry: dict
    preprocessing: str
    image_path: str
    width: int
    height: int


class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    mission_id: str
    type: str
    source_service: str
    title: str
    description: str
    geometry: dict | None
    metrics: dict | None
    supporting_observation_ids: list
    validation_status: str
    strength: float


class ExecutionStepOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    step_index: int
    stage: str
    service_name: str
    status: str
    input_summary: str
    output_summary: str
    warnings: list
    started_at: datetime | None
    completed_at: datetime | None


class ModelRegistryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    version: str
    task: str
    input_type: str
    output_type: str
    capabilities: str
    status: str
    performance_notes: str


class MissionSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    query_text: str
    mode: str
    region_key: str
    status: str
    is_demo: bool
    saved: bool
    created_at: datetime
    updated_at: datetime


class MissionDetailOut(MissionSummaryOut):
    result: dict | None
    confidence: dict | None
    workflow: dict | None
    query_understanding: dict | None
    validation: dict | None
    region: dict
    observations: list[ObservationOut]
    evidence_items: list[EvidenceOut]
    execution_steps: list[ExecutionStepOut]


class AnalyzeRequest(BaseModel):
    mode: str
    region_key: str
    query_text: str
    title: str | None = None


class ValidateInputsRequest(BaseModel):
    mode: str
    region_key: str


class UnderstandQueryRequest(BaseModel):
    query_text: str


class FeedbackRequest(BaseModel):
    saved: bool | None = None
    user_feedback: str | None = None


class RegionOut(BaseModel):
    key: str
    label: str
    description: str
    bbox: list[float]
    modes: list[str]
    observations: list[ObservationOut]


class KGNode(BaseModel):
    id: str
    type: str
    label: str
    detail: dict


class KGEdge(BaseModel):
    source: str
    target: str
    relationship: str
    detail: dict


class KnowledgeGraphOut(BaseModel):
    mission_id: str
    nodes: list[KGNode]
    edges: list[KGEdge]


class ExternalObservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    region_key: str
    source: str
    signal_type: str
    observed_at: datetime
    geometry: dict
    value: float
    unit: str
    notes: str


class CorrelationOut(BaseModel):
    region_key: str
    trend_slope_per_day: float
    spatial_overlap: bool
    support_level: str
    strength: float
    narrative: str
    disclaimer: str
    external_points: list[ExternalObservationOut]
