
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import sqlite3

router = APIRouter(prefix="/incident-media", tags=["Incident Media"])

BASE_DIR = Path(__file__).resolve().parent
LINK_DB = BASE_DIR / "incident_media.db"
MEDIA_DB = BASE_DIR / "media_evidence.db"
INCIDENT_DB = BASE_DIR / "incidents.db"


class MediaLink(BaseModel):
    incident_id: str
    media_id: str


def connection(path):
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    return db


def initialize():
    with connection(LINK_DB) as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS incident_media (
                incident_id TEXT NOT NULL,
                media_id TEXT NOT NULL,
                PRIMARY KEY (incident_id, media_id)
            )
        """ )


initialize()


def media_exists(media_id):
    if not MEDIA_DB.exists():
        return False

    with connection(MEDIA_DB) as db:
        row = db.execute(
            "SELECT id FROM media_evidence WHERE id = ?",
            (media_id,)
        ).fetchone()
        return row is not None


def incident_exists(incident_id):
    if not INCIDENT_DB.exists():
        return False

    with connection(INCIDENT_DB) as db:
        row = db.execute(
            "SELECT id FROM incidents WHERE id = ?",
            (incident_id,)
        ).fetchone()
        return row is not None


@router.post("")
def link_media(data: MediaLink):
    if not incident_exists(data.incident_id):
        raise HTTPException(404, "Incident not found.")

    if not media_exists(data.media_id):
        raise HTTPException(404, "Media evidence not found.")

    with connection(LINK_DB) as db:
        db.execute("""
            INSERT OR IGNORE INTO incident_media
            (incident_id, media_id)
            VALUES (?, ?)
        """, (data.incident_id, data.media_id))

    return {"message": "Media linked successfully."}


@router.get("/{incident_id}")
def get_linked_media(incident_id: str):
    if not MEDIA_DB.exists():
        return []

    with connection(LINK_DB) as db:
        rows = db.execute("""
            SELECT media_id
            FROM incident_media
            WHERE incident_id = ?
        """, (incident_id,)).fetchall()

    media_ids = [row["media_id"] for row in rows]

    if not media_ids:
        return []

    with connection(MEDIA_DB) as db:
        db.row_factory = sqlite3.Row

        placeholders = ",".join("?" for _ in media_ids)

        rows = db.execute(
            f"""
            SELECT id, original_name, media_type,
                   file_size, sha256, uploaded_at
            FROM media_evidence
            WHERE id IN ({placeholders})
            """,
            media_ids
        ).fetchall()

    return [dict(row) for row in rows]
