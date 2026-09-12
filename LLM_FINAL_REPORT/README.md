# FILMY AI — Studio Intelligence & LLM Report Layer (`LLM_FINAL_REPORT`)

`LLM_FINAL_REPORT` is the dedicated integration, intelligence synthesis, and executive report generation layer for **FILMY AI**.

It connects the two underlying machine learning systems:
1. **`ML/`**: Production Box Office & Commercial Success Prediction Engine (`FilmyAIPredictor`).
2. **`ML_VIDEO/`**: Multimodal Film, Cinematography, Shot Scale, and Acoustic Engine (`FilmyAIVideoEngine`).

---

## 🏗️ System Architecture

```
FilmyAI/
├── ML/                         # Existing Commercial / Box Office Predictor
├── ML_VIDEO/                   # Existing Multimodal Cinematography & Video Engine
├── Backend/                    # Node.js Express API & MongoDB backend
└── LLM_FINAL_REPORT/           # Dedicated Integration & Studio Report Layer
    ├── config.py               # Auto-loads GROQ_API_KEY from Backend/.env or OS environment
    ├── pipeline.py             # 17-step end-to-end Master Orchestrator
    ├── api.py                  # FastAPI REST Service for backend invocation
    ├── cli.py                  # CLI interface for sample or customized runs
    ├── requirements.txt        # Production dependencies
    ├── schemas/
    │   ├── input_schema.py     # FilmInputRequest (supports camelCase and snake_case)
    │   ├── evidence_schema.py  # Normalized evidence representation
    │   └── report_schema.py    # Validated studio intelligence report schema
    ├── connectors/
    │   ├── commercial_model_connector.py  # Safe ML model connector (zero code changes to ML/)
    │   └── video_engine_connector.py      # Safe ML_VIDEO engine connector (zero code changes to ML_VIDEO/)
    ├── core/
    │   ├── script_summary_manager.py      # Strict priority resolution (Cases 1-4)
    │   ├── evidence_normalizer.py         # Merges multimodal intelligence
    │   └── groq_analyzer.py               # Groq LLM client (with schema validation & fallbacks)
    ├── pdf_generator/
    │   ├── styles.py           # ReportLab typography, color palette & NumberedCanvas
    │   └── report_builder.py   # Multi-page executive studio PDF report builder
    └── tests/
        ├── test_script_priority.py        # Validates Case 1-4 precedence
        ├── test_connectors.py             # Validates ML and ML_VIDEO connectors
        └── test_pipeline.py               # Validates end-to-end JSON and PDF generation
```

---

## ⚡ 17-Step End-to-End Data Pipeline

1. **Receive Film Information**: Parses incoming metadata (Title, Director, Star Cast, Production Houses, Budget, Genre, Sequel status, Release timing).
2. **Receive Video Target**: Resolves local video file path or downloads remote video URL (e.g. from ImageKit / CDN).
3. **Call ML_VIDEO**: Dispatches the actual video to `FilmyAIVideoEngine`.
4. **Receive ML_VIDEO Analysis**: Captures shot scales, scene cuts, pacing rhythm, lighting profiles, rule of thirds, acoustic speech modes, and keyframes.
5. **Check User Script**: Assesses if screenplay/script was provided.
6. **Check User Summary**: Assesses if film synopsis/logline was provided.
7. **Generate Missing Story Information**: Applies strict priority logic (Cases 1–4) without ever overriding user-supplied data.
8. **Prepare Commercial Input**: Formats only genuine, supported features for the ML model.
9. **Call ML**: Dispatches payload to `FilmyAIPredictor`.
10. **Collect Results**: Aggregates predictions, class probabilities, and contributing factors.
11. **Normalize Evidence**: Unifies multimodal findings into `NormalizedEvidence`.
12. **Send to Groq LLM**: Dispatches structured prompt to Groq API (`llama-3.3-70b-versatile`).
13. **Generate Structured Report**: Produces deep cinematic and commercial studio analysis.
14. **Validate Response**: Enforces strict Pydantic schema validation.
15. **Generate PDF**: Compiles multi-page executive PDF with scorecards, tables, and highlights.
16. **Save Artifacts**: Writes `<film_name>_<timestamp>_report.json` and `.pdf` to `generated_reports/`.
17. **Return Final Result**: Returns structured report object and file paths to caller.

---

## 📜 Strict Script & Summary Priority Logic

| Case | User Script | User Summary | Script Outcome | Summary Outcome | Provenance Tag |
|---|---|---|---|---|---|
| **Case 1** | PROVIDED | PROVIDED | Preserved User Script | Preserved User Summary | `USER_PROVIDED` (Both) |
| **Case 2** | PROVIDED | MISSING | Preserved User Script | AI-Generated from Video & Script | `USER_PROVIDED` (Script) / `AI_GENERATED` (Summary) |
| **Case 3** | MISSING | PROVIDED | AI-Generated Sequence Context | Preserved User Summary | `AI_GENERATED` (Script) / `USER_PROVIDED` (Summary) |
| **Case 4** | MISSING | MISSING | AI-Generated Sequence Context | AI-Generated from Video | `AI_GENERATED` (Both) |

---

## 🚀 How to Run

### 1. Run CLI Sample Run
```bash
python -m LLM_FINAL_REPORT.cli --sample
```

### 2. Run CLI with Custom Film
```bash
python -m LLM_FINAL_REPORT.cli \
  --title "Kalki 2898 AD - Part 2" \
  --director "Nag Ashwin" \
  --actors "Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone" \
  --budget 75000000 \
  --genre "Sci-Fi, Action" \
  --year 2026 \
  --month 5 \
  --sequel \
  --summary "The prophesied Kalki avatar rises against the supreme complex in a post-apocalyptic world."
```

### 3. Start the FastAPI Service (for Backend integration)
```bash
python -m LLM_FINAL_REPORT.api
```
The interactive Swagger API docs will be available at: `http://localhost:8000/docs`

### 4. Run Test Suite
```bash
pytest LLM_FINAL_REPORT/tests -v
```
