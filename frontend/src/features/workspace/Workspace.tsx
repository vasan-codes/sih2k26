import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, assetUrl } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { LoadingState, ErrorState } from '../../components/States';
import { Panel, SectionLabel } from '../../components/Panel';
import { Button } from '../../components/Button';
import { StatusBadge, CheckRow } from '../../components/StatusBadge';
import { PIPELINE_STAGES, StageList, type StageStatus } from '../../components/StageIndicator';
import { ConfidenceMeter } from '../../components/ConfidenceMeter';
import { BlinkCompare, RasterFrame, SwipeCompare, type Overlay } from './RasterViews';
import { SpatialMap, type MapFeature } from './SpatialMap';
import type { EvidenceItem, ExecutionStep, Observation } from '../../api/types';

const STAGE_REVEAL_MS = 420;

export function Workspace() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { data: mission, loading, error, reload } = useAsync(() => api.getMission(missionId!), [missionId]);

  const [revealCount, setRevealCount] = useState(0);
  const [tab, setTab] = useState<string>('');
  const [explain, setExplain] = useState<EvidenceItem | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  useEffect(() => {
    if (!mission) return;
    setRevealCount(0);
    const timer = setInterval(() => {
      setRevealCount((c) => {
        if (c >= PIPELINE_STAGES.length) {
          clearInterval(timer);
          return c;
        }
        return c + 1;
      });
    }, STAGE_REVEAL_MS);
    return () => clearInterval(timer);
  }, [mission?.id]);

  const stepsByStage = useMemo(() => {
    const map: Record<string, ExecutionStep[]> = {};
    mission?.execution_steps.forEach((s) => {
      (map[s.stage] ??= []).push(s);
    });
    return map;
  }, [mission]);

  function actualStageStatus(stageKey: string): StageStatus {
    const steps = stepsByStage[stageKey];
    if (!steps || steps.length === 0) return 'waiting';
    if (steps.some((s) => s.status === 'failed')) return 'failed';
    if (steps.some((s) => s.status === 'warning')) return 'warning';
    if (steps.every((s) => s.status === 'completed')) return 'completed';
    return 'running';
  }

  const stageStatuses = useMemo(() => {
    const out: Record<string, StageStatus> = {};
    PIPELINE_STAGES.forEach((s, i) => {
      out[s.key] = i < revealCount ? actualStageStatus(s.key) : 'waiting';
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealCount, stepsByStage]);

  const pipelineDone = revealCount >= PIPELINE_STAGES.length;
  const missionOutcome = mission?.status ?? 'pending';

  const obsByRole = useMemo(() => {
    const map: Record<string, Observation> = {};
    mission?.observations.forEach((o) => (map[o.role] = o));
    return map;
  }, [mission]);

  const evidenceGeoms = mission?.evidence_items.filter((e) => e.geometry) ?? [];

  const mapFeatures: MapFeature[] = evidenceGeoms.map((e) => ({
    id: e.id,
    geometry: e.geometry!,
    color: e.validation_status === 'conflict' ? 'bad' : e.validation_status === 'insufficient' ? 'warn' : 'ok',
    label: e.title,
  }));

  useEffect(() => {
    if (!mission) return;
    if (mission.mode === 'bi_temporal') setTab('before');
    else if (mission.mode === 'optical_sar' || mission.mode === 'region_centric') setTab('optical');
    else setTab('scene');
  }, [mission?.mode]);

  if (loading) return <LoadingState label="Loading mission…" />;
  if (error || !mission) return <ErrorState message={error ?? 'Mission not found'} onRetry={reload} />;

  // One consistent overlay set for every mode's Grounding tab: every piece of
  // spatial evidence, colored by its own validation status (conflict=red,
  // insufficient=amber, otherwise supported=green).
  const groundingOverlays: Overlay[] = evidenceGeoms.map((e) => ({
    geometry: e.geometry!,
    color: e.validation_status === 'conflict' ? 'bad' : e.validation_status === 'insufficient' ? 'warn' : 'ok',
    label: e.title,
    onClick: () => setExplain(e),
  }));

  let primary1: Observation | undefined;
  let primary2: Observation | undefined;
  let primary1Key = 'primary1';
  let primary2Key = 'primary2';
  let groundingObs: Observation | undefined;
  let swipeBeforeLabel = 'Before';
  let swipeAfterLabel = 'After';
  let swipeAfterOverlays: Overlay[] = [];

  if (mission.mode === 'bi_temporal') {
    primary1 = obsByRole.before; primary2 = obsByRole.after;
    primary1Key = 'before'; primary2Key = 'after';
    groundingObs = obsByRole.after;
    swipeBeforeLabel = 'Before'; swipeAfterLabel = 'After';
  } else if (mission.mode === 'optical_sar' || mission.mode === 'region_centric') {
    primary1 = obsByRole.optical; primary2 = obsByRole.sar;
    primary1Key = 'optical'; primary2Key = 'sar';
    groundingObs = obsByRole.optical;
    swipeBeforeLabel = 'Optical'; swipeAfterLabel = 'SAR';
  } else {
    primary1 = obsByRole.single;
    primary1Key = 'scene';
    groundingObs = obsByRole.single;
    swipeBeforeLabel = 'Raw'; swipeAfterLabel = 'Grounded';
    swipeAfterOverlays = groundingOverlays; // single image has only one frame -- swipe/blink reveal the grounding overlay
  }

  const swipeBeforeObs = primary1;
  const swipeAfterObs = mission.mode === 'single_image' ? primary1 : primary2;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface/60 px-6 py-3.5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`h-2 w-2 rounded-full ${pipelineDone ? (missionOutcome === 'failed' ? 'bg-bad' : 'bg-ok') : 'animate-pulse-slow bg-accent'}`} />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
              Mission Status: {pipelineDone ? missionOutcome.toUpperCase() : 'RUNNING'}
            </span>
          </div>
          <h1 className="mt-0.5 text-base font-bold text-ink-primary">{mission.title}</h1>
          <p className="text-sm text-ink-secondary">"{mission.query_text}"</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate(`/results/${mission.id}`)}>View Evidence</Button>
          <Button variant="secondary" onClick={() => navigate(`/knowledge-graph/${mission.id}`)}>Knowledge Graph</Button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-px overflow-hidden bg-border-subtle lg:grid-cols-[1.3fr_1fr_0.9fr]">
        {/* LEFT: GIS viewer */}
        <div className="flex flex-col overflow-y-auto bg-void p-4">
          <SectionLabel className="mb-2">Interactive GIS Workspace</SectionLabel>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tabsFor(mission.mode).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                  tab === t.key ? 'bg-accent text-[#04141c]' : 'bg-surface-raised text-ink-secondary hover:text-ink-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1">
            {primary1 && tab === primary1Key && (
              <RasterFrame imageUrl={assetUrl(primary1.image_path)} regionBbox={mission.region.bbox} label={primary1.name} />
            )}
            {primary2 && tab === primary2Key && (
              <RasterFrame imageUrl={assetUrl(primary2.image_path)} regionBbox={mission.region.bbox} label={primary2.name} />
            )}

            {groundingObs && tab === 'grounding' && (
              <RasterFrame
                imageUrl={assetUrl(groundingObs.image_path)}
                regionBbox={mission.region.bbox}
                label={groundingObs.name}
                overlays={groundingOverlays}
              />
            )}
            {groundingObs && tab === 'grounding' && groundingOverlays.length === 0 && (
              <p className="mt-2 text-xs text-ink-muted">No spatially-located evidence was produced for this mission to ground.</p>
            )}

            {swipeBeforeObs && swipeAfterObs && tab === 'swipe' && (
              <SwipeCompare
                beforeUrl={assetUrl(swipeBeforeObs.image_path)}
                afterUrl={assetUrl(swipeAfterObs.image_path)}
                beforeLabel={swipeBeforeLabel}
                afterLabel={swipeAfterLabel}
                afterOverlays={swipeAfterOverlays}
                regionBbox={mission.region.bbox}
              />
            )}
            {swipeBeforeObs && swipeAfterObs && tab === 'blink' && (
              <BlinkCompare
                beforeUrl={assetUrl(swipeBeforeObs.image_path)}
                afterUrl={assetUrl(swipeAfterObs.image_path)}
                beforeLabel={swipeBeforeLabel}
                afterLabel={swipeAfterLabel}
                afterOverlays={swipeAfterOverlays}
                regionBbox={mission.region.bbox}
              />
            )}

            {/* Always mounted (visibility toggled) -- WebGL maps don't tolerate being
                repeatedly created/destroyed on every tab switch. */}
            <div className={`aspect-square w-full ${tab === 'map' ? '' : 'hidden'}`}>
              <SpatialMap
                regionBbox={mission.region.bbox}
                features={mapFeatures}
                onFeatureClick={(id) => setExplain(evidenceGeoms.find((e) => e.id === id) ?? null)}
                active={tab === 'map'}
              />
            </div>
          </div>

          {explain && (
            <div className="mt-3 rounded-md border border-accent/40 bg-accent-soft p-3">
              <div className="flex items-center justify-between">
                <SectionLabel>Explain This Region</SectionLabel>
                <button onClick={() => setExplain(null)} className="text-ink-muted hover:text-ink-primary">✕</button>
              </div>
              <div className="mt-1.5 text-[13px] font-semibold text-ink-primary">{explain.title}</div>
              <p className="mt-1 text-xs text-ink-secondary">{explain.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={explain.validation_status} />
                <span className="text-xs text-ink-muted">Evidence strength: {Math.round(explain.strength * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* CENTER: pipeline + answer */}
        <div className="flex flex-col overflow-y-auto bg-surface p-4">
          <SectionLabel className="mb-2">Agentic Orchestration Pipeline</SectionLabel>
          <div className="rounded-md border border-border-subtle bg-surface-raised p-3">
            <StageList statuses={stageStatuses} />
          </div>

          {pipelineDone && mission.result && (
            <div className="mt-4 space-y-4">
              {mission.result.sensor_consistency && (
                <Panel eyebrow="Innovation: Cross-Sensor Validation" title="Sensor Consistency Status">
                  <StatusBadge status={mission.result.sensor_consistency.level} />
                  {mission.result.sensor_consistency.level !== 'HIGH_AGREEMENT' && (
                    <Button variant="secondary" className="ml-2" onClick={() => setTab('grounding')}>
                      Investigate Conflict
                    </Button>
                  )}
                  <div className="mt-2 space-y-1.5 text-xs text-ink-secondary">
                    <p><span className="font-semibold text-ink-primary">Optical:</span> {mission.result.sensor_consistency.optical_interpretation}</p>
                    <p><span className="font-semibold text-ink-primary">SAR:</span> {mission.result.sensor_consistency.sar_interpretation}</p>
                    {mission.result.sensor_consistency.disputed_area_ha > 0 && (
                      <p className="text-warn">Disputed area: {mission.result.sensor_consistency.disputed_area_ha} ha</p>
                    )}
                  </div>
                </Panel>
              )}

              <Panel eyebrow={mission.result.demo_label} title="AI Assessment">
                <p className="text-[13px] leading-relaxed text-ink-primary">{mission.result.answer}</p>
                {mission.result.key_findings.length > 0 && (
                  <div className="mt-3">
                    <SectionLabel className="mb-1.5">Key Findings</SectionLabel>
                    <ul className="space-y-1 text-[13px] text-ink-secondary">
                      {mission.result.key_findings.map((k, i) => <li key={i}>• {k}</li>)}
                    </ul>
                  </div>
                )}
                {mission.result.uncertainty.length > 0 && (
                  <div className="mt-3 rounded-md border border-warn/30 bg-warn/10 p-2.5">
                    <SectionLabel className="mb-1 text-warn">Uncertainty / Limitations</SectionLabel>
                    <ul className="space-y-1 text-xs text-ink-secondary">
                      {mission.result.uncertainty.map((u, i) => <li key={i}>• {u}</li>)}
                    </ul>
                  </div>
                )}
              </Panel>
            </div>
          )}
        </div>

        {/* RIGHT: evidence, validation, confidence, trace */}
        <div className="flex flex-col overflow-y-auto bg-surface p-4 space-y-4">
          {mission.workflow && (
            <Panel eyebrow="Selected automatically by SatQuery agent" title="Workflow">
              <div className="text-xs text-ink-secondary">Primary: <span className="font-semibold text-ink-primary">{mission.workflow.primary_task.replace(/_/g, ' ')}</span></div>
              {mission.workflow.selected_models.map((m) => (
                <div key={m.model_id} className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="text-ink-secondary">{m.task.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-ink-primary">{m.name} v{m.version}</span>
                </div>
              ))}
            </Panel>
          )}

          {pipelineDone && mission.confidence && (
            <Panel title="Confidence Breakdown">
              <ConfidenceMeter confidence={mission.confidence} />
            </Panel>
          )}

          {pipelineDone && mission.result && (
            <Panel title="Evidence Safety Status">
              <StatusBadge status={mission.result.evidence_validation.status} />
              <ul className="mt-2 space-y-1 text-xs text-ink-secondary">
                {mission.result.evidence_validation.notes.map((n, i) => <li key={i}>• {n}</li>)}
              </ul>
            </Panel>
          )}

          {mission.validation && (
            <Panel title="Input & Geospatial Validation">
              <div className="divide-y divide-border-subtle">
                {[...mission.validation.input_checks, ...mission.validation.geo_checks].map((c) => (
                  <CheckRow key={c.key} label={c.label} status={c.status} detail={c.detail} />
                ))}
              </div>
            </Panel>
          )}

          <Panel
            title="Execution Trace"
            actions={<button onClick={() => setShowTrace((s) => !s)} className="text-xs text-accent">{showTrace ? 'Collapse' : 'Expand'}</button>}
          >
            <div className="space-y-1.5">
              {mission.execution_steps.slice(0, showTrace ? undefined : 5).map((s) => (
                <div key={s.id} className="rounded border border-border-subtle p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-ink-primary">{s.step_index}. {s.service_name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-ink-muted">
                    {s.started_at && new Date(s.started_at).toLocaleTimeString()} · {s.output_summary}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => navigate(`/results/${mission.id}`)}>Generate Report</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function tabsFor(mode: string) {
  const primary =
    mode === 'bi_temporal'
      ? [{ key: 'before', label: 'Before' }, { key: 'after', label: 'After' }]
      : mode === 'optical_sar' || mode === 'region_centric'
        ? [{ key: 'optical', label: 'Optical' }, { key: 'sar', label: 'SAR' }]
        : [{ key: 'scene', label: 'Scene' }];

  return [
    ...primary,
    { key: 'grounding', label: 'Grounding' },
    { key: 'swipe', label: 'Swipe Compare' },
    { key: 'blink', label: 'Blink Compare' },
    { key: 'map', label: 'Spatial Map' },
  ];
}
