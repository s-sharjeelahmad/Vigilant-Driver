from pathlib import Path


def load_system_context():
    """Read and return the contents of the nearest `system_context.txt` found
    by searching upward from this file's directory. Returns an empty string if
    no file is found.
    """
    start = Path(__file__).resolve().parent
    for parent in [start] + list(start.parents):
        candidate = parent / "system_context.txt"
        if candidate.exists():
            try:
                return candidate.read_text(encoding="utf-8")
            except Exception:
                return ""
    return ""
