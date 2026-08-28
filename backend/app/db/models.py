import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _uuid() -> str:
    return uuid.uuid4().hex[:12]


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# A. Mission & Query Store
# ---------------------------------------------------------------------------
class Mission(Base):
    """A single SatQuery AI analysis run: the query, the inputs, and the outcome."""

    __tablename__ = "missions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String)
    query_text: Mapped[str] = mapped_column(Text)
    mode: Mapped[str] = mapped_column(String)  # single_image | optical_sar | bi_temporal | region_centric
    region_key: Mapped[str] = mapped_column(String, index=True)  # key into demo_data.scenarios.REGIONS

    status: Mapped[str] = mapped_column(String, default="pending")  # pending|running|completed|failed
    is_demo: Mapped[bool] = mapped_column(default=True)
    saved: Mapped[bool] = mapped_column(default=False)
    user_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # assembled evidence-grounded answer
    confidence: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # confidence breakdown
    workflow: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # planned workflow (tasks + services)
    query_understanding: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    validation: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    observations: Mapped[list["Observation"]] = relationship(back_populates="mission")
    evidence_items: Mapped[list["Evidence"]] = relationship(back_populates="mission")
    execution_steps: Mapped[list["ExecutionStep"]] = relationship(back_populates="mission")


# ---------------------------------------------------------------------------
# B. Data & Metadata Store
# ---------------------------------------------------------------------------
class Observation(Base):
    """One satellite observation (image + metadata). Reusable across missions via region_key."""

    __tablename__ = "observations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    mission_id: Mapped[str | None] = mapped_column(ForeignKey("missions.id"), nullable=True)
    region_key: Mapped[str] = mapped_column(String, index=True)

    name: Mapped[str] = mapped_column(String)
    sensor_type: Mapped[str] = mapped_column(String)  # optical | sar | multispectral
    modality: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="single")  # single|before|after|optical|sar

    acquisition_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    crs: Mapped[str] = mapped_column(String, default="EPSG:4326")
    resolution_m: Mapped[float] = mapped_column(Float)
    bands: Mapped[list] = mapped_column(JSON)
    footprint_geometry: Mapped[dict] = mapped_column(JSON)  # GeoJSON polygon
    preprocessing: Mapped[str] = mapped_column(String, default="Orthorectified, radiometrically calibrated (demo)")

    image_path: Mapped[str] = mapped_column(String)  # served static path
    width: Mapped[int] = mapped_column()
    height: Mapped[int] = mapped_column()

    mission: Mapped[Mission | None] = relationship(back_populates="observations")


# ---------------------------------------------------------------------------
# C. Model Registry
# ---------------------------------------------------------------------------
class ModelRegistryEntry(Base):
    __tablename__ = "model_registry"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String)
    version: Mapped[str] = mapped_column(String)
    task: Mapped[str] = mapped_column(String, index=True)  # vqa|captioning|grounding|change_detection|cross_modal|...
    input_type: Mapped[str] = mapped_column(String)
    output_type: Mapped[str] = mapped_column(String)
    capabilities: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="available")
    performance_notes: Mapped[str] = mapped_column(Text)


# ---------------------------------------------------------------------------
# D. Results & Evidence Store
# ---------------------------------------------------------------------------
class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    mission_id: Mapped[str] = mapped_column(ForeignKey("missions.id"))

    type: Mapped[str] = mapped_column(String)  # spatial|statistical|textual|cross_sensor
    source_service: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    geometry: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    supporting_observation_ids: Mapped[list] = mapped_column(JSON, default=list)
    validation_status: Mapped[str] = mapped_column(String, default="supported")
    strength: Mapped[float] = mapped_column(Float, default=0.5)

    mission: Mapped[Mission] = relationship(back_populates="evidence_items")


# ---------------------------------------------------------------------------
# E. Execution Log Store
# ---------------------------------------------------------------------------
class ExecutionStep(Base):
    __tablename__ = "execution_steps"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    mission_id: Mapped[str] = mapped_column(ForeignKey("missions.id"))

    step_index: Mapped[int] = mapped_column()
    stage: Mapped[str] = mapped_column(String)
    service_name: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="waiting")  # waiting|running|completed|warning|failed
    input_summary: Mapped[str] = mapped_column(Text, default="")
    output_summary: Mapped[str] = mapped_column(Text, default="")
    warnings: Mapped[list] = mapped_column(JSON, default=list)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    mission: Mapped[Mission] = relationship(back_populates="execution_steps")


# ---------------------------------------------------------------------------
# F. Access & Audit Store
# ---------------------------------------------------------------------------
class AuditLogEntry(Base):
    __tablename__ = "audit_log"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    mission_id: Mapped[str | None] = mapped_column(String, nullable=True)
    action: Mapped[str] = mapped_column(String)
    actor: Mapped[str] = mapped_column(String, default="system")
    details: Mapped[str] = mapped_column(Text, default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


# ---------------------------------------------------------------------------
# Cross-domain correlation demo data (Innovation 2)
# ---------------------------------------------------------------------------
class ExternalObservation(Base):
    """Seeded demo ecological/environmental signal, independent of satellite imagery."""

    __tablename__ = "external_observations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    region_key: Mapped[str] = mapped_column(String, index=True)
    source: Mapped[str] = mapped_column(String)  # e.g. "Community bird occurrence log (demo)"
    signal_type: Mapped[str] = mapped_column(String)  # e.g. "species_occurrence_count"
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    geometry: Mapped[dict] = mapped_column(JSON)
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String)
    notes: Mapped[str] = mapped_column(Text, default="")
