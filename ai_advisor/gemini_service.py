import os
import requests
from typing import Optional
from dotenv import load_dotenv, find_dotenv

# Load .env if present so GEMINI_API_KEY is available in local dev.
load_dotenv(find_dotenv())

# Allow overriding the endpoint via env for testing
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
DEFAULT_GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{DEFAULT_GEMINI_MODEL}:generateContent"


def generate_response(system_context: str, user_message: str, model: str = DEFAULT_GEMINI_MODEL) -> Optional[str]:
    """Call the Gemini/Bison style REST endpoint with a simple prompt constructed
    from the `system_context` and `user_message`.

    This function is intentionally conservative: it instructs the model to only
    use the provided context and to reply safely when information is missing.
    """
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    gemini_api_url = os.getenv("GEMINI_API_URL") or f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    if not gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set in environment")

    # Build a strict prompt that limits the model to the provided context.
    prompt = (
        "You are an assistant for the Vigilant Driver Monitoring and Safety Assurance System."
        " Use ONLY the facts provided in the CONTEXT block below to answer questions."
        " If the context does not contain enough information, reply: 'I'm sorry, I don't have that information.'"
        " Do NOT invent features or endpoints.\n\n"
        "CONTEXT:\n" + system_context + "\n\n"
        "USER QUESTION:\n" + user_message + "\n\n"
        "RESPONSE:"
    )

    # Gemini generateContent (v1beta) expects a `contents` payload.
    use_bison = "generateText" in gemini_api_url
    if use_bison:
        payload = {
            "prompt": {"text": prompt},
            "temperature": 0.0,
            "maxOutputTokens": 1000
        }
    else:
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1000
            }
        }

    headers = {"Content-Type": "application/json"}
    params = {"key": gemini_api_key}

    try:
        resp = requests.post(gemini_api_url, params=params, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
    except requests.HTTPError as exc:
        detail = exc.response.text if exc.response is not None else str(exc)
        raise RuntimeError(f"Gemini request failed: {detail}") from exc

    data = resp.json()

    # Google Bison returns candidates[0].output or candidates[0].content
    try:
        candidates = data.get("candidates") or []
        if candidates:
            # generateContent returns candidates[0].content.parts[0].text
            content = candidates[0].get("content") or {}
            parts = content.get("parts") or []
            if parts:
                return parts[0].get("text") or ""
            return candidates[0].get("output") or ""
        # some APIs return `text` fields
        return data.get("text") or ""
    except Exception:
        return ""
