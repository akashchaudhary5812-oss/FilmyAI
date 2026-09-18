"""
Unit tests for VideoResolver (Local Files & Video URLs).
Tests normalization, probe validation, error handling, and deterministic cleanup.
"""
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest
import numpy as np
import cv2

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ML_VIDEO.src.preprocessing.video_resolver import (
    VideoResolver,
    ResolvedVideo,
    InvalidURLError,
    InaccessibleURLError,
    UnsupportedFormatError,
    FileSizeLimitExceededError,
    DownloadError,
    VideoResolutionError
)


def create_dummy_video(tmp_path: Path, filename: str = "sample.mp4") -> Path:
    """Creates a small real MP4 video file for testing local resolution."""
    vpath = tmp_path / filename
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(vpath), fourcc, 10, (160, 120))
    frame = np.zeros((120, 160, 3), dtype=np.uint8)
    for _ in range(10):
        writer.write(frame)
    writer.release()
    return vpath


def test_resolve_local_file(tmp_path):
    """Verifies that a valid local video file is resolved without copying."""
    vpath = create_dummy_video(tmp_path, "local_trailer.mp4")
    resolver = VideoResolver(temp_dir=tmp_path / "temp_cache")

    resolved = resolver.resolve(str(vpath))
    assert resolved.source_type == "LOCAL_FILE"
    assert resolved.path.exists()
    assert resolved.path == vpath
    assert resolved.is_temporary is False
    assert resolved.file_size_bytes > 0
    assert resolved.extension == ".mp4"

    # Cleanup should NOT delete non-temporary local files
    resolved.cleanup()
    assert vpath.exists()


def test_resolve_nonexistent_local_file(tmp_path):
    """Verifies error handling when local video file does not exist."""
    resolver = VideoResolver(temp_dir=tmp_path / "temp_cache")
    with pytest.raises(VideoResolutionError) as exc:
        resolver.resolve(str(tmp_path / "does_not_exist.mp4"))
    assert "not found" in str(exc.value)


def test_resolve_unsupported_local_extension(tmp_path):
    """Verifies error handling for unsupported file formats."""
    dummy_txt = tmp_path / "document.pdf"
    dummy_txt.write_text("not a video")
    resolver = VideoResolver(temp_dir=tmp_path / "temp_cache")
    with pytest.raises(UnsupportedFormatError):
        resolver.resolve(str(dummy_txt))


def test_validate_url_syntax():
    """Verifies URL syntax validation."""
    resolver = VideoResolver()

    # Valid URLs
    resolver.validate_url_syntax("https://cdn.example.com/video.mp4")
    resolver.validate_url_syntax("http://media.studio.com/trailer.mov?token=123")

    # Invalid URLs
    with pytest.raises(InvalidURLError):
        resolver.validate_url_syntax("ftp://files.example.com/video.mp4")

    with pytest.raises(InvalidURLError):
        resolver.validate_url_syntax("not-a-url")

    with pytest.raises(InvalidURLError):
        resolver.validate_url_syntax("")


@patch("requests.head")
@patch("requests.get")
def test_resolve_valid_remote_url(mock_get, mock_head, tmp_path):
    """Verifies successful remote URL resolution and automatic cleanup."""
    temp_dir = tmp_path / "temp_cache"
    resolver = VideoResolver(temp_dir=temp_dir)

    # Mock HEAD probe response
    mock_head_resp = MagicMock()
    mock_head_resp.status_code = 200
    mock_head_resp.url = "https://cdn.filmyai.test/sample.mp4"
    mock_head_resp.headers = {
        "Content-Type": "video/mp4",
        "Content-Length": "1024"
    }
    mock_head.return_value = mock_head_resp

    # Mock GET stream download response
    mock_get_resp = MagicMock()
    mock_get_resp.status_code = 200
    mock_get_resp.iter_content.return_value = [b"video_bytes_chunk_1", b"video_bytes_chunk_2"]
    mock_get_resp.__enter__.return_value = mock_get_resp
    mock_get.return_value = mock_get_resp

    resolved = resolver.resolve("https://cdn.filmyai.test/sample.mp4")

    assert resolved.source_type == "REMOTE_URL"
    assert resolved.is_temporary is True
    assert resolved.path.exists()
    assert resolved.file_size_bytes == len(b"video_bytes_chunk_1") + len(b"video_bytes_chunk_2")

    # Verify cleanup deletes the cached temp file
    temp_path = resolved.path
    resolved.cleanup()
    assert not temp_path.exists()


@patch("requests.head")
def test_resolve_inaccessible_404_url(mock_head, tmp_path):
    """Verifies handling of 404 Not Found remote URLs."""
    resolver = VideoResolver(temp_dir=tmp_path / "temp_cache")

    mock_head_resp = MagicMock()
    mock_head_resp.status_code = 404
    mock_head.return_value = mock_head_resp

    with pytest.raises(InaccessibleURLError) as exc:
        resolver.resolve("https://cdn.example.com/missing_video.mp4")
    assert "404" in str(exc.value)


@patch("requests.head")
def test_resolve_html_page_url(mock_head, tmp_path):
    """Verifies rejection when URL points to an HTML webpage rather than a video stream."""
    resolver = VideoResolver(temp_dir=tmp_path / "temp_cache")

    mock_head_resp = MagicMock()
    mock_head_resp.status_code = 200
    mock_head_resp.url = "https://youtube.com/watch?v=12345"
    mock_head_resp.headers = {
        "Content-Type": "text/html; charset=utf-8"
    }
    mock_head.return_value = mock_head_resp

    with pytest.raises(UnsupportedFormatError) as exc:
        resolver.resolve("https://youtube.com/watch?v=12345")
    assert "HTML webpage" in str(exc.value)


@patch("requests.head")
def test_resolve_file_size_limit_exceeded(mock_head, tmp_path):
    """Verifies rejection of oversized video files exceeding max limit."""
    # Set limit to 5 MB
    resolver = VideoResolver(
        temp_dir=tmp_path / "temp_cache",
        max_file_size_bytes=5 * 1024 * 1024
    )

    mock_head_resp = MagicMock()
    mock_head_resp.status_code = 200
    mock_head_resp.url = "https://cdn.example.com/huge_film.mp4"
    mock_head_resp.headers = {
        "Content-Type": "video/mp4",
        "Content-Length": str(100 * 1024 * 1024)  # 100 MB
    }
    mock_head.return_value = mock_head_resp

    with pytest.raises(FileSizeLimitExceededError) as exc:
        resolver.resolve("https://cdn.example.com/huge_film.mp4")
    assert "exceeds maximum allowed limit" in str(exc.value)
