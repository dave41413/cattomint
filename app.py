from __future__ import annotations

import os
import sqlite3
from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional

from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "cattomint.db")
ADMIN_TOKEN = os.environ.get("CATTOMINT_ADMIN_TOKEN", "cattomint-admin")

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")


@dataclass
class Item:
    id: int
    title: str
    description: str
    kind: str
    duration: Optional[str]
    views: int
    category: str
    thumbnail_url: str
    media_url: str
    is_featured: int
    created_at: str


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                kind TEXT NOT NULL,
                duration TEXT,
                views INTEGER NOT NULL DEFAULT 0,
                category TEXT NOT NULL,
                thumbnail_url TEXT NOT NULL,
                media_url TEXT NOT NULL,
                is_featured INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


init_db()


def row_to_item(row: sqlite3.Row) -> Item:
    return Item(
        id=row["id"],
        title=row["title"],
        description=row["description"],
        kind=row["kind"],
        duration=row["duration"],
        views=row["views"],
        category=row["category"],
        thumbnail_url=row["thumbnail_url"],
        media_url=row["media_url"],
        is_featured=row["is_featured"],
        created_at=row["created_at"],
    )


def fetch_items(limit: Optional[int] = None) -> List[Item]:
    query = "SELECT * FROM items ORDER BY created_at DESC"
    params: Iterable[Any] = []
    if limit:
        query += " LIMIT ?"
        params = [limit]
    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()
    return [row_to_item(row) for row in rows]


def fetch_featured() -> Optional[Item]:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM items WHERE is_featured = 1 ORDER BY created_at DESC LIMIT 1"
        ).fetchone()
        if row:
            return row_to_item(row)
        row = conn.execute("SELECT * FROM items ORDER BY created_at DESC LIMIT 1").fetchone()
        return row_to_item(row) if row else None


def require_admin() -> Optional[Dict[str, str]]:
    token = request.headers.get("X-Admin-Token")
    if not token or token != ADMIN_TOKEN:
        return {"error": "Unauthorized"}
    return None


@app.route("/")
def root() -> Any:
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/admin")
def admin() -> Any:
    return send_from_directory(BASE_DIR, "admin.html")


@app.route("/api/items")
def api_items() -> Any:
    items = [asdict(item) for item in fetch_items()]
    return jsonify(items)


@app.route("/api/featured")
def api_featured() -> Any:
    featured = fetch_featured()
    return jsonify(asdict(featured) if featured else None)


@app.route("/api/admin/items", methods=["GET", "POST"])
def api_admin_items() -> Any:
    error = require_admin()
    if error:
        return jsonify(error), 401

    if request.method == "GET":
        items = [asdict(item) for item in fetch_items()]
        return jsonify(items)

    payload = request.get_json(silent=True) or {}
    title = str(payload.get("title", "")).strip()
    description = str(payload.get("description", "")).strip()
    kind = str(payload.get("kind", "video")).strip()
    duration = str(payload.get("duration", "")).strip() or None
    views = int(payload.get("views", 0) or 0)
    category = str(payload.get("category", "")).strip()
    thumbnail_url = str(payload.get("thumbnail_url", "")).strip()
    media_url = str(payload.get("media_url", "")).strip()
    is_featured = int(bool(payload.get("is_featured", False)))

    if not title or not description or not category or not thumbnail_url or not media_url:
        return jsonify({"error": "Missing required fields"}), 400

    if kind not in {"video", "image"}:
        return jsonify({"error": "Kind must be 'video' or 'image'"}), 400

    created_at = datetime.utcnow().isoformat()

    with get_connection() as conn:
        if is_featured:
            conn.execute("UPDATE items SET is_featured = 0")
        conn.execute(
            """
            INSERT INTO items
                (title, description, kind, duration, views, category, thumbnail_url, media_url, is_featured, created_at)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                title,
                description,
                kind,
                duration,
                views,
                category,
                thumbnail_url,
                media_url,
                is_featured,
                created_at,
            ),
        )
        conn.commit()

    return jsonify({"status": "ok"}), 201


@app.route("/api/admin/items/<int:item_id>/feature", methods=["POST"])
def api_admin_feature(item_id: int) -> Any:
    error = require_admin()
    if error:
        return jsonify(error), 401

    with get_connection() as conn:
        conn.execute("UPDATE items SET is_featured = 0")
        conn.execute("UPDATE items SET is_featured = 1 WHERE id = ?", (item_id,))
        conn.commit()

    return jsonify({"status": "ok"})


@app.route("/assets/<path:filename>")
def assets(filename: str) -> Any:
    return send_from_directory(os.path.join(BASE_DIR, "assets"), filename)


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=8000)
