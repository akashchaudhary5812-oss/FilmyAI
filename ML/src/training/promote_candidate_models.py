import shutil
import json
from pathlib import Path

ml_models = Path("ML/models")

# 1. Create archive for baseline v1 if not exists
archive_v1 = ml_models / "archive" / "baseline_v1"
archive_v1.mkdir(parents=True, exist_ok=True)
(archive_v1 / "classification").mkdir(exist_ok=True)
(archive_v1 / "regression").mkdir(exist_ok=True)
(archive_v1 / "preprocessors").mkdir(exist_ok=True)

# Copy baseline files to archive if not already archived
if not (archive_v1 / "model_metadata.json").exists():
    shutil.copy(ml_models / "model_metadata.json", archive_v1 / "model_metadata.json")
    if (ml_models / "classification" / "champion_classifier.joblib").exists():
        shutil.copy(ml_models / "classification" / "champion_classifier.joblib", archive_v1 / "classification" / "champion_classifier.joblib")
    if (ml_models / "regression" / "champion_regressor.joblib").exists():
        shutil.copy(ml_models / "regression" / "champion_regressor.joblib", archive_v1 / "regression" / "champion_regressor.joblib")
    if (ml_models / "preprocessors" / "feature_scaler.joblib").exists():
        shutil.copy(ml_models / "preprocessors" / "feature_scaler.joblib", archive_v1 / "preprocessors" / "feature_scaler.joblib")
    if (ml_models / "preprocessors" / "feature_names.joblib").exists():
        shutil.copy(ml_models / "preprocessors" / "feature_names.joblib", archive_v1 / "preprocessors" / "feature_names.joblib")
    print("[Promotion] Preserved baseline v1 in ML/models/archive/baseline_v1/")

# 2. Promote Candidate v2 to Production and active champion paths
candidate_dir = ml_models / "candidate"
production_dir = ml_models / "production"
production_dir.mkdir(parents=True, exist_ok=True)
(production_dir / "classification").mkdir(exist_ok=True)
(production_dir / "regression").mkdir(exist_ok=True)
(production_dir / "preprocessors").mkdir(exist_ok=True)

shutil.copy(candidate_dir / "classification" / "candidate_classifier.joblib", ml_models / "classification" / "champion_classifier.joblib")
shutil.copy(candidate_dir / "regression" / "candidate_regressor.joblib", ml_models / "regression" / "champion_regressor.joblib")
shutil.copy(candidate_dir / "preprocessors" / "feature_scaler.joblib", ml_models / "preprocessors" / "feature_scaler.joblib")
shutil.copy(candidate_dir / "preprocessors" / "feature_names.joblib", ml_models / "preprocessors" / "feature_names.joblib")

shutil.copy(candidate_dir / "classification" / "candidate_classifier.joblib", production_dir / "classification" / "champion_classifier.joblib")
shutil.copy(candidate_dir / "regression" / "candidate_regressor.joblib", production_dir / "regression" / "champion_regressor.joblib")
shutil.copy(candidate_dir / "preprocessors" / "feature_scaler.joblib", production_dir / "preprocessors" / "feature_scaler.joblib")
shutil.copy(candidate_dir / "preprocessors" / "feature_names.joblib", production_dir / "preprocessors" / "feature_names.joblib")

with open(candidate_dir / "candidate_model_metadata.json", "r") as f:
    cand_meta = json.load(f)

with open(ml_models / "model_metadata.json", "w") as f:
    json.dump(cand_meta, f, indent=2)

with open(production_dir / "model_metadata.json", "w") as f:
    json.dump(cand_meta, f, indent=2)

print("[Promotion] Successfully promoted Candidate v2 to active production models!")
