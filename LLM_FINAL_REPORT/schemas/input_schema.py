"""
Input Request Schema for FilmyAI Final Report Pipeline.
Supports both camelCase/PascalCase (from Node Backend) and snake_case inputs.
"""
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


class FilmInputRequest(BaseModel):
    """
    Normalized Input Schema for film analysis and final intelligence report generation.
    """
    # Primary identifiers
    film_id: Optional[str] = Field(None, alias="film_id", description="Unique film ID (MongoDB or UUID)")
    title: str = Field(..., alias="FilmName", description="Film title")
    video_url: Optional[str] = Field(None, alias="uploadFilm", description="URL or local path to video file")
    video_path: Optional[str] = Field(None, description="Local absolute or relative path to video file")
    
    # Film Metadata
    director: str = Field("Unknown Director", alias="DirectorName", description="Director name")
    actors: List[str] = Field(default_factory=list, alias="Casting", description="List or comma-separated string of actors")
    production_houses: List[str] = Field(default_factory=list, alias="ProductionHouses", description="Production companies")
    budget: float = Field(0.0, alias="Budget", description="Film budget in USD (or raw numeric string)")
    genre: str = Field("Drama", alias="Genre", description="Film genre(s)")
    release_year: int = Field(2025, description="Expected or actual release year")
    release_month: int = Field(6, description="Release month (1-12)")
    is_sequel: bool = Field(False, description="Whether the film is a sequel/franchise entry")
    writers: List[str] = Field(default_factory=list, description="List of screenwriters/story writers")
    
    # Media Assets & Cast Reference Photos
    banner_image: Optional[str] = Field(None, alias="bannerImage", description="Film banner image URL or local path")
    cast_members: List[Dict[str, Any]] = Field(default_factory=list, alias="castMembers", description="Structured cast members with names, roles, and reference image paths")

    # Optional Story Context (Strict Priority Handling)
    script: Optional[str] = Field(None, alias="Script", description="User-provided screenplay/script text or excerpt")
    summary: Optional[str] = Field(None, alias="Summary", description="User-provided film synopsis/logline")
    
    # Analysis Options
    max_video_duration_sec: Optional[float] = Field(None, description="Optional clip duration cap for rapid analysis")
    generate_pdf: bool = Field(True, description="Whether to automatically generate the PDF report")
    output_filename_prefix: Optional[str] = Field(None, description="Custom prefix for saved report files")

    @field_validator("actors", mode="before")
    @classmethod
    def parse_actors(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            import re
            return [item.strip() for item in re.split(r'[,|;]', v) if item.strip()]
        return v or []

    @field_validator("production_houses", mode="before")
    @classmethod
    def parse_prod_houses(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            import re
            return [item.strip() for item in re.split(r'[,|;]', v) if item.strip()]
        return v or []

    @field_validator("budget", mode="before")
    @classmethod
    def parse_budget(cls, v: Union[str, float, int]) -> float:
        if isinstance(v, str):
            import re
            # Strip $, commas, spaces, currency symbols
            cleaned = re.sub(r'[^\d.]', '', v)
            try:
                return float(cleaned) if cleaned else 0.0
            except ValueError:
                return 0.0
        return float(v or 0.0)

    @field_validator("script", "summary", mode="before")
    @classmethod
    def clean_text_fields(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str) and not v.strip():
            return None
        return v

    model_config = ConfigDict(populate_by_name=True, extra="ignore")
