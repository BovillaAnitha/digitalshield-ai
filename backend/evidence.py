
import hashlib
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(prefix="/evidence", tags=["Evidence"])

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
DB_PATH = BASE_DIR / "evidence.db"

UPLOAD_DIR.mkdir(exist_ok=True)

MAX_SIZE = 5 * 1024 * 1024

ALLOWED_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "application/pdf": ".pdf",
}


def get_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_db():
    with get_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS evidence (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                stored_name TEXT NOT NULL,
                content_type TEXT NOT NULL,
                sha256 TEXT NOT NULL,
                size INTEGER NOT NULL,
                uploaded_at TEXT NOT NULL
            )
        """)


initialize_db()


@router.post("/upload")
async def upload_evidence(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only PNG, JPEG and PDF files are supported."
        )

    content = await file.read(MAX_SIZE + 1)

    if not content:
        raise HTTPException(400, "File is empty.")

    if len(content) > MAX_SIZE:
        raise HTTPException(413, "Maximum file size is 5 MB.")

    signatures = {
        "image/png": content.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/jpeg": content.startswith(b"\xff\xd8\xff"),
        "application/pdf": content.startswith(b"%PDF-"),
    }

    if not signatures[file.content_type]:
        raise HTTPException(400, "File signature does not match type.")

    evidence_id = str(uuid.uuid4())
    extension = ALLOWED_TYPES[file.content_type]
    stored_name = evidence_id + extension

    fingerprint = hashlib.sha256(content).hexdigest()
    uploaded_at = datetime.now(timezone.utc).isoformat()

    file_path = UPLOAD_DIR / stored_name
    file_path.write_bytes(content)

    record = {
        "id": evidence_id,
        "filename": Path(file.filename or "unnamed").name,
        "content_type": file.content_type,
        "sha256": fingerprint,
        "size": len(content),
        "uploaded_at": uploaded_at,
    }

    try:
        with get_db() as db:
            db.execute("""
                INSERT INTO evidence
                (id, filename, stored_name, content_type,
                 sha256, size, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                evidence_id,
                record["filename"],
                stored_name,
                file.content_type,
                fingerprint,
                len(content),
                uploaded_at,
            ))
    except Exception:
        file_path.unlink(missing_ok=True)
        raise

    return record


@router.get("")
def list_evidence():
    with get_db() as db:
        rows = db.execute("""
            SELECT id, filename, content_type, sha256,
                   size, uploaded_at
            FROM evidence
            ORDER BY uploaded_at DESC
        """).fetchall()

    return [dict(row) for row in rows]


@router.post("/verify/{evidence_id}")
def verify_evidence(evidence_id: str):
    with get_db() as db:
        record = db.execute(
            "SELECT * FROM evidence WHERE id = ?",
            (evidence_id,)
        ).fetchone()

    if record is None:
        raise HTTPException(404, "Evidence record not found.")

    path = UPLOAD_DIR / record["stored_name"]

    if not path.is_file():
        return {
            "id": evidence_id,
            "status": "missing",
            "verified": False,
        }

    current_hash = hashlib.sha256(path.read_bytes()).hexdigest()

    verified = current_hash == record["sha256"]

    return {
        "id": evidence_id,
        "status": "unchanged" if verified else "modified",
        "verified": verified,
        "original_sha256": record["sha256"],
        "current_sha256": current_hash,
    }
