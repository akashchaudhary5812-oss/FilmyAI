"""
Video Resolver and Normalizer for FILMY AI.

Provides a unified interface to resolve both:
1. Local video file paths
2. Public / Authorized video URLs

Safely downloads/caches remote videos into temporary processing files,
validates video format, file accessibility, size limits, and ensures
deterministic cleanup after pipeline execution.
"""
import os
import re
import shutil
import tempfile
import urllib.parse
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple, Dict, Any, Callable
import requests

# Supported video extensions
SUPPORTED_VIDEO_EXTENSIONS = {
    ".mp4", ".mov", ".webm", ".avi", ".mkv", ".mpeg", ".mpg", ".m4v"
}

# Supported Content-Types
SUPPORTED_MIME_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-msvideo",
    "video/x-matroska",
    "video/mpeg",
    "application/x-mpegurl",
    "application/vnd.apple.mpegurl",
    "video/mp2t",
    "application/octet-stream",  # often returned for direct S3/blob video downloads
}

# Default constraints
DEFAULT_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 * 1024  # 50 GB (supports full-length feature films)
DEFAULT_CONNECT_TIMEOUT_SEC = 10
DEFAULT_READ_TIMEOUT_SEC = 120
DEFAULT_CHUNK_SIZE = 64 * 1024  # 64 KB


class VideoResolutionError(Exception):
    """Base exception for video resolution errors."""
    def __init__(self, message: str, stage: str = "VALIDATING_URL", status_code: Optional[int] = None):
        super().__init__(message)
        self.message = message
        self.stage = stage
        self.status_code = status_code


class InvalidURLError(VideoResolutionError):
    """Raised when the provided video URL format is malformed or invalid."""
    def __init__(self, message: str):
        super().__init__(message, stage="VALIDATING_URL")


class InaccessibleURLError(VideoResolutionError):
    """Raised when the URL cannot be reached or returns HTTP error."""
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message, stage="VALIDATING_URL", status_code=status_code)


class UnsupportedFormatError(VideoResolutionError):
    """Raised when the media resource is not a supported video format."""
    def __init__(self, message: str):
        super().__init__(message, stage="VALIDATING_URL")


class FileSizeLimitExceededError(VideoResolutionError):
    """Raised when the video file exceeds the maximum allowed size limit."""
    def __init__(self, message: str):
        super().__init__(message, stage="DOWNLOADING_VIDEO")


class DownloadError(VideoResolutionError):
    """Raised when video stream download fails midway."""
    def __init__(self, message: str):
        super().__init__(message, stage="DOWNLOADING_VIDEO")


@dataclass
class ResolvedVideo:
    """
    Normalized result produced by VideoResolver.
    Downstream ML_VIDEO analysis receives this consistent object.
    """
    path: Path
    source_type: str  # "LOCAL_FILE" | "REMOTE_URL"
    original_target: str
    is_temporary: bool = False
    file_size_bytes: int = 0
    mime_type: Optional[str] = None
    extension: str = ".mp4"
    cleaned: bool = False

    def cleanup(self) -> None:
        """Deletes temporary cached video file if marked as temporary."""
        if self.is_temporary and not self.cleaned and self.path.exists():
            try:
                if self.path.is_file():
                    self.path.unlink(missing_ok=True)
                self.cleaned = True
            except Exception as e:
                print(f"[VideoResolver] Warning: Failed to clean temp video file {self.path}: {e}")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cleanup()


class VideoResolver:
    """
    Production-grade Unified Video Resolver for FilmyAI.
    Normalizes local paths and remote video URLs into a verified local file on disk.
    """

    def __init__(
        self,
        temp_dir: Optional[Path] = None,
        max_file_size_bytes: int = DEFAULT_MAX_FILE_SIZE_BYTES,
        connect_timeout: int = DEFAULT_CONNECT_TIMEOUT_SEC,
        read_timeout: int = DEFAULT_READ_TIMEOUT_SEC,
        user_agent: str = "FilmyAI-VideoResolver/1.0"
    ):
        self.temp_dir = temp_dir or Path(tempfile.gettempdir()) / "filmyai_videos"
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self.max_file_size_bytes = max_file_size_bytes
        self.connect_timeout = connect_timeout
        self.read_timeout = read_timeout
        self.user_agent = user_agent

    @staticmethod
    def is_url(target: str) -> bool:
        """Determines if the target string is a web URL."""
        if not isinstance(target, str):
            return False
        parsed = urllib.parse.urlparse(target.strip())
        return parsed.scheme in ("http", "https")

    def validate_url_syntax(self, url: str) -> urllib.parse.ParseResult:
        """Validates basic URL syntax and protocol."""
        if not url or not isinstance(url, str):
            raise InvalidURLError("A non-empty video URL must be provided.")
        
        url_clean = url.strip()
        parsed = urllib.parse.urlparse(url_clean)
        if parsed.scheme not in ("http", "https"):
            raise InvalidURLError(f"Invalid URL scheme '{parsed.scheme}'. Only HTTP and HTTPS video URLs are supported.")
        if not parsed.netloc:
            raise InvalidURLError(f"Invalid URL domain/hostname in '{url}'.")
        return parsed

    def probe_url(self, url: str) -> Dict[str, Any]:
        """
        Validates remote video accessibility, MIME type, and file size via HTTP HEAD / GET stream.
        """
        headers = {
            "User-Agent": self.user_agent,
            "Accept": "video/*,application/octet-stream,*/*",
        }

        try:
            # 1. Try HEAD request first for fast probing
            resp = requests.head(
                url,
                headers=headers,
                allow_redirects=True,
                timeout=(self.connect_timeout, self.read_timeout)
            )

            # Some servers block HEAD or return 405 Method Not Allowed / 403 Forbidden on HEAD
            if resp.status_code in (405, 403, 501):
                resp = requests.get(
                    url,
                    headers=headers,
                    stream=True,
                    allow_redirects=True,
                    timeout=(self.connect_timeout, self.read_timeout)
                )

            # Handle HTTP errors
            if resp.status_code == 401 or resp.status_code == 403:
                raise InaccessibleURLError(
                    f"Authentication required or access forbidden (HTTP {resp.status_code}) for URL. Ensure the URL is public or authorized.",
                    status_code=resp.status_code
                )
            if resp.status_code == 404:
                raise InaccessibleURLError(
                    f"Video resource not found (HTTP 404) at '{url}'.",
                    status_code=404
                )
            if resp.status_code >= 400:
                raise InaccessibleURLError(
                    f"HTTP error {resp.status_code} occurred while accessing video URL: {resp.reason}",
                    status_code=resp.status_code
                )

            content_type = resp.headers.get("Content-Type", "").split(";")[0].strip().lower()
            content_length_str = resp.headers.get("Content-Length")
            content_length = int(content_length_str) if (content_length_str and content_length_str.isdigit()) else None

            # Detect extension from URL path or Content-Disposition
            parsed_path = urllib.parse.urlparse(resp.url).path
            ext = Path(parsed_path).suffix.lower()
            if not ext:
                if "mp4" in content_type:
                    ext = ".mp4"
                elif "webm" in content_type:
                    ext = ".webm"
                elif "quicktime" in content_type:
                    ext = ".mov"
                elif "matroska" in content_type or "mkv" in content_type:
                    ext = ".mkv"
                elif "avi" in content_type:
                    ext = ".avi"
                else:
                    ext = ".mp4"

            # Check for size limit if header provided
            if content_length and content_length > self.max_file_size_bytes:
                max_mb = round(self.max_file_size_bytes / (1024 * 1024))
                file_mb = round(content_length / (1024 * 1024), 1)
                raise FileSizeLimitExceededError(
                    f"Remote video file size ({file_mb} MB) exceeds maximum allowed limit of {max_mb} MB."
                )

            # Verify that format appears to be video or binary media
            is_valid_format = (
                ext in SUPPORTED_VIDEO_EXTENSIONS or
                content_type in SUPPORTED_MIME_TYPES or
                content_type.startswith("video/") or
                content_type in ("application/octet-stream", "binary/octet-stream")
            )

            # Explicit check for HTML error pages returning 200 OK
            if content_type.startswith("text/html"):
                raise UnsupportedFormatError(
                    f"The URL returned an HTML webpage instead of a direct video stream. Please provide a direct video URL."
                )

            if not is_valid_format and not ext:
                raise UnsupportedFormatError(
                    f"Unsupported media format or MIME type '{content_type}'. Supported video formats: {', '.join(sorted(SUPPORTED_VIDEO_EXTENSIONS))}."
                )

            return {
                "final_url": resp.url,
                "content_type": content_type,
                "content_length": content_length,
                "extension": ext,
                "status_code": resp.status_code,
            }

        except requests.exceptions.Timeout:
            raise InaccessibleURLError(
                f"Connection timed out after {self.connect_timeout}s while attempting to reach video URL."
            )
        except requests.exceptions.ConnectionError as ce:
            raise InaccessibleURLError(
                f"Could not connect to host. Network or DNS resolution error: {str(ce)}"
            )
        except requests.exceptions.RequestException as re:
            raise InaccessibleURLError(f"HTTP request failed: {str(re)}")

    def download_to_temp_file(
        self,
        url: str,
        probe_info: Dict[str, Any],
        on_progress: Optional[Callable[[int, Optional[int]], None]] = None
    ) -> ResolvedVideo:
        """
        Streams remote video chunk-by-chunk to a temporary processing file.
        Enforces maximum file size limit during download.
        """
        ext = probe_info.get("extension", ".mp4")
        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=ext,
            dir=self.temp_dir,
            prefix="filmyai_url_vid_"
        )
        temp_path = Path(temp_file.name)

        headers = {
            "User-Agent": self.user_agent,
            "Accept": "video/*,application/octet-stream,*/*",
        }

        downloaded_bytes = 0
        total_bytes = probe_info.get("content_length")

        try:
            with requests.get(
                url,
                headers=headers,
                stream=True,
                timeout=(self.connect_timeout, self.read_timeout)
            ) as response:
                response.raise_for_status()

                for chunk in response.iter_content(chunk_size=DEFAULT_CHUNK_SIZE):
                    if not chunk:
                        continue
                    downloaded_bytes += len(chunk)

                    if downloaded_bytes > self.max_file_size_bytes:
                        max_mb = round(self.max_file_size_bytes / (1024 * 1024))
                        raise FileSizeLimitExceededError(
                            f"Downloaded video stream exceeded maximum allowed limit of {max_mb} MB."
                        )

                    temp_file.write(chunk)
                    if on_progress:
                        on_progress(downloaded_bytes, total_bytes)

            temp_file.close()

            # Verify downloaded file is non-empty
            if downloaded_bytes == 0:
                raise DownloadError("Downloaded video stream resulted in 0 bytes.")

            return ResolvedVideo(
                path=temp_path,
                source_type="REMOTE_URL",
                original_target=url,
                is_temporary=True,
                file_size_bytes=downloaded_bytes,
                mime_type=probe_info.get("content_type"),
                extension=ext
            )

        except Exception as e:
            temp_file.close()
            if temp_path.exists():
                temp_path.unlink(missing_ok=True)
            if isinstance(e, VideoResolutionError):
                raise
            raise DownloadError(f"Failed to stream and cache video from URL: {str(e)}")

    def resolve(
        self,
        target: Optional[str] = None,
        on_progress: Optional[Callable[[int, Optional[int]], None]] = None
    ) -> ResolvedVideo:
        """
        Unified resolution method for both local video files and public video URLs.
        Returns a normalized ResolvedVideo instance.
        """
        if not target or not isinstance(target, str) or not target.strip():
            raise VideoResolutionError("Video target must be a non-empty file path or URL.")

        target_str = target.strip()

        # CASE 1: Remote URL
        if self.is_url(target_str):
            # Fast-path: Check if localhost upload URL maps directly to local server storage
            parsed_u = urllib.parse.urlparse(target_str)
            if parsed_u.hostname in ("localhost", "127.0.0.1") and "/uploads/videos/" in parsed_u.path:
                rel_file = parsed_u.path.split("/uploads/videos/")[-1]
                for base in [Path.cwd() / "Backend" / "uploads" / "videos", Path.cwd() / "uploads" / "videos"]:
                    cand = base / rel_file
                    if cand.exists() and cand.is_file():
                        return ResolvedVideo(
                            path=cand,
                            source_type="LOCAL_FILE",
                            original_target=target_str,
                            is_temporary=False,
                            file_size_bytes=cand.stat().st_size,
                            extension=cand.suffix.lower()
                        )

            self.validate_url_syntax(target_str)
            probe_info = self.probe_url(target_str)
            resolved = self.download_to_temp_file(target_str, probe_info, on_progress=on_progress)
            return resolved

        # CASE 2: Local File Path
        local_path = Path(target_str)
        if not local_path.is_absolute():
            # Check relative to cwd or workspace
            local_path = Path.cwd() / target_str

        if not local_path.exists() or not local_path.is_file():
            raise VideoResolutionError(
                f"Local video file not found at path: '{target_str}'",
                stage="VALIDATING_URL"
            )

        ext = local_path.suffix.lower()
        if ext not in SUPPORTED_VIDEO_EXTENSIONS:
            raise UnsupportedFormatError(
                f"Unsupported local video format '{ext}'. Supported formats: {', '.join(sorted(SUPPORTED_VIDEO_EXTENSIONS))}."
            )

        size_bytes = local_path.stat().st_size
        if size_bytes == 0:
            raise VideoResolutionError("Local video file is empty (0 bytes).")

        return ResolvedVideo(
            path=local_path,
            source_type="LOCAL_FILE",
            original_target=target_str,
            is_temporary=False,
            file_size_bytes=size_bytes,
            extension=ext
        )
