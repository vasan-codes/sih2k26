import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Mode, Observation, QueryUnderstanding, Region, ValidateInputsResponse } from '../../api/types';
import { Panel, SectionLabel } from '../../components/Panel';
import { Button } from '../../components/Button';
import { CheckRow } from '../../components/StatusBadge';
import { TopBar } from '../../layout/AppShell';
import { useAsync } from '../../hooks/useAsync';
import { LoadingState } from '../../components/States';

const MODES: { key: Mode; title: string; description: string; tasks: string[] }[] = [
  {
    key: 'single_image',
    title: 'Single Image',
    description: 'One optical/multispectral observation. Ask about land cover, features, or request a scene description.',
    tasks: ['Visual Question Answering', 'Captioning', 'Text-Guided Grounding'],
  },
  {
    key: 'optical_sar',
    title: 'Optical + SAR',
    description: 'Co-registered optical and SAR observations of the same footprint, cross-checked against each other.',
    tasks: ['Cross-Modal Analysis', 'Conflict Detection'],
  },
  {
    key: 'bi_temporal',
    title: 'Bi-Temporal',
    description: 'Two observations of the same region at different times — detect, localize and quantify change.',
    tasks: ['Change Detection', 'Change Quantification'],
  },
  {
    key: 'region_centric',
    title: 'Region-Centric',
    description: 'Start from a geographic region and let SatQuery AI organize every compatible observation around it.',
    tasks: ['Region Intelligence'],
  },
];

const SUGGESTED_QUERY: Record<string, string> = {
  'aoi-riverside-corridor': 'Has the built-up area increased between these dates, and where?',
  'aoi-coastal-wetland': 'Verify the water extent in this wetland using SAR and flag any disagreement.',
  'aoi-agro-mosaic': 'Describe the agricultural activity in this image and highlight the water body.',
};

const UPLOAD_DEFAULT_QUERY: Record<Mode, string> = {
  single_image: 'Describe what is visible in this image and identify the major land-cover types.',
  optical_sar: 'Do the optical and SAR observations agree? Flag any disagreement.',
  bi_temporal: 'What changed between these two observations, and where?',
  region_centric: '',
};

interface RoleSpec {
  role: string;
  label: string;
  sensorType: 'optical' | 'sar' | 'multispectral';
  dateLabel: string;
}

const UPLOAD_ROLES: Partial<Record<Mode, RoleSpec[]>> = {
  single_image: [{ role: 'single', label: 'Scene Image', sensorType: 'optical', dateLabel: 'Acquisition date' }],
  optical_sar: [
    { role: 'optical', label: 'Optical Image', sensorType: 'optical', dateLabel: 'Acquisition date' },
    { role: 'sar', label: 'SAR Image', sensorType: 'sar', dateLabel: 'Acquisition date' },
  ],
  bi_temporal: [
    { role: 'before', label: 'Before (T1)', sensorType: 'optical', dateLabel: 'T1 date' },
    { role: 'after', label: 'After (T2)', sensorType: 'optical', dateLabel: 'T2 date' },
  ],
};

interface UploadSlot {
  file: File | null;
  previewUrl: string | null;
  date: string;
  status: 'idle' | 'uploading' | 'done' | 'error';
  observation: Observation | null;
  error?: string;
}

function emptySlots(mode: Mode): Record<string, UploadSlot> {
  const specs = UPLOAD_ROLES[mode] ?? [];
  const out: Record<string, UploadSlot> = {};
  specs.forEach((s) => {
    out[s.role] = { file: null, previewUrl: null, date: '', status: 'idle', observation: null };
  });
  return out;
}

export function NewAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const preset = location.state as { mode?: Mode; regionKey?: string } | null;
  const regions = useAsync(() => api.listRegions(), []);

  const [mode, setMode] = useState<Mode | null>(preset?.mode ?? null);
  const [source, setSource] = useState<'upload' | 'demo'>(preset?.regionKey ? 'demo' : 'upload');
  const [regionKey, setRegionKey] = useState<string | null>(preset?.regionKey ?? null);
  const [queryText, setQueryText] = useState('');
  const [qu, setQu] = useState<QueryUnderstanding | null>(null);
  const [validation, setValidation] = useState<ValidateInputsResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const [uploads, setUploads] = useState<Record<string, UploadSlot>>(mode ? emptySlots(mode) : {});
  const uploadRegionKeyRef = useRef<string | null>(null);

  const compatibleRegions = useMemo<Region[]>(
    () => (regions.data ?? []).filter((r) => (mode ? r.modes.includes(mode) : false)),
    [regions.data, mode],
  );

  function selectMode(key: Mode) {
    setMode(key);
    setSource('upload');
    setRegionKey(null);
    setQueryText('');
    setUploads(emptySlots(key));
    uploadRegionKeyRef.current = null;
  }

  // demo-path region auto-select (unchanged behavior from before uploads existed)
  useEffect(() => {
    if (!mode || source !== 'demo') return;
    if (mode === 'region_centric') return;
    const first = compatibleRegions[0];
    if (first && !compatibleRegions.some((r) => r.key === regionKey)) {
      setRegionKey(first.key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, source, compatibleRegions.length]);

  useEffect(() => {
    if (source === 'demo' && regionKey && !queryText) {
      setQueryText(SUGGESTED_QUERY[regionKey] ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionKey, source]);

  useEffect(() => {
    if (source === 'upload' && mode && mode !== 'region_centric' && !queryText) {
      setQueryText(UPLOAD_DEFAULT_QUERY[mode]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, source]);

  useEffect(() => {
    if (!mode || !regionKey || mode === 'region_centric') {
      setValidation(null);
      return;
    }
    setValidating(true);
    api
      .validateInputs(mode, regionKey)
      .then(setValidation)
      .finally(() => setValidating(false));
  }, [mode, regionKey]);

  useEffect(() => {
    if (!queryText.trim()) {
      setQu(null);
      return;
    }
    const t = setTimeout(() => {
      api.understandQuery(queryText).then(setQu).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [queryText]);

  async function handleFile(spec: RoleSpec, file: File) {
    if (!mode) return;
    const previewUrl = URL.createObjectURL(file);
    setUploads((u) => ({ ...u, [spec.role]: { ...u[spec.role], file, previewUrl, status: 'uploading', error: undefined } }));
    try {
      const obs = await api.uploadObservation(
        file,
        spec.role,
        mode,
        spec.sensorType,
        uploads[spec.role]?.date || undefined,
        uploadRegionKeyRef.current ?? undefined,
      );
      if (!uploadRegionKeyRef.current) uploadRegionKeyRef.current = obs.region_key;
      setUploads((u) => ({ ...u, [spec.role]: { ...u[spec.role], status: 'done', observation: obs } }));
    } catch (e) {
      setUploads((u) => ({ ...u, [spec.role]: { ...u[spec.role], status: 'error', error: (e as Error).message } }));
    }
  }

  function updateDate(role: string, date: string) {
    setUploads((u) => ({ ...u, [role]: { ...u[role], date } }));
  }

  const uploadSpecs = mode ? UPLOAD_ROLES[mode] ?? [] : [];
  const uploadComplete = uploadSpecs.length > 0 && uploadSpecs.every((s) => uploads[s.role]?.status === 'done');

  // Drive regionKey off actual upload state (not a closure inside the upload
  // handler) so it's set correctly regardless of upload completion order/timing.
  useEffect(() => {
    if (source !== 'upload' || !uploadComplete) return;
    const anyObs = uploadSpecs.map((s) => uploads[s.role]?.observation).find(Boolean);
    if (anyObs) setRegionKey(anyObs.region_key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadComplete, source]);

  const canRun = mode && mode !== 'region_centric' && regionKey && queryText.trim().length > 0 && validation?.overall_status
    && (source === 'demo' || uploadComplete);

  async function runAnalysis() {
    if (!mode || !regionKey || mode === 'region_centric') return;
    setRunning(true);
    setRunError(null);
    try {
      const mission = await api.analyze(mode, regionKey, queryText);
      navigate(`/workspace/${mission.id}`);
    } catch (e) {
      setRunError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar title="New Analysis" subtitle="Upload satellite imagery and describe what you want to know — or explore with demo AOIs." />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div>
            <SectionLabel className="mb-3">1 — Analysis mode</SectionLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => selectMode(m.key)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    mode === m.key
                      ? 'border-accent bg-accent-soft shadow-glow'
                      : 'border-border-subtle bg-surface hover:border-border-strong'
                  }`}
                >
                  <div className="text-[13px] font-bold text-ink-primary">{m.title}</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">{m.description}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {m.tasks.map((t) => (
                      <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-ink-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {mode === 'region_centric' && (
            <Panel>
              <p className="text-sm text-ink-secondary">
                Region-Centric analysis starts from a geographic region rather than a specific upload. Continue to
                Region Intelligence to select a region and see every compatible observation organized around it.
              </p>
              <Button variant="primary" className="mt-4" onClick={() => navigate('/region-intelligence')}>
                Continue to Region Intelligence →
              </Button>
            </Panel>
          )}

          {mode && mode !== 'region_centric' && (
            <>
              <div>
                <SectionLabel className="mb-3">2 — Satellite data source</SectionLabel>
                <div className="flex gap-1.5 rounded-lg border border-border-subtle bg-surface p-1">
                  <button
                    onClick={() => {
                      setSource('upload');
                      setRegionKey(uploadRegionKeyRef.current);
                      setQueryText('');
                    }}
                    className={`flex-1 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors ${
                      source === 'upload' ? 'bg-accent text-[#04141c]' : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    Upload Your Own Imagery
                  </button>
                  <button
                    onClick={() => {
                      setSource('demo');
                      setRegionKey(null);
                      setQueryText('');
                    }}
                    className={`flex-1 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors ${
                      source === 'demo' ? 'bg-accent text-[#04141c]' : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    Use Demo AOI
                  </button>
                </div>
              </div>

              {source === 'upload' && (
                <div>
                  <SectionLabel className="mb-3">Upload observations</SectionLabel>
                  <div className={`grid grid-cols-1 gap-3 ${uploadSpecs.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                    {uploadSpecs.map((spec) => (
                      <UploadDropzone key={spec.role} spec={spec} slot={uploads[spec.role]} onFile={(f) => handleFile(spec, f)} onDate={(d) => updateDate(spec.role, d)} />
                    ))}
                  </div>
                  {uploadComplete && (
                    <p className="mt-2 text-xs text-ok">
                      ✓ All required observations uploaded. Region key: <span className="font-mono">{uploadRegionKeyRef.current}</span>
                    </p>
                  )}
                </div>
              )}

              {source === 'demo' && (
                <>
                  <div>
                    <SectionLabel className="mb-3">Demo observation set</SectionLabel>
                    {regions.loading && <LoadingState />}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {compatibleRegions.map((r) => (
                        <button
                          key={r.key}
                          onClick={() => setRegionKey(r.key)}
                          className={`rounded-lg border p-3 text-left transition-all ${
                            regionKey === r.key ? 'border-accent bg-accent-soft' : 'border-border-subtle bg-surface hover:border-border-strong'
                          }`}
                        >
                          <div className="text-[13px] font-semibold text-ink-primary">{r.label}</div>
                          <div className="mt-1 text-xs text-ink-muted">{r.observations.length} observation(s) in catalog</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {regionKey && (
                    <ObservationCards region={compatibleRegions.find((r) => r.key === regionKey)!} mode={mode} />
                  )}
                </>
              )}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Panel eyebrow="Step 3" title="Natural-language query">
                  <textarea
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    rows={4}
                    placeholder="e.g. Has the built-up area increased between these dates, and where?"
                    className="w-full resize-none rounded-md border border-border-subtle bg-surface-raised p-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none"
                  />
                  {qu && (
                    <div className="mt-3 rounded-md border border-border-subtle bg-surface-raised p-3">
                      <SectionLabel className="mb-2">Live query understanding</SectionLabel>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        <Tag label={`Intent: ${qu.intent.replace(/_/g, ' ')}`} />
                        {qu.wants_quantification && <Tag label="Quantification requested" />}
                        {qu.wants_grounding && <Tag label="Grounding requested" />}
                        {qu.wants_cross_sensor_verification && <Tag label="SAR verification requested" />}
                        {qu.temporal_reference_detected && <Tag label="Temporal reference detected" />}
                      </div>
                    </div>
                  )}
                </Panel>

                <Panel eyebrow="Step 4" title="Input compatibility check">
                  {!regionKey && <p className="text-xs text-ink-muted">Upload the required observation(s) above to run compatibility checks.</p>}
                  {validating && <LoadingState label="Validating inputs…" />}
                  {validation && (
                    <div className="divide-y divide-border-subtle">
                      {validation.checks.map((c) => (
                        <CheckRow key={c.key} label={c.label} status={c.status} detail={c.detail} />
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="primary" className="px-6 py-3 text-sm" disabled={!canRun} loading={running} onClick={runAnalysis}>
                  Run SatQuery
                </Button>
                {!validation?.overall_status && validation && (
                  <span className="text-xs text-warn">Resolve input compatibility issues before running.</span>
                )}
                {source === 'upload' && !uploadComplete && uploadSpecs.length > 0 && (
                  <span className="text-xs text-ink-muted">Upload all required observations to continue.</span>
                )}
                {runError && <span className="text-xs text-bad">{runError}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return <span className="rounded border border-accent/30 bg-accent-soft px-2 py-0.5 text-accent">{label}</span>;
}

function UploadDropzone({
  spec,
  slot,
  onFile,
  onDate,
}: {
  spec: RoleSpec;
  slot: UploadSlot | undefined;
  onFile: (file: File) => void;
  onDate: (date: string) => void;
}) {
  const inputId = `upload-${spec.role}`;
  const status = slot?.status ?? 'idle';

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink-primary">{spec.label}</span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-ink-muted">{spec.sensorType}</span>
      </div>

      <label
        htmlFor={inputId}
        className={`flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border border-dashed text-center transition-colors ${
          status === 'error' ? 'border-bad/50 bg-bad/5' : status === 'done' ? 'border-ok/50 bg-ok/5' : 'border-border hover:border-accent/50 hover:bg-white/[0.02]'
        }`}
      >
        {slot?.previewUrl ? (
          <img src={slot.previewUrl} alt={spec.label} className="h-full w-full object-cover" />
        ) : (
          <div className="px-3 text-xs text-ink-muted">
            <div className="mb-1 text-lg">⤒</div>
            Click to select an image
          </div>
        )}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <input
          type="date"
          value={slot?.date ?? ''}
          onChange={(e) => onDate(e.target.value)}
          className="w-full rounded border border-border-subtle bg-surface-raised px-2 py-1 text-xs text-ink-primary focus:border-accent focus:outline-none"
          title={spec.dateLabel}
        />
        {status === 'uploading' && <span className="shrink-0 text-xs text-accent">Uploading…</span>}
        {status === 'done' && <span className="shrink-0 text-xs text-ok">✓ Uploaded</span>}
        {status === 'error' && <span className="shrink-0 text-xs text-bad">Failed</span>}
      </div>
      {status === 'error' && slot?.error && <p className="mt-1 text-[11px] text-bad">{slot.error}</p>}
    </div>
  );
}

function ObservationCards({ region, mode }: { region: Region; mode: Mode }) {
  const roleFilter: Record<string, string[]> = {
    bi_temporal: ['before', 'after'],
    optical_sar: ['optical', 'sar'],
    region_centric: ['optical', 'sar'],
    single_image: ['single'],
  };
  const relevant = region.observations.filter((o) => roleFilter[mode]?.includes(o.role));

  return (
    <div>
      <SectionLabel className="mb-3">Observation metadata</SectionLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {relevant.map((o) => (
          <div key={o.id} className="rounded-lg border border-border-subtle bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink-primary">{o.name}</span>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-ink-muted">{o.role}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-ink-muted">
              <span>Sensor: {o.sensor_type}</span>
              <span>CRS: {o.crs}</span>
              <span>Res: {o.resolution_m}m</span>
              <span>Bands: {o.bands.length}</span>
              <span className="col-span-2">Acquired: {new Date(o.acquisition_time).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
