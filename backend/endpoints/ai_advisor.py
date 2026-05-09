from fastapi import APIRouter, Depends, HTTPException, status
from ai_advisor.context_loader import load_system_context
from ai_advisor.gemini_service import generate_response
from ai_advisor.schemas import ChatRequest, ChatResponse
from ..authentication.auth import get_current_company

router = APIRouter()


@router.post("/company/ai-advisor/chat", response_model=ChatResponse)
def company_ai_chat(req: ChatRequest, current_company=Depends(get_current_company)):
    """Company-facing AI Advisor chat endpoint.

    The endpoint uses `system_context.txt` as the only context and asks the
    Gemini service to generate a concise, factual answer. If the GEMINI_API_KEY
    is not set or the external call fails, a 503 is returned.
    """
    system_context = load_system_context()
    if not system_context:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="System context not available")

    try:
        reply = generate_response(system_context=system_context, user_message=req.message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    if not reply:
        reply = "I'm sorry, I don't have that information."

    return ChatResponse(reply=reply)
