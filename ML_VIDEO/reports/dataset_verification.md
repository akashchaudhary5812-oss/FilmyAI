# FILMY AI — Video Intelligence Dataset Verification Manifest

**Verification Date**: 2026-09-11  
**Project**: FILMY AI (Film Video Intelligence & Cinematography Engine)  
**Status**: VERIFIED REAL DATASETS ONLY — NO SYNTHETIC / FAKE DATA

---

## 1. Dataset Manifests

### Dataset A: Types of Film Shots
- **Dataset Name**: `szymonrucinski/types-of-film-shots`
- **Official URL**: https://huggingface.co/datasets/szymonrucinski/types-of-film-shots
- **License**: Public / Open Access
- **Local Path**: `ML_VIDEO/data/raw/types_of_film_shots/`
- **Download Status**: `success`
- **Total Samples**: 863 real annotated cinematic frames
- **Split**: Train: 604 (70%) | Val: 129 (15%) | Test: 130 (15%)
- **Classes (8)**:
  - `ambiguous`: 33
  - `closeUp`: 157
  - `detail`: 62
  - `extremeLongShot`: 61
  - `fullShot`: 98
  - `longShot`: 129
  - `mediumCloseUp`: 161
  - `mediumShot`: 162
- **Integrity Check**: 100% of image files exist on disk with valid image headers.

---

### Dataset B: MovieNet (OpenDataLab)
- **Dataset Name**: `OpenDataLab/MovieNet`
- **Official URL**: https://opendatalab.com/OpenDataLab/MovieNet
- **Paper**: ECCV 2020 (*"MovieNet: A Holistic Dataset for Movie Understanding"*)
- **License**: Academic / Non-commercial Research
- **Local Path**: `ML_VIDEO/datasets/movienet/`
- **Download Status**: `success` (Downloaded `MovieNet.tar.gz` 846.22 MB via authenticated OpenDataLab API)
- **Total Feature Films Annotated**: 1,100 movies (8,918 JSON annotation files)
- **Total Cinematic Style Shot Annotations**: 13,204 shots
- **Total Scene Segments**: 45,385 scenes
- **Total Character / Cast Bounding Boxes**: 2,004,099 boxes
- **Shot Scale Distribution**:
  - `closeup`: 6,713
  - `medium`: 3,535
  - `full`: 2,075
  - `extreme_closeup`: 703
  - `long`: 178
- **Camera Movement Distribution**:
  - `static`: 8,665
  - `moving`: 3,759
  - `push`: 552
  - `pull`: 55
  - `multi_movement`: 173
- **Parsed Artifacts**:
  - `ML_VIDEO/datasets/movienet/parsed/movienet_shot_styles.csv` (13,204 rows)
  - `ML_VIDEO/datasets/movienet/parsed/movienet_scenes.csv` (45,385 rows)
  - `ML_VIDEO/datasets/movienet/parsed/movienet_manifest.json`

---

### Dataset C: ShotBench (Vchitect)
- **Dataset Name**: `Vchitect/ShotBench`
- **Official URL**: https://huggingface.co/datasets/Vchitect/ShotBench
- **License**: Apache-2.0
- **Local Path**: `ML_VIDEO/datasets/shotbench/`
- **Download Status**: `success` (Direct streaming download of `images.tar` 2.07 GB + `test.tsv`)
- **Total Cinematic QA Pairs**: 3,572
- **Aesthetic Dimensions**:
  - `lens size`: 489
  - `shot size`: 485
  - `composition`: 479
  - `camera movement`: 464
  - `camera angle`: 455
  - `shot framing`: 445
  - `lighting type`: 405
  - `lighting`: 350
- **Multi-Task Heads Supported**: 5 distinct heads (Shot Size, Camera Angle, Camera Movement, Composition, Lighting)

---

### Dataset D: Google AVA Speech Labels v1.0
- **Dataset Name**: `Google AVA Speech Dataset`
- **Official URL**: https://research.google.com/ava/download/ava_speech_labels_v1.csv
- **License**: Creative Commons Attribution 4.0
- **Local Path**: `ML_VIDEO/datasets/ava/ava_speech_labels_v1.csv`
- **Download Status**: `success` (1.6 MB, 39,874 segments)
- **Total Labeled Segments**: 39,874
- **Categories**:
  - `NO_SPEECH`: 17,624
  - `SPEECH_WITH_NOISE`: 10,506
  - `CLEAN_SPEECH`: 6,433
  - `SPEECH_WITH_MUSIC`: 5,311
- **Acoustic Feature Extraction**: 40-dimensional spectral & energy filterbank representations.

---

## 2. Compliance Statement

All models in `ML_VIDEO` are trained, validated, and tested on authentic, verified datasets sourced from verified repositories. No synthetic placeholder data or fabricated metrics have been used.