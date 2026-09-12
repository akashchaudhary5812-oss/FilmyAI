# FILMY AI — Machine Learning Engine

> **AI-Powered Film Commercial Potential, Rating & Success Estimation Platform**  
> *Module: Core Machine Learning Engine (`ML/`)*

---

## 1. System Overview

The **FILMY AI ML Engine** is a production-ready, scientifically validated machine learning system designed to estimate the commercial viability, success category (`Flop`, `Average`, `Hit`, `Super Hit`), and continuous commercial potential rating of films based strictly on pre-release metadata (genre composition, lead cast star power, director track record, budget, release calendar timing, and historical trajectory).

### Key Architectural Highlights:
- **Zero Future Data Leakage:** All actor and director historical career track records and genre averages are strictly evaluated on prior chronological timelines ($t < t_{\text{release}}$).
- **Temporal Holdout Evaluation:** Models are trained on historical films ($\le 2010$), validated on intermediate years ($2011–2012$), and evaluated on future holdout releases ($2013–2014$).
- **Defensible Target Design:** Targets are derived directly from verified box-office performance ratings and financial ROI distributions.
- **Dual Prediction Modality:** Simultaneous multi-class classification (calibrated success probabilities) and continuous commercial rating estimation ($1.0$ to $9.0$).

---

## 2. Directory Structure

```
ML/
├── config.yaml                       # Global configuration, temporal split parameters, paths
├── requirements.txt                  # Pinned dependencies
├── README.md                         # Documentation & architectural report
├── data/
│   ├── raw/                          # Downloaded datasets from Kaggle
│   │   ├── bollywood_movies/         # Details, Actor Rankings, Director Rankings
│   │   ├── bollywood_actress/        # Detailed metadata
│   │   └── imdb_ott/                 # Multi-platform OTT & Box Office metrics
│   ├── interim/                      # Cleaned and entity-resolved parquet tables
│   └── processed/                    # Leak-free feature-engineered temporal matrices
├── notebooks/
│   ├── 01_dataset_audit.ipynb        # Programmatic schema & missingness audit
│   ├── 02_eda.ipynb                  # Exploratory data analysis & target distributions
│   └── 03_model_experiments.ipynb    # Model training, benchmarking & SHAP evaluation
├── src/
│   ├── data/
│   │   ├── download.py               # Kagglehub dataset downloader
│   │   ├── load.py                   # Multi-CSV loader & encoding resolver
│   │   ├── clean.py                  # Normalization, date parsing, deduplication
│   │   ├── merge.py                  # Entity resolution, star power lookup, target creation
│   │   └── audit.py                  # Automated dataset audit report generator
│   ├── features/
│   │   ├── movie_features.py         # Metadata, sequel, writer, and budget features
│   │   ├── cast_features.py          # Star ratings & leak-free prior actor success rates
│   │   ├── director_features.py      # Director ratings & prior career success rates
│   │   ├── genre_features.py         # Multi-hot genre tokens & primary genre
│   │   ├── temporal_features.py      # Release year normalization, seasonality, Q4 festive flags
│   │   └── pipeline.py               # Feature pipeline assembly & temporal splitting
│   ├── models/
│   │   ├── baseline.py               # Dummy classifiers, Logistic Regression, Ridge
│   │   ├── classification.py         # Random Forest, HistGradientBoosting, XGBoost, LightGBM
│   │   ├── regression.py             # Random Forest, Gradient Boosting, XGBoost Regressors
│   │   ├── evaluation.py             # Accuracy, Balanced Acc, F1-macro/weighted, ROC-AUC, MAE, RMSE, R²
│   │   └── explainability.py         # Permutation importance, SHAP summary plots
│   ├── training/
│   │   ├── train.py                  # Pipeline execution
│   │   ├── tune.py                   # TimeSeriesSplit RandomizedSearchCV hyperparameter tuning
│   │   └── experiment.py             # Benchmark comparison & report generation
│   ├── inference/
│   │   └── predict.py                # FilmyAIPredictor production inference interface
│   └── utils/
│       ├── config.py                 # YAML config loader
│       ├── logging.py                # Structured logger
│       ├── helpers.py                # Random seed manager & Joblib serializers
│       └── generate_notebooks.py     # Interactive notebook generator
├── models/
│   ├── classification/               # Champion classifier (.joblib)
│   ├── regression/                   # Champion regressor (.joblib)
│   ├── preprocessors/                # Feature scalers & column lists (.joblib)
│   └── model_metadata.json           # Serialized metrics, hyperparameters & split verification
├── reports/
│   ├── dataset_audit/                # dataset_audit_report.md
│   ├── experiments/                  # model_comparison_report.md
│   └── final/                        # final_evaluation_report.md, SHAP & feature importance charts
└── tests/
    ├── test_data_pipeline.py         # Data loader & cleaning unit tests
    ├── test_features.py              # Zero-leakage temporal feature unit tests
    └── test_inference.py             # Inference API & schema compliance unit tests
```

---

## 3. Data Auditing & Safe Entity Merging

The ML Engine integrates 3 core datasets:
1. **Bollywood Movie Details (`BollywoodMovieDetail.csv`)**: 1,284 films with genre, actors, directors, writers, sequel flags, and ground-truth commercial success scale (`1` to `9`).
2. **Actor & Director Rankings (`BollywoodActorRanking.csv`, `BollywoodDirectorRanking.csv`)**: 301 actors and 118 directors with normalized star power ratings, Google search popularity hits, and historical movie counts.
3. **IMDb & OTT Financials (`Final Bollywood.csv`, `Final Hollywood.csv`, `Netflix.csv`, etc.)**: Financial budget and box office collection records.

### Target Formulation
- **Classification Target:** Standard 4-tier commercial categorization:
  - `Flop` (Class 0): Raw score 1–2 (Disaster / Below Average) ~76.8% of historical releases
  - `Average` (Class 1): Raw score 3–4 (Average / Semi-Hit) ~9.6%
  - `Hit` (Class 2): Raw score 5–6 (Hit / Super Hit) ~9.5%
  - `Super Hit` (Class 3): Raw score 7–9 (Blockbuster / All-Time Blockbuster) ~4.1%
- **Regression Target:** Continuous rating score ($1.0$ to $9.0$) reflecting overall theatrical box office impact.

---

## 4. Leakage Prevention Audit

| Feature Category | Features | Pre / Post Release | Engine Status | Rationale |
|---|---|---|---|---|
| **Metadata** | `genre_*`, `is_sequel`, `release_year_norm`, `is_q4`, `title_word_count`, `log_budget_usd` | PRE-RELEASE | **INCLUDED** | Determinable prior to theatrical launch. |
| **Cast & Crew Star Power** | `lead_actor_rating`, `avg_cast_rating`, `cast_google_hits`, `director_rating` | PRE-RELEASE (Historical) | **INCLUDED** | Established career star ratings before release. |
| **Prior Track Record** | `lead_actor_prior_success_rate`, `director_prior_success_rate` | PRE-RELEASE (Chronological $t < t_0$) | **INCLUDED** | Calculated exclusively on films released before the current release year. |
| **Post-Release Metrics** | Post-theatrical IMDb vote count, lifetime reviews, final gross | POST-RELEASE | **STRICTLY EXCLUDED** | Unobserved prior to movie debut. |

---

## 5. Model Benchmark & Evaluation Summary

### Classification Results (Validation Set 2011–2012)
| Model | Accuracy | Balanced Accuracy | F1 Weighted | ROC-AUC (OVR) |
|---|---|---|---|---|
| **Majority Baseline** | 75.83% | 25.00% | 65.41% | N/A |
| **Random Baseline** | 27.01% | 31.27% | 32.76% | N/A |
| **Logistic Regression (Class Weighted)** | **82.94%** | **63.92%** | **82.56%** | **0.8834** |
| **HistGradientBoosting (Balanced)** | 80.09% | 39.78% | 75.74% | 0.8120 |
| **LightGBM (Balanced)** | 80.09% | 42.79% | 76.07% | 0.8245 |
| **XGBoost Classifier** | 79.15% | 35.80% | 73.67% | 0.8312 |
| **Tuned XGBoost** | 79.62% | 38.10% | 74.50% | 0.8401 |

### Regression Results (Validation Set 2011–2012)
| Model | MAE | RMSE | R² Score |
|---|---|---|---|
| **Mean Baseline** | 1.5031 | 1.9900 | -0.0026 |
| **Linear Regression** | 0.9459 | 1.4097 | 0.4968 |
| **Ridge Regression** | 0.9315 | 1.3937 | 0.5082 |
| **Random Forest Regressor** | 0.8692 | 1.3838 | 0.5152 |
| **Gradient Boosting Regressor** | 0.8631 | 1.3815 | 0.5168 |
| **XGBoost Regressor (Champion)** | **0.8236** | **1.3225** | **0.5572** |

### Final Holdout Test Set Performance (2013–2014 Unseen Future Films)
- **Classification F1-Weighted:** `0.6935` | **Accuracy:** `69.34%` | **ROC-AUC (OVR):** `0.7511`
- **Regression MAE:** `1.0295` | **RMSE:** `1.5562` | **R² Score:** `0.3492`

---

## 6. Top Explainability Drivers (SHAP & Permutation Analysis)

1. **Lead Actor Star Score (`lead_actor_rating`)**: Dominant positive driver of opening momentum.
2. **Director Historical Track Record (`director_rating` & `director_composite_score`)**: Differentiates high-quality commercial hits from average releases.
3. **Average Cast Strength (`avg_cast_rating`)**: Ensemble cast quality provides downside protection.
4. **Franchise / Sequel Status (`is_sequel`)**: Raises the baseline commercial return floor.
5. **Festive Timing (`is_q4` / Holiday Season)**: Q4 holiday / festival releases experience elevated theatrical multiplier.

---

## 7. How to Run the Pipeline

### 1. Install Dependencies
```bash
pip install -r ML/requirements.txt
```

### 2. Download and Clean Data
```bash
python -m ML.src.data.download
python -m ML.src.data.clean
python -m ML.src.data.merge
python -m ML.src.data.audit
```

### 3. Run Feature Pipeline
```bash
python -m ML.src.features.pipeline
```

### 4. Run Model Training, Tuning & Evaluation
```bash
python -m ML.src.training.experiment
python -m ML.src.models.explainability
```

### 5. Run Automated Tests
```bash
python -m pytest ML/tests/ -v
```

### 6. Run Inference
```bash
python -m ML.src.inference.predict --sample
```

---

## 8. Python Inference API Contract

```python
from ML.src.inference.predict import FilmyAIPredictor

predictor = FilmyAIPredictor()

payload = {
    "title": "Dangal 2",
    "genre": "Biography, Drama, Sport",
    "actors": ["Aamir Khan", "Fatima Sana Shaikh", "Sanya Malhotra"],
    "director": "Nitesh Tiwari",
    "budget": 70000000,
    "release_year": 2026,
    "release_month": 12,
    "is_sequel": 1
}

result = predictor.predict(payload)
print(result)
```

**Output Schema:**
```json
{
  "title": "Dangal 2",
  "predicted_class": "Super Hit",
  "predicted_class_code": 3,
  "success_probability": 0.9727,
  "confidence": 0.9205,
  "predicted_commercial_score": 5.73,
  "commercial_score_scale": "1.0 (Disaster) to 9.0 (Historic Blockbuster)",
  "class_probabilities": {
    "Flop": 0.0266,
    "Average": 0.0008,
    "Hit": 0.0522,
    "Super Hit": 0.9205
  },
  "important_factors": [
    {
      "factor": "Lead Actor Star Power",
      "impact": "High positive impact from lead star power (rating: 10.0/10)"
    },
    {
      "factor": "Established Franchise / Sequel",
      "impact": "Pre-existing brand recognition provides stronger commercial floor"
    },
    {
      "factor": "Festive / Holiday Release Window",
      "impact": "Q4 release window historically boosts footfall"
    }
  ],
  "model_version": "1.0.0-filmyai-ml"
}
```

---

## 9. Real-World Limitations & Scientific Disclosures

1. **Macro Market Shifts:** Post-2020 post-pandemic viewing habits and OTT day-and-date changes create domain distribution shifts relative to 2001–2014 theatrical baselines.
2. **Unobserved Production Variables:** Script quality, music chart performance, marketing ad-spend, and competitor clash dates are unobserved in purely tabular metadata and can alter opening weekend outcomes.
3. **Probability Calibration:** Predictions should be interpreted as risk profiles and commercial potential bands rather than deterministic financial guarantees.
