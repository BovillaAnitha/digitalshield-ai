
from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import hashlib
import sqlite3
import uuid
import os
from datetime import datetime, timezone

router = APIRouter(prefix="/media-evidence", tags=["Media Evidence"])

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "media_uploads"
DB_PATH = BASE_DIR / "media_evidence.db"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED = {
    ".mp3": ("audio", 25 * 1024 * 1024),
    ".wav": ("audio", 25 * 1024 * 1024),
    ".m4a": ("audio", 25 * 1024 * 1024),
    ".mp4": ("video", 100 * 1024 * 1024),
    ".webm": ("video", 100 * 1024 * 1024),
    ".mov": ("video", 100 * 1024 * 1024),
}

def connect():
    return sqlite3.connect(DB_PATH)

def initialize():
    with connect() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS media_evidence (
                id TEXT PRIMARY KEY,
                original_name TEXT NOT NULL,
                stored_name TEXT NOT NULL,
                media_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                sha256 TEXT NOT NULL,
                uploaded_at TEXT NOT NULL
            )
        """)

initialize()

@router.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    original_name = Path(file.filename or "unknown").name
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format."
        )

    media_type, max_size = ALLOWED[extension]
    evidence_id = str(uuid.uuid4())
    stored_name = f"{evidence_id}{extension}"
    destination = UPLOAD_DIR / stored_name

    digest = hashlib.sha256()
    total_size = 0

    try:
        with destination.open("wb") as output:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > max_size:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds the allowed {max_size // (1024 * 1024)} MB."
                    )

                digest.update(chunk)
                output.write(chunk)

        if total_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty files are not allowed."
            )

        record = {
            "id": evidence_id,
            "original_name": original_name,
            "stored_name": stored_name,
            "media_type": media_type,
            "file_size": total_size,
            "sha256": digest.hexdigest(),
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }

        with connect() as db:
            db.execute("""
                INSERT INTO media_evidence
                (id, original_name, stored_name, media_type,
                 file_size, sha256, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, tuple(record.values()))

        return record

    except Exception:
        destination.unlink(missing_ok=True)
        raise

    finally:
        await file.close()


@router.get("")
def list_media():
    with connect() as db:
        db.row_factory = sqlite3.Row
        rows = db.execute("""
            SELECT id, original_name, media_type,
                   file_size, sha256, uploaded_at
            FROM media_evidence
            ORDER BY uploaded_at DESC
        """).fetchall()

    return [dict(row) for row in rows]


@router.get("/{evidence_id}/verify")
def verify_media(evidence_id: str):
    with connect() as db:
        db.row_factory = sqlite3.Row
        row = db.execute("""
            SELECT * FROM media_evidence WHERE id = ?
        """, (evidence_id,)).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Evidence not found.")

    path = UPLOAD_DIR / row["stored_name"]

    if not path.is_file():
        return {"verified": False, "reason": "File missing"}

    digest = hashlib.sha256()

    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)

    return {
        "verified": digest.hexdigest() == row["sha256"],
        "stored_sha256": row["sha256"],
        "current_sha256": digest.hexdigest()
    }




@router.delete("/{evidence_id}")
def delete_media(evidence_id: str):
    with connect() as db:
        db.row_factory = sqlite3.Row

        record = db.execute(
            """
            SELECT stored_name
            FROM media_evidence
            WHERE id = ?
            """,
            (evidence_id,)
        ).fetchone()

        if record is None:
            raise HTTPException(
                status_code=404,
                detail="Media evidence not found."
            )

        stored_name = record["stored_name"]

        if Path(stored_name).name != stored_name:
            raise HTTPException(
                status_code=400,
                detail="Invalid stored filename."
            )

        file_path = UPLOAD_DIR / stored_name

        try:
            file_path.unlink(missing_ok=True)
        except OSError:
            raise HTTPException(
                status_code=500,
                detail="Could not delete media file."
            )

        db.execute(
            """
            DELETE FROM media_evidence
            WHERE id = ?
            """,
            (evidence_id,)
        )

    return {
        "message": "Media evidence deleted successfully.",
        "id": evidence_id
    }
