import pytest
import pandas as pd
from pathlib import Path
from ML.src.data.load import load_raw_csv_files
from ML.src.data.clean import clean_bollywood_movie_details, clean_rankings, normalize_title, parse_release_date

def test_raw_files_exist():
    dfs = load_raw_csv_files()
    assert len(dfs) >= 3
    assert "bollywood_movies/BollywoodMovieDetail.csv" in dfs

def test_string_normalization():
    assert normalize_title("3 Idiots (2009)!") == "3idiots2009"
    assert normalize_title("Dilwale Dulhania Le Jayenge") == "dilwaledulhanialejayenge"
    assert normalize_title("") == ""

def test_release_date_parsing():
    y, m, d = parse_release_date("25 Dec 2016")
    assert y == 2016
    assert m == 12
    assert d == 25
    
    y2, _, _ = parse_release_date("2008")
    assert y2 == 2008

def test_cleaning_bollywood_movie_details():
    dfs = load_raw_csv_files()
    raw_bmd = dfs["bollywood_movies/BollywoodMovieDetail.csv"]
    clean_bmd = clean_bollywood_movie_details(raw_bmd)
    
    assert len(clean_bmd) > 0
    assert "norm_title" in clean_bmd.columns
    assert "release_year" in clean_bmd.columns
    assert clean_bmd["raw_hit_flop"].min() >= 1
    assert clean_bmd["raw_hit_flop"].max() <= 9
