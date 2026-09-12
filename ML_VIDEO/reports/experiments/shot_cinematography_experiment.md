# FilmyAI Video & Cinematography Intelligence — Training Proof & Experiment Report

## 1. Experiment Overview
- **Model Architecture:** `CinematicShotCNN` (Deep Vision Feature Extractor + Convolutional Blocks + Classifier)
- **Target Task:** Cinematographic Shot Scale Classification (8 real film classes)
- **Dataset:** `szymonrucinski/types-of-film-shots` (Real curated film frames & human annotations)
- **Training Samples:** `604` (19 batches, batch_size=32)
- **Validation Samples:** `129` (5 batches)
- **Holdout Test Samples:** `130` (5 batches)
- **Epochs:** `10`
- **Training Duration:** `210.85` seconds
- **Hardware Used:** `CPU (Host: AMD64 Family 23 Model 160 Stepping 0, AuthenticAMD)`
- **Checkpoint Location:** `C:/Users/Akash/Desktop/FilmyAI/ML_VIDEO/models/checkpoints/best_cinematic_shot_model.pt`

---

## 2. Epoch-by-Epoch Training & Validation Loss Progression

|   Epoch |   Train Loss | Train Acc   |   Val Loss | Val Acc   |
|---------|--------------|-------------|------------|-----------|
|       1 |       1.9975 | 22.35%      |     1.9394 | 31.01%    |
|       2 |       1.8081 | 27.48%      |     1.8869 | 28.68%    |
|       3 |       1.7764 | 29.80%      |     1.7865 | 30.23%    |
|       4 |       1.7176 | 31.13%      |     1.7415 | 27.13%    |
|       5 |       1.6282 | 34.60%      |     1.862  | 31.01%    |
|       6 |       1.5882 | 38.74%      |     1.6615 | 34.88%    |
|       7 |       1.5124 | 37.58%      |     1.6548 | 35.66%    |
|       8 |       1.475  | 37.91%      |     1.5735 | 35.66%    |
|       9 |       1.4489 | 41.06%      |     1.6053 | 35.66%    |
|      10 |       1.4339 | 42.38%      |     1.602  | 37.21%    |

- **Initial Train Loss:** `1.9975`
- **Final Train Loss:** `1.4339` (Demonstrates real loss convergence)
- **Best Validation Accuracy:** `37.21%`

---

## 3. Final Holdout Test Set Performance (Unseen Real Test Samples)

- **Test Top-1 Accuracy:** `40.77%`
- **Test Top-2 Accuracy:** `55.38%`
- **Precision (Macro):** `0.3326`
- **Recall (Macro):** `0.3390`
- **F1-Score (Weighted):** `0.3854`
- **F1-Score (Macro):** `0.3261`

### Test Confusion Matrix:
```
[[ 8  0  0  0  0  7  5]
 [ 3  0  2  0  0  1  2]
 [ 1  0 10  1  5  1  3]
 [ 0  0  4  1  3  1  3]
 [ 0  0  3  2  6  0  3]
 [ 1  0  1  0  1  9 11]
 [ 1  0  3  1  5  3 19]]
```

---

## 4. Real Test Sample Inference Proof (Trained Model -> Real Unseen Film Frame)

|   Sample # | Ground Truth      | Predicted Class   | Confidence   | Match   |
|------------|-------------------|-------------------|--------------|---------|
|          1 | `extremeLongShot` | `longShot`        | 29.97%       | NO      |
|          2 | `mediumShot`      | `mediumShot`      | 53.88%       | YES     |
|          3 | `extremeLongShot` | `extremeLongShot` | 30.99%       | YES     |
|          4 | `detail`          | `extremeLongShot` | 30.58%       | NO      |
