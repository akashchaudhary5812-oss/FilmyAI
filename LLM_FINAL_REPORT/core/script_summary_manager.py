"""
Script and Summary Priority Manager.
Enforces strict precedence: User-Provided Content > AI-Generated Fallback.
Implements Cases 1, 2, 3, and 4 without ever overriding or duplicating user data.
"""
from typing import Optional, Dict, Any
from LLM_FINAL_REPORT.schemas.evidence_schema import StoryContextEvidence, VideoCinematographyEvidence


class ScriptSummaryManager:
    """
    Manages script and summary precedence according to FilmyAI core rules:
    - USER-PROVIDED CONTENT ALWAYS HAS PRIORITY.
    - NEVER overwrite or replace user-provided information.
    - NEVER regenerate content that the user already supplied.
    """

    @classmethod
    def resolve_story_context(
        cls,
        user_script: Optional[str],
        user_summary: Optional[str],
        video_evidence: Optional[VideoCinematographyEvidence] = None,
        film_title: str = "Untitled Film",
        genre: str = "Drama"
    ) -> StoryContextEvidence:
        """
        Evaluates script and summary presence and resolves final story context with source provenance.
        """
        has_script = bool(user_script and user_script.strip())
        has_summary = bool(user_summary and user_summary.strip())

        # CASE 1: Script = PROVIDED, Summary = PROVIDED
        if has_script and has_summary:
            return StoryContextEvidence(
                case_mode="CASE_1",
                script_source="USER_PROVIDED",
                summary_source="USER_PROVIDED",
                script_content=user_script.strip(),
                summary_content=user_summary.strip(),
                generated_notes="Both screenplay/script and synopsis were directly supplied by the filmmaker. No AI fallback regeneration applied."
            )

        # CASE 2: Script = PROVIDED, Summary = MISSING
        if has_script and not has_summary:
            generated_summary = cls._synthesize_summary_from_script_and_video(
                script=user_script.strip(),
                video_evidence=video_evidence,
                title=film_title,
                genre=genre
            )
            return StoryContextEvidence(
                case_mode="CASE_2",
                script_source="USER_PROVIDED",
                summary_source="AI_GENERATED",
                script_content=user_script.strip(),
                summary_content=generated_summary,
                generated_notes="Film summary was AI-synthesized from the user-provided screenplay and video visual/acoustic findings. Original user script preserved."
            )

        # CASE 3: Script = MISSING, Summary = PROVIDED
        if not has_script and has_summary:
            generated_story_representation = cls._synthesize_story_representation_from_video(
                video_evidence=video_evidence,
                summary=user_summary.strip(),
                title=film_title,
                genre=genre
            )
            return StoryContextEvidence(
                case_mode="CASE_3",
                script_source="AI_GENERATED",
                summary_source="USER_PROVIDED",
                script_content=generated_story_representation,
                summary_content=user_summary.strip(),
                generated_notes="Story sequence and scene breakdown were AI-generated from video analysis. Original user synopsis preserved."
            )

        # CASE 4: Script = MISSING, Summary = MISSING
        generated_summary = cls._synthesize_summary_from_video_only(
            video_evidence=video_evidence,
            title=film_title,
            genre=genre
        )
        generated_story_representation = cls._synthesize_story_representation_from_video(
            video_evidence=video_evidence,
            summary=generated_summary,
            title=film_title,
            genre=genre
        )

        return StoryContextEvidence(
            case_mode="CASE_4",
            script_source="AI_GENERATED",
            summary_source="AI_GENERATED",
            script_content=generated_story_representation,
            summary_content=generated_summary,
            generated_notes="Both film summary and story sequence breakdown were AI-generated from multimodal video analysis."
        )

    @classmethod
    def _synthesize_summary_from_script_and_video(
        cls,
        script: str,
        video_evidence: Optional[VideoCinematographyEvidence],
        title: str,
        genre: str
    ) -> str:
        """Derives a concise synopsis when script is given but summary is missing."""
        # Extract first 500 characters of script for basic context synthesis
        clean_excerpt = script[:600].strip().replace("\n", " ")
        pacing = video_evidence.pacing_rhythm if video_evidence and video_evidence.status == "available" else "cinematic pacing"
        lighting = video_evidence.predominant_lighting_style if video_evidence and video_evidence.status == "available" else "evocative lighting"
        
        return (
            f"[AI-generated from user script and video findings] '{title}' is a {genre} narrative characterized by "
            f"{pacing.lower()} and {lighting.lower()}. "
            f"Screenplay Opening Excerpt: \"{clean_excerpt}...\""
        )

    @classmethod
    def _synthesize_story_representation_from_video(
        cls,
        video_evidence: Optional[VideoCinematographyEvidence],
        summary: str,
        title: str,
        genre: str
    ) -> str:
        """Constructs a structural sequence / scene breakdown from video analysis."""
        if not video_evidence or video_evidence.status != "available":
            return f"[AI-generated from narrative context] Structural sequence breakdown derived for '{title}' ({genre}) based on synopsis: {summary}"

        shots_count = video_evidence.total_shots
        scenes_count = video_evidence.total_scenes
        duration = video_evidence.duration_seconds
        scale = video_evidence.predominant_shot_scale
        lighting = video_evidence.predominant_lighting_style
        acoustic = video_evidence.audio_speech_activity

        return (
            f"[AI-generated from video analysis] Cinematic Sequence Representation:\n"
            f"- Narrative Track: {summary}\n"
            f"- Visual Architecture: {shots_count} shots across {scenes_count} sequence(s) totaling {duration:.1f}s.\n"
            f"- Framing Language: Predominantly {scale} framing with {lighting} lighting profiles.\n"
            f"- Acoustic Environment: {acoustic} speech and ambient dynamics."
        )

    @classmethod
    def _synthesize_summary_from_video_only(
        cls,
        video_evidence: Optional[VideoCinematographyEvidence],
        title: str,
        genre: str
    ) -> str:
        """Generates summary purely from video analysis when both inputs are absent."""
        if not video_evidence or video_evidence.status != "available":
            return f"[AI-generated from video analysis] '{title}' is an audiovisual {genre} project."

        pacing = video_evidence.pacing_rhythm
        scale = video_evidence.predominant_shot_scale
        lighting = video_evidence.predominant_lighting_style
        shots = video_evidence.total_shots
        dur = video_evidence.duration_seconds

        return (
            f"[AI-generated from video analysis] '{title}' is a {dur:.1f}s {genre} cinematic sequence featuring {shots} shots "
            f"with {pacing.lower()}. The visual grammar leans toward {scale} shot scales under {lighting} atmospheric conditions."
        )
