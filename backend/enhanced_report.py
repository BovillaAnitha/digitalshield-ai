
from pathlib import Path
from io import BytesIO
from datetime import datetime
import hashlib
import sqlite3

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch
from xml.sax.saxutils import escape

router = APIRouter(prefix="/reports", tags=["Enhanced Reports"])

BASE = Path(__file__).resolve().parent
INCIDENT_DB = BASE / "incidents.db"
MEDIA_DB = BASE / "media_evidence.db"
LINK_DB = BASE / "incident_media.db"
MEDIA_DIR = BASE / "media_uploads"


def get_rows(database, query, params=()):
    if not database.exists():
        return []

    with sqlite3.connect(database) as connection:
        connection.row_factory = sqlite3.Row
        try:
            return [
                dict(row)
                for row in connection.execute(query, params).fetchall()
            ]
        except sqlite3.OperationalError as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Report database error: {exc}"
            )


def safe_text(value):
    return escape(str(value if value is not None else ""))


def verify_media(media):
    stored_name = media.get("stored_name", "")
    path = MEDIA_DIR / stored_name

    if not path.is_file():
        return "MISSING"

    digest = hashlib.sha256()

    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)

    return (
        "MATCH"
        if digest.hexdigest() == media["sha256"]
        else "MISMATCH"
    )


def get_incident_media(incident_id):
    links = get_rows(
        LINK_DB,
        "SELECT media_id FROM incident_media WHERE incident_id = ?",
        (incident_id,)
    )

    media_items = []

    for link in links:
        rows = get_rows(
            MEDIA_DB,
            "SELECT * FROM media_evidence WHERE id = ?",
            (link["media_id"],)
        )

        if rows:
            media_items.append(rows[0])

    return media_items


@router.get("/enhanced")
def download_enhanced_report():
    incidents = get_rows(
        INCIDENT_DB,
        """
        SELECT id, title, description, occurred_at,
               category, evidence_id, created_at
        FROM incidents
        ORDER BY occurred_at DESC
        """
    )

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=(8.27 * inch, 11.69 * inch),
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="ReportTitleCustom",
        parent=styles["Title"],
        fontSize=19,
        textColor=colors.HexColor("#56318D"),
        alignment=TA_CENTER,
        spaceAfter=15
    ))

    styles.add(ParagraphStyle(
        name="ReportSectionCustom",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#56318D"),
        spaceBefore=12,
        spaceAfter=9
    ))

    styles.add(ParagraphStyle(
        name="ReportBodyCustom",
        parent=styles["BodyText"],
        fontSize=9,
        leading=14,
        spaceAfter=7,
        wordWrap="CJK"
    ))

    story = []

    def paragraph(text, style="ReportBodyCustom"):
        return Paragraph(safe_text(text).replace("\n", "<br/>"),
                         styles[style])

    story.append(paragraph(
        "DigitalShield AI - Enhanced Incident Report",
        "ReportTitleCustom"
    ))

    story.append(paragraph(
        f"Generated: {datetime.now().astimezone().strftime('%d %B %Y, %I:%M %p %Z')}"
    ))

    story.append(paragraph(
        f"Total documented incidents: {len(incidents)}"
    ))

    story.append(Spacer(1, 14))

    if not incidents:
        story.append(paragraph("No incidents have been documented."))

    for index, incident in enumerate(incidents, start=1):
        heading = paragraph(
            f"Incident {index}: {incident['title']}",
            "ReportSectionCustom"
        )

        story.append(heading)

        story.append(paragraph(
            f"Incident ID: {incident['id']}"
        ))
        story.append(paragraph(
            f"Category: {incident['category']}"
        ))
        story.append(paragraph(
            f"Occurred: {incident['occurred_at']}"
        ))
        story.append(paragraph(
            f"Recorded: {incident['created_at']}"
        ))
        story.append(paragraph(
            f"Description: {incident['description']}"
        ))

        if incident.get("evidence_id"):
            story.append(paragraph(
                "Original evidence reference ID: "
                + str(incident["evidence_id"])
            ))

        media_items = get_incident_media(incident["id"])

        story.append(paragraph(
            f"Linked Audio/Video Evidence ({len(media_items)})",
            "ReportSectionCustom"
        ))

        if not media_items:
            story.append(paragraph(
                "No audio/video evidence linked to this incident."
            ))

        for media_index, media in enumerate(media_items, start=1):
            size_mb = media["file_size"] / (1024 * 1024)
            integrity = verify_media(media)

            details = [
                paragraph(
                    f"Media {media_index}: {media['original_name']}"
                ),
                paragraph(
                    f"Type: {media['media_type']}"
                ),
                paragraph(
                    f"Size: {size_mb:.2f} MB"
                ),
                paragraph(
                    f"Uploaded: {media['uploaded_at']}"
                ),
                paragraph(
                    f"SHA-256: {media['sha256']}"
                ),
                paragraph(
                    f"Integrity check: {integrity}"
                )
            ]

            story.append(KeepTogether(details))
            story.append(Spacer(1, 8))

        story.append(Spacer(1, 14))

    story.append(paragraph(
        "Integrity results compare each stored media file against "
        "its recorded SHA-256 fingerprint. A matching fingerprint "
        "does not establish the recording's authenticity, origin, "
        "or legal admissibility."
    ))

    story.append(paragraph(
        "Privacy notice: This report may contain sensitive personal "
        "information. Store and share it carefully. DigitalShield AI "
        "is a prototype, not an official reporting or emergency service."
    ))

    document.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                'attachment; filename="DigitalShield_Enhanced_Report.pdf"',
            "Cache-Control": "no-store"
        }
    )
