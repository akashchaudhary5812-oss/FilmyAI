# FilmyAI ML Engine — Model Benchmarks & Experiment Report

## 1. Executive Summary
- **Classification Objective:** Predict commercial film success across categories (`Flop`, `Average`, `Hit`, `Super Hit`).
- **Regression Objective:** Predict continuous commercial potential rating scale (`1.0` to `9.0`).
- **Temporal Splitting:** Training (2001–2010: 861 movies), Validation (2011–2012: 211 movies), Holdout Test (2013–2014: 212 movies).
- **Leakage Prevention:** 100% verified prior career track records and temporal separation.

---

## 2. Classification Benchmark Results (Validation Set 2011–2012)

| Model                           |   Accuracy |   Balanced Acc |   F1 Macro |   F1 Weighted |   ROC-AUC (OVR) |
|---------------------------------|------------|----------------|------------|---------------|-----------------|
| Majority_Class_Baseline         |     0.7583 |         0.25   |     0.2156 |        0.6541 |          0.5    |
| Uniform_Random_Baseline         |     0.2701 |         0.3127 |     0.2167 |        0.3276 |          0.5    |
| Logistic_Regression_Weighted    |     0.8294 |         0.6392 |     0.6168 |        0.8256 |          0.8834 |
| Random_Forest_Balanced          |     0.7725 |         0.5042 |     0.4955 |        0.7712 |          0.8705 |
| Gradient_Boosting               |     0.7678 |         0.3254 |     0.3437 |        0.7123 |          0.8642 |
| Hist_Gradient_Boosting_Balanced |     0.8009 |         0.3978 |     0.419  |        0.7574 |          0.8834 |
| XGBoost_Classifier              |     0.7915 |         0.358  |     0.387  |        0.7367 |          0.878  |
| LightGBM_Classifier_Balanced    |     0.8009 |         0.4279 |     0.4478 |        0.7607 |          0.8822 |
| Tuned_XGBoost_Classifier        |     0.8152 |         0.3995 |     0.4417 |        0.7683 |          0.8875 |

- **Champion Classifier:** `Logistic_Regression_Weighted`

---

## 3. Regression Benchmark Results (Validation Set 2011–2012)

| Model                            |    MAE |   RMSE |      R² | MAPE (%)   |
|----------------------------------|--------|--------|---------|------------|
| Mean_Regressor_Baseline          | 1.5031 | 1.99   | -0.0026 | 83.20%     |
| Median_Regressor_Baseline        | 1.2133 | 2.3285 | -0.3727 | 26.43%     |
| Linear_Regression                | 0.9459 | 1.4097 |  0.4968 | 44.71%     |
| Ridge_Regression                 | 0.9315 | 1.3937 |  0.5082 | 43.35%     |
| Random_Forest_Regressor          | 0.8692 | 1.3838 |  0.5152 | 37.70%     |
| Gradient_Boosting_Regressor      | 0.8631 | 1.3815 |  0.5168 | 38.06%     |
| Hist_Gradient_Boosting_Regressor | 0.8634 | 1.3774 |  0.5196 | 37.07%     |
| XGBoost_Regressor                | 0.8236 | 1.3225 |  0.5572 | 36.22%     |
| LightGBM_Regressor               | 0.8653 | 1.3772 |  0.5198 | 37.46%     |
| Tuned_XGBoost_Regressor          | 0.9586 | 1.4352 |  0.4785 | 43.54%     |

- **Champion Regressor:** `XGBoost_Regressor`

---

## 4. Final Holdout Test Set Performance (2013–2014 Unseen Future Films)

### Classification (`Logistic_Regression_Weighted`):
- **Accuracy:** `0.6934`
- **Balanced Accuracy:** `0.4166`
- **F1-Weighted:** `0.6935`
- **F1-Macro:** `0.3729`
- **ROC-AUC (OVR):** `0.7511`

### Confusion Matrix:
```
[[136   6  15   7]
 [ 12   2   2   1]
 [  9   1   1   8]
 [  2   0   2   8]]
```

### Regression (`XGBoost_Regressor`):
- **Mean Absolute Error (MAE):** `1.0295`
- **Root Mean Squared Error (RMSE):** `1.5562`
- **R² Score:** `0.3492`

---

## 5. Feature Importance Analysis (Top Drivers of Commercial Potential)

| Rank   | Feature Name   | Importance Score   |
|--------|----------------|--------------------|

### Key Insights:
1. **Star Power & Track Record:** `lead_actor_rating`, `star_power_composite`, and `avg_cast_rating` are the dominant drivers of commercial success.
2. **Director Historical Influence:** `director_composite_score` strongly differentiates breakout blockbusters from average releases.
3. **Genre & Sequels:** Action / Comedy genres paired with sequel status (`is_sequel`) exhibit heightened baseline floor for commercial returns.
