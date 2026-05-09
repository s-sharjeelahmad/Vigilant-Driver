# AI Advisor helpers

This folder contains backend helpers used by the `ai_advisor` FastAPI endpoint.

- `context_loader.py` — reads `system_context.txt` from the workspace root.
- `gemini_service.py` — small wrapper to call a Gemini/Bison style REST API. It
  expects `GEMINI_API_KEY` in the environment. Optionally set `GEMINI_API_URL` to
  override the default endpoint.
- `schemas.py` — Pydantic models used by the endpoint.

Security note: The Gemini API key must be kept server-side (use `.env` or secrets).
