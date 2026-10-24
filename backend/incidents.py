
import io
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.utils import simpleSplit
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from xml.sax.saxutils import escape

router = APIRouter(prefix="/incidents", tags=["Incidents"])

DB_PATH = Path(__file__).resolve().parent / "incidents.db"


class IncidentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1, max_length=3000)
    occurred_at: datetime
    category: str = Field(default="Other", max_length=80)
    evidence_id: str | None = None


def connect():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    return db


with connect() as db:
    db.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            occurred_at TEXT NOT NULL,
            category TEXT NOT NULL,
            evidence_id TEXT,
            created_at TEXT NOT NULL
        )
    """)


@router.post("")
def create_incident(item: IncidentCreate):
    record = {
        "id": str(uuid.uuid4()),
        "title": item.title,
        "description": item.description,
        "occurred_at": item.occurred_at.isoformat(),
        "category": item.category,
        "evidence_id": item.evidence_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    with connect() as db:
        db.execute("""
            INSERT INTO incidents
            (id, title, description, occurred_at,
             category, evidence_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, tuple(record.values()))

    return record


@router.get("")
def list_incidents():
    with connect() as db:
        rows = db.execute("""
            SELECT * FROM incidents
            ORDER BY occurred_at ASC
        """).fetchall()

    return [dict(row) for row in rows]


@router.get("/report")
def export_report():
    incidents = list_incidents()

    if not incidents:
        raise HTTPException(400, "Add an incident first.")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(595, 842),
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45,
    )

    styles = getSampleStyleSheet()
    story = [
        Paragraph("DigitalShield AI", styles["Title"]),
        Paragraph("Incident Documentation Report", styles["Heading2"]),
        Spacer(1, 12),
        Paragraph(
            "User-entered incident record. This report does not "
            "independently verify the events described.",
            styles["Normal"],
        ),
        Spacer(1, 18),
    ]

    for number, item in enumerate(incidents, start=1):
        story.append(
            Paragraph(
                f"{number}. {escape(item['title'])}",
                styles["Heading3"],
            )
        )
        story.append(
            Paragraph(
                f"Date: {escape(item['occurred_at'])}",
                styles["Normal"],
            )
        )
        story.append(
            Paragraph(
                f"Category: {escape(item['category'])}",
                styles["Normal"],
            )
        )
        story.append(
            Paragraph(
                escape(item["description"]).replace("\n", "<br/>"),
                styles["BodyText"],
            )
        )
        if item["evidence_id"]:
            story.append(
                Paragraph(
                    f"Evidence reference: {escape(item['evidence_id'])}",
                    styles["Normal"],
                )
            )
        story.append(Spacer(1, 15))

    story.append(
        Paragraph(
            "Generated for personal documentation and review. "
            "Not a legal certification or proof of authenticity.",
            styles["Italic"],
        )
    )

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                'attachment; filename="digitalshield-report.pdf"'
        },
    )
