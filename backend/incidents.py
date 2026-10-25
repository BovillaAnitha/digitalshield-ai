
import hashlib
import io
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    KeepTogether,
)

router = APIRouter(prefix="/incidents", tags=["Incidents"])

BASE_DIR = Path(__file__).resolve().parent
INCIDENT_DB = BASE_DIR / "incidents.db"
EVIDENCE_DB = BASE_DIR / "evidence.db"
UPLOAD_DIR = BASE_DIR / "uploads"


class IncidentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1, max_length=3000)
    occurred_at: datetime
    category: str = Field(default="Other", max_length=80)
    evidence_id: str | None = None


def connect(db_path):
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    return db


def initialize_db():
    with connect(INCIDENT_DB) as db:
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


initialize_db()


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

    with connect(INCIDENT_DB) as db:
        db.execute("""
            INSERT INTO incidents
            (id, title, description, occurred_at,
             category, evidence_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            record["id"],
            record["title"],
            record["description"],
            record["occurred_at"],
            record["category"],
            record["evidence_id"],
            record["created_at"],
        ))

    return record


@router.get("")
def list_incidents():
    with connect(INCIDENT_DB) as db:
        rows = db.execute("""
            SELECT *
            FROM incidents
            ORDER BY occurred_at ASC
        """).fetchall()

    return [dict(row) for row in rows]


def get_evidence_details(evidence_id):
    if not evidence_id:
        return None

    if not EVIDENCE_DB.is_file():
        return None

    with connect(EVIDENCE_DB) as db:
        row = db.execute("""
            SELECT id, filename, stored_name, sha256,
                   size, uploaded_at
            FROM evidence
            WHERE id = ?
        """, (evidence_id,)).fetchone()

    if row is None:
        return None

    evidence = dict(row)

    # Stored names are UUID-based filenames created by the
    # evidence upload endpoint, not user-provided paths.
    stored_name = evidence["stored_name"]

    if Path(stored_name).name != stored_name:
        evidence["verification"] = "Invalid stored filename"
        return evidence

    file_path = UPLOAD_DIR / stored_name

    if not file_path.is_file():
        evidence["verification"] = "File missing"
        return evidence

    current_hash = hashlib.sha256(
        file_path.read_bytes()
    ).hexdigest()

    evidence["verification"] = (
        "Fingerprint matches"
        if current_hash == evidence["sha256"]
        else "Fingerprint mismatch"
    )

    return evidence


def safe(value):
    return escape(str(value if value is not None else ""))


@router.get("/report")
def export_report():
    incidents = list_incidents()

    if not incidents:
        raise HTTPException(
            status_code=400,
            detail="Add at least one incident before exporting."
        )

    buffer = io.BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=(595, 842),
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45,
    )

    styles = getSampleStyleSheet()
    story = []

    story.append(
        Paragraph(
            '<font color="#6438B5">DigitalShield AI</font>',
            styles["Title"],
        )
    )

    story.append(
        Paragraph(
            "Incident Documentation Report",
            styles["Heading2"],
        )
    )

    generated_at = datetime.now(timezone.utc).strftime(
        "%d %B %Y, %H:%M UTC"
    )

    story.append(
        Paragraph(
            f"Generated: {generated_at}",
            styles["Normal"],
        )
    )

    story.append(Spacer(1, 14))

    story.append(
        Paragraph(
            f"Total documented incidents: {len(incidents)}",
            styles["Heading3"],
        )
    )

    story.append(Spacer(1, 12))

    for index, incident in enumerate(incidents, start=1):
        section = []

        section.append(
            Paragraph(
                f"{index}. {safe(incident['title'])}",
                styles["Heading3"],
            )
        )

        section.append(
            Paragraph(
                f"<b>Incident date:</b> "
                f"{safe(incident['occurred_at'])}",
                styles["Normal"],
            )
        )

        section.append(
            Paragraph(
                f"<b>Category:</b> "
                f"{safe(incident['category'])}",
                styles["Normal"],
            )
        )

        section.append(Spacer(1, 8))

        description = safe(
            incident["description"]
        ).replace("\n", "<br/>")

        section.append(
            Paragraph(description, styles["BodyText"])
        )

        section.append(Spacer(1, 12))

        evidence_id = incident["evidence_id"]

        if evidence_id:
            evidence = get_evidence_details(evidence_id)

            section.append(
                Paragraph(
                    "Linked Evidence",
                    styles["Heading4"],
                )
            )

            if evidence:
                details = [
                    ("Filename", evidence["filename"]),
                    ("File size", f"{evidence['size']} bytes"),
                    ("Uploaded", evidence["uploaded_at"]),
                    ("SHA-256", evidence["sha256"]),
                    ("Verification", evidence["verification"]),
                ]

                for label, value in details:
                    section.append(
                        Paragraph(
                            f"<b>{safe(label)}:</b> {safe(value)}",
                            styles["BodyText"],
                        )
                    )
            else:
                section.append(
                    Paragraph(
                        "Evidence metadata unavailable for "
                        f"reference {safe(evidence_id)}.",
                        styles["BodyText"],
                    )
                )

        story.extend(section)

        story.append(Spacer(1, 12))
        story.append(
            HRFlowable(
                width="100%",
                thickness=1,
                color=colors.HexColor("#DED4F1"),
            )
        )
        story.append(Spacer(1, 14))

    story.append(
        Paragraph(
            "Important: This report contains user-entered "
            "information and locally stored file fingerprints. "
            "A matching SHA-256 fingerprint only indicates "
            "that the current file matches the recorded bytes. "
            "It does not establish when, where, or by whom "
            "the evidence was created. This report is not "
            "a legal certification or independent verification.",
            styles["Italic"],
        )
    )

    document.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            'attachment; filename="digitalshield-report.pdf"'
        },
    )



@router.delete("/{incident_id}")
def delete_incident(incident_id: str):
    with connect(INCIDENT_DB) as db:
        record = db.execute(
            """
            SELECT id
            FROM incidents
            WHERE id = ?
            """,
            (incident_id,)
        ).fetchone()

        if record is None:
            raise HTTPException(
                status_code=404,
                detail="Incident not found."
            )

        db.execute(
            """
            DELETE FROM incidents
            WHERE id = ?
            """,
            (incident_id,)
        )

    return {
        "message": "Incident deleted successfully.",
        "id": incident_id
    }

