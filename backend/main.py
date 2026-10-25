from enhanced_report import router as enhanced_report_router
from incident_media import router as incident_media_router
from media_evidence import router as media_router
from incidents import router as incidents_router
from evidence import router as evidence_router
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from analyzer import analyze_conversation

app = FastAPI(title="DigitalShield AI")
app.include_router(media_router)
app.include_router(incident_media_router)

app.include_router(enhanced_report_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(evidence_router)
app.include_router(incidents_router)
class ConversationRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)


@app.get("/")
def home():
    return {
        "message": "DigitalShield AI Backend Running",
        "status": "success",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/analyze")
def analyze(request: ConversationRequest):
    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter a conversation.",
        )

    return analyze_conversation(request.text)
