# FILMY AI — Video & Cinematography Intelligence Engine (`ML_VIDEO`)

FilmyAI `ML_VIDEO` is a production-grade, multimodal film understanding engine designed to extract deep cinematographic, visual aesthetic, structural, and acoustic intelligence from real motion pictures.

---

## 🏗️ Architecture Overview

```
ML_VIDEO/
├── configs/
│   └── config.yaml                     # Unified configuration
├── datasets/
│   ├── types_of_film_shots/            # 863 real annotated film images
│   ├── movienet/                       # 1,100 feature films (13.2k shots, 45.4k scenes, 2M+ cast boxes)
│   ├── shotbench/                      # 3,572 multi-task aesthetic QA pairs (Apache 2.0)
│   └── ava/                            # 39,874 real labeled audio speech activity segments
├── models/
│   └── checkpoints/                    # Saved PyTorch weights (.pt)
├── reports/
│   ├── dataset_verification.md         # Full real-data proof manifest
│   ├── speech_classifier_evaluation.json
│   └── shot_scale_benchmark_results.json
├── src/
│   ├── aggregation/                    # JSON schema exporter & aggregator
│   ├── audio_video/                    # AVA speech activity & acoustic feature extraction
│   ├── cinematography/                 # Multi-task aesthetic prediction heads
│   ├── data/                           # Dataset parsers & manifest generators
│   ├── inference/                      # FilmyAIVideoEngine (unified orchestrator)
│   ├── models/                         # PyTorch architectures (EfficientNet-B0, ResNet-18, CinematicShotCNN)
│   ├── segmentation/                   # PySceneDetect + OpenCV shot/scene cut detection & keyframe extraction
│   ├── training/                       # Training, benchmarking, and evaluation pipelines
│   └── vfx/                            # Lighting (Chiaroscuro/High-key) & Composition (Rule of Thirds) analyzer
├── tests/                              # Comprehensive test suite (pytest)
└── requirements.txt                    # Production dependencies
```

---

## 📊 Supported Real Datasets

1. **`szymonrucinski/types-of-film-shots`** (863 images, 8 shot scale classes)
2. **`OpenDataLab/MovieNet`** (1,100 movies, 8,918 JSONs, 13,204 shot styles, 45,385 scenes, 2,004,099 cast boxes)
3. **`Vchitect/ShotBench`** (3,572 cinematography QA pairs across 8 aesthetic categories)
4. **`Google AVA Speech Labels v1.0`** (39,874 real labeled audio segments across 158 feature films)

---

## 🚀 Quickstart & Inference

```python
from ML_VIDEO.src.inference.video_analyzer import FilmyAIVideoEngine

# Initialize engine (GPU if available, CPU fallback)
engine = FilmyAIVideoEngine()

# Run full multimodal film analysis
report = engine.analyze_video(
    video_path="path/to/movie_clip.mp4",
    output_json_path="reports/film_intelligence_report.json",
    keyframe_dir="reports/keyframes"
)

print(report["executive_summary"])
```

---

## 🧪 Testing

Run all unit and integration tests:
```bash
python -m pytest ML_VIDEO/tests -v
```
