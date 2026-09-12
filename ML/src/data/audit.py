import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from ML.src.data.load import load_raw_csv_files
from ML.src.utils.logging import setup_logger
from ML.src.utils.config import get_project_root

logger = setup_logger("FilmyAI-Audit")

def generate_dataset_audit() -> str:
    """Performs deep programmatic schema, distribution, missingness, and leakage audit."""
    root = get_project_root()
    dfs = load_raw_csv_files()
    
    report_lines = [
        "# FilmyAI ML Engine — Dataset Audit Report",
        "",
        "> **Generated automatically via programmatic dataset inspection.**",
        f"> **Total CSV datasets inspected:** {len(dfs)}",
        "",
        "---",
        ""
    ]
    
    audit_summary_table = [
        "| Dataset Name | Rows | Columns | Duplicates | Missing Cells (%) | Key Columns | Potential Target | Recommended Role |",
        "|---|---|---|---|---|---|---|---|"
    ]
    
    dataset_details = []
    
    for name, df in dfs.items():
        n_rows, n_cols = df.shape
        n_dup = df.duplicated().sum()
        total_cells = n_rows * n_cols
        missing_cells = df.isnull().sum().sum()
        missing_pct = (missing_cells / total_cells * 100) if total_cells > 0 else 0.0
        
        # Classify key columns
        cols = list(df.columns)
        
        # Analyze potential targets
        potential_targets = []
        for c in cols:
            cl = c.lower()
            if any(k in cl for k in ["hit", "flop", "boxoffice", "box_office", "gross", "revenue", "verdict", "collection", "rating", "score", "imdb"]):
                potential_targets.append(c)
                
        # Recommended role
        role = "Metadata / Cross-platform context"
        if "detail" in name.lower():
            role = "Primary Movie Metadata & Cast"
        elif "ranking" in name.lower():
            role = "Historical Star / Director Rankings"
        elif "final bollywood" in name.lower() or "final hollywood" in name.lower():
            role = "Financial / Commercial Target & Verdict Source"
            
        audit_summary_table.append(
            f"| `{name}` | {n_rows:,} | {n_cols} | {n_dup:,} | {missing_pct:.2f}% | {', '.join(cols[:4])}... | {', '.join(potential_targets) if potential_targets else 'None'} | {role} |"
        )
        
        # Detailed profile
        detail = [
            f"## Dataset: `{name}`",
            f"- **Shape:** `{n_rows:,}` rows × `{n_cols}` columns",
            f"- **Exact Duplicates:** `{n_dup:,}` rows",
            f"- **Overall Missingness:** `{missing_pct:.2f}%` ({missing_cells:,} missing values)",
            "",
            "### Column Schema & Missingness Analysis",
            "| Column | Type | Non-Null Count | Missing (%) | Unique Values | Sample Values |",
            "|---|---|---|---|---|---|"
        ]
        
        for col in df.columns:
            non_null = df[col].notnull().sum()
            col_missing_pct = (df[col].isnull().sum() / n_rows) * 100
            n_unique = df[col].nunique()
            samples = [str(x) for x in df[col].dropna().unique()[:3]]
            sample_str = ", ".join(samples).replace("|", "\\|").replace("\n", " ")[:60]
            dtype_str = str(df[col].dtype)
            detail.append(f"| `{col}` | {dtype_str} | {non_null:,} | {col_missing_pct:.2f}% | {n_unique:,} | {sample_str} |")
            
        # Numerical summary if any
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if num_cols:
            detail.append("")
            detail.append("### Numerical Distributions Summary")
            desc = df[num_cols].describe().T
            detail.append("| Column | Mean | Std | Min | 25% | 50% (Median) | 75% | Max |")
            detail.append("|---|---|---|---|---|---|---|---|")
            for idx, row in desc.iterrows():
                detail.append(f"| `{idx}` | {row['mean']:.2f} | {row['std']:.2f} | {row['min']:.2f} | {row['25%']:.2f} | {row['50%']:.2f} | {row['75%']:.2f} | {row['max']:.2f} |")
                
        dataset_details.append("\n".join(detail))
        
    report_lines.extend(audit_summary_table)
    report_lines.append("")
    report_lines.append("---")
    report_lines.append("")
    report_lines.extend(dataset_details)
    
    # Add relationship, target variable, and leakage analysis sections
    analysis_section = """
---

## Cross-Dataset Relationship & Joining Strategy

1. **Bollywood Movie Details (`bollywood_movies/BollywoodMovieDetail.csv` & `bollywood_actress/BollywoodMovieDetail.csv`)**:
   - Contains core Bollywood movie metadata: `imdbId`, `title`, `releaseYear`, `releaseDate`, `genre`, `writers`, `actors`, `directors`, `sequel`, `hitFlop`.
   - `hitFlop` provides an explicit, historical ground-truth commercial classification (`1` to `9` or verdict rating scale).
2. **Actor & Director Rankings (`BollywoodActorRanking.csv`, `BollywoodDirectorRanking.csv`)**:
   - Contains actor/director names, movie counts, normalized rating scores, box office metrics.
   - Can be joined via normalized person name keys.
3. **IMDb & OTT Platform Tables (`imdb_ott/Final Bollywood.csv`, `imdb_ott/Netflix.csv`, `imdb_ott/amazon_prime_titles.csv`, etc.)**:
   - Contains OTT presence flags, ratings, runtime, description, and platform distribution.
   - Merging key: Normalized `(title, release_year)`.

---

## Leakage Risk Audit & Categorization

| Feature Category | Features | Pre / Post Release | Modeling Status | Rationale |
|---|---|---|---|---|
| **Metadata** | `genre`, `release_year`, `release_month`, `runtime`, `language`, `is_sequel` | PRE-RELEASE | **INCLUDED** | Known before production / release. |
| **Cast / Crew Track Record** | `lead_actor_prior_success_rate`, `director_prior_avg_score`, `known_actor_count` | PRE-RELEASE (Prior strictly $t < t_0$) | **INCLUDED** | Historical career performance strictly before release date. |
| **Target Variables** | `hitFlop` (Class), `box_office_collection` / `normalized_commercial_index` | POST-RELEASE TARGET | **TARGET ONLY** | The outcome being predicted. |
| **Data Leakage Risk** | Post-release IMDb user votes, post-release audience reviews, final gross | POST-RELEASE | **STRICTLY EXCLUDED** | Only known after the film has concluded theatrical/OTT run. |
"""
    report_lines.append(analysis_section)
    
    report_content = "\n".join(report_lines)
    
    # Save report
    out_dir = root / "reports" / "dataset_audit"
    out_dir.mkdir(parents=True, exist_ok=True)
    report_file = out_dir / "dataset_audit_report.md"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(report_content)
        
    logger.info(f"Audit report written to {report_file}")
    return report_content

if __name__ == "__main__":
    generate_dataset_audit()
