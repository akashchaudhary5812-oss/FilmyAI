import re
import pandas as pd
import numpy as np

def extract_movie_metadata_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts core movie metadata features (sequel, writers, title characteristics, budget flags).
    """
    res = pd.DataFrame(index=df.index)
    
    # Sequel flag
    res["is_sequel"] = df["is_sequel"].fillna(0).astype(int)
    
    # Title features
    titles = df["clean_title"].fillna("").astype(str)
    res["title_char_length"] = titles.apply(len)
    res["title_word_count"] = titles.apply(lambda t: len(t.split()))
    
    # Writers features
    writers = df["clean_writers"].fillna("").astype(str)
    res["writer_count"] = writers.apply(lambda w: len([x for x in re.split(r'[,|]', w) if x.strip()]))
    res["has_known_writers"] = (res["writer_count"] > 0).astype(int)
    
    # Financial indicators (pre-release estimated budget)
    budgets = df["budget_usd"].fillna(0.0).astype(float)
    res["has_budget_info"] = (budgets > 0).astype(int)
    res["log_budget_usd"] = np.log1p(budgets)
    
    return res
