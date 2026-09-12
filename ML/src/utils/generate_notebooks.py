import json
from pathlib import Path

def make_nb(cells):
    return {
        "cells": cells,
        "metadata": {
            "language_info": {"name": "python"}
        },
        "nbformat": 4,
        "nbformat_minor": 2
    }

def code_cell(source):
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in source.split("\n")]
    }

def md_cell(source):
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in source.split("\n")]
    }

def generate_all_notebooks():
    nb_dir = Path("ML/notebooks")
    nb_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Dataset Audit Notebook
    nb1 = make_nb([
        md_cell("# 01 — FilmyAI Dataset Audit & Schema Inspection\nProgrammatic inspection of raw datasets from Kaggle."),
        code_cell("import pandas as pd\nfrom ML.src.data.load import load_raw_csv_files\ndfs = load_raw_csv_files()\nfor name, df in dfs.items():\n    print(name, df.shape)"),
        code_cell("from ML.src.data.audit import generate_dataset_audit\naudit_md = generate_dataset_audit()")
    ])

    # 2. EDA Notebook
    nb2 = make_nb([
        md_cell("# 02 — Exploratory Data Analysis & Target Distributions\nAnalyzing commercial classifications, star power correlation, and temporal patterns."),
        code_cell("import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\nfrom ML.src.utils.config import get_project_root\n\nroot = get_project_root()\ndf = pd.read_parquet(root / 'data' / 'interim' / 'unified_movie_dataset.parquet')\nprint(df.info())\nprint(df['commercial_class_name'].value_counts())"),
        code_cell("plt.figure(figsize=(8, 4))\ndf['commercial_class_name'].value_counts().plot(kind='bar', color='teal')\nplt.title('Distribution of Commercial Success Categories')\nplt.show()")
    ])

    # 3. Model Experiments Notebook
    nb3 = make_nb([
        md_cell("# 03 — Model Experiments, Benchmarking & Explainability\nTraining baselines vs advanced models and evaluating on holdout test set."),
        code_cell("from ML.src.training.experiment import run_all_experiments\nresults = run_all_experiments()"),
        code_cell("from ML.src.inference.predict import FilmyAIPredictor\npredictor = FilmyAIPredictor()\nout = predictor.predict({'title': 'Brahmastra 2', 'genre': 'Action, Fantasy', 'actors': ['Ranbir Kapoor', 'Alia Bhatt'], 'director': 'Ayan Mukerji'})\nprint(out)")
    ])

    (nb_dir / "01_dataset_audit.ipynb").write_text(json.dumps(nb1, indent=2), encoding="utf-8")
    (nb_dir / "02_eda.ipynb").write_text(json.dumps(nb2, indent=2), encoding="utf-8")
    (nb_dir / "03_model_experiments.ipynb").write_text(json.dumps(nb3, indent=2), encoding="utf-8")
    print("All notebooks created successfully.")

if __name__ == "__main__":
    generate_all_notebooks()
