"""TaskRouter + WorkflowPlanner (spec §7 / §8).

classify_tasks() implements the explicit IF/THEN routing rules from the spec.
select_services() then queries the Model Registry (never a hardcoded model name)
to resolve each task to an actual registered service.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import ModelRegistryEntry

REGISTRY_BACKED_TASKS = {
    "vqa", "captioning", "grounding", "change_detection", "cross_modal",
    "built_up_classification", "sar_water_index",
}


def classify_tasks(mode: str, qu: dict) -> dict:
    supporting_tasks: list[str] = []
    validation_tasks: list[str] = ["evidence_validation"]
    limitations: list[str] = []

    if mode == "bi_temporal":
        primary_task = "change_detection"
        supporting_tasks.append("built_up_classification")
        supporting_tasks.append("area_quantification")
        if qu["wants_grounding"]:
            supporting_tasks.append("spatial_grounding")
        if qu["wants_cross_sensor_verification"]:
            limitations.append(
                "Query requested SAR verification, but this mission's inputs are optical-only -- "
                "cross-modal verification was not run. Provide a co-registered SAR observation to enable it."
            )

    elif mode == "optical_sar":
        primary_task = "cross_modal"
        supporting_tasks.append("sar_water_index")
        validation_tasks.append("conflict_detection")

    elif mode == "single_image":
        if qu["intent"] == "text_guided_grounding":
            primary_task = "grounding"
            supporting_tasks.append("vqa")
        elif qu["intent"] == "scene_captioning":
            primary_task = "captioning"
        else:
            primary_task = "vqa"

    else:  # region_centric -- delegate to whichever compatible pair the region offers
        primary_task = "cross_modal"
        supporting_tasks.append("sar_water_index")
        validation_tasks.append("conflict_detection")

    return {
        "primary_task": primary_task,
        "supporting_tasks": supporting_tasks,
        "validation_tasks": validation_tasks,
        "limitations": limitations,
    }


def select_services(db: Session, tasks: dict) -> list[dict]:
    candidate_tasks = [tasks["primary_task"]] + [t for t in tasks["supporting_tasks"] if t in REGISTRY_BACKED_TASKS]
    selected = []
    for task in dict.fromkeys(candidate_tasks):
        entry = db.query(ModelRegistryEntry).filter_by(task=task, status="available").first()
        if entry:
            selected.append(
                {
                    "task": task,
                    "model_id": entry.id,
                    "name": entry.name,
                    "version": entry.version,
                    "capabilities": entry.capabilities,
                }
            )
    return selected
