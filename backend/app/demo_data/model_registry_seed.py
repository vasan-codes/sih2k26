"""Seed data for the Model Registry (spec §5.C / §19).

TaskRouter/WorkflowPlanner query this table by `task` at run time -- they never
branch on a hardcoded model name. `performance_notes` is deliberately honest: these
are prototype deterministic implementations, not trained/benchmarked models.
"""

MODEL_REGISTRY_SEED = [
    {
        "name": "SatQuery-VQA-RS",
        "version": "0.3.0-proto",
        "task": "vqa",
        "input_type": "single optical/multispectral image",
        "output_type": "natural-language answer + referenced land-cover classes",
        "capabilities": "Answers land-cover / feature questions about a single scene.",
        "performance_notes": "Prototype: deterministic rule-based reasoning over computed land-cover statistics. Not a trained VLM.",
    },
    {
        "name": "SatQuery-Caption-RS",
        "version": "0.3.0-proto",
        "task": "captioning",
        "input_type": "single optical/multispectral image",
        "output_type": "scene-description caption",
        "capabilities": "Generates a scene-level natural-language description.",
        "performance_notes": "Prototype: template caption filled from computed land-cover percentages.",
    },
    {
        "name": "SatQuery-Ground-RS",
        "version": "0.2.1-proto",
        "task": "grounding",
        "input_type": "single optical/multispectral image + text prompt",
        "output_type": "spatial region(s) (GeoJSON) matching the described feature",
        "capabilities": "Text-guided localization of a named land-cover class or feature.",
        "performance_notes": "Prototype: keyword-to-class mapping + pixel-mask hotspot clustering.",
    },
    {
        "name": "SatQuery-ChangeNet",
        "version": "0.4.2-proto",
        "task": "change_detection",
        "input_type": "co-registered bi-temporal optical pair",
        "output_type": "change mask, hotspot regions, area statistics",
        "capabilities": "Detects, localizes and quantifies built-up change between two dates.",
        "performance_notes": "Prototype: rule-based built-up classification + pixel-diff, not a trained change-detection CNN.",
    },
    {
        "name": "SatQuery-CrossModal-Fusion",
        "version": "0.3.5-proto",
        "task": "cross_modal",
        "input_type": "co-registered optical + SAR pair",
        "output_type": "per-sensor interpretation, agreement/conflict map, confirmed extent",
        "capabilities": "Independently interprets optical and SAR, then checks agreement.",
        "performance_notes": "Prototype: independent thresholding per sensor + spatial disagreement analysis.",
    },
    {
        "name": "SatQuery-BuiltUp-Classifier",
        "version": "0.2.0-proto",
        "task": "built_up_classification",
        "input_type": "single optical/multispectral image",
        "output_type": "binary built-up mask",
        "capabilities": "Supporting task: classifies built-up vs non-built-up pixels.",
        "performance_notes": "Prototype: low-saturation / mid-brightness threshold classifier.",
    },
    {
        "name": "SatQuery-SAR-WaterIndex",
        "version": "0.2.0-proto",
        "task": "sar_water_index",
        "input_type": "single SAR (VV) image",
        "output_type": "binary water-likely mask",
        "capabilities": "Supporting task: flags low-backscatter (water-consistent) pixels in SAR.",
        "performance_notes": "Prototype: fixed backscatter-intensity threshold, not a calibrated water index.",
    },
]
