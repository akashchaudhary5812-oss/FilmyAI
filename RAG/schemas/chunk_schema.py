"""
Schemas for FilmyAI RAG Chunking and Knowledge Representation.
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class ReportChunk(BaseModel):
    """
    Standard schema for a single chunk derived from a structured FilmyAI Final Report.
    """
    chunk_id: str = Field(..., description="Unique chunk identifier (e.g. filmId_section_0)")
    film_id: str = Field(..., description="Unique Film identifier for strict isolation")
    film_name: str = Field(..., description="Human-readable film title")
    report_id: str = Field(..., description="ID of the generated Final Intelligence Report")
    report_version: str = Field("1.0", description="Version of the report schema")
    
    # Section hierarchy
    section: str = Field(..., description="Primary section name (e.g. Cinematography, Commercial Analysis)")
    subsection: Optional[str] = Field(None, description="Subsection name (e.g. Lighting, Risk Factors)")
    source_type: str = Field("final_report", description="Origin source type (final_report, ml_video, commercial_ml)")
    
    # Content
    content: str = Field(..., description="Clean, structured text content of the chunk")
    
    # Contextual metadata
    structured_metrics: Dict[str, Any] = Field(default_factory=dict, description="Numerical predictions, scores, classes")
    timestamps: List[str] = Field(default_factory=list, description="Scene timestamp ranges mentioned in this chunk")
    severity: Optional[str] = Field(None, description="Severity tag (e.g. high, moderate, low) if applicable")
    confidence: Optional[float] = Field(None, description="Confidence score if applicable")
    recommendation_priority: Optional[str] = Field(None, description="Priority tag (high, medium, low) if applicable")
    
    created_at_utc: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO UTC creation timestamp"
    )

    def to_formatted_context(self) -> str:
        """Format chunk for LLM context injection."""
        header = f"[{self.section.upper()}"
        if self.subsection:
            header += f" > {self.subsection}"
        header += "]"
        return f"{header}\n{self.content}"
