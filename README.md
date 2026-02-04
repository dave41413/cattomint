# cattomint

A retro-styled cat video + image portal with a lightweight backend, SQLite database, and an admin panel for managing uploads.

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# required: set a secure admin token
export CATTOMINT_ADMIN_TOKEN="your-secret-token"

python app.py
```

Visit:
- `http://localhost:8000/` for the public site.
- `http://localhost:8000/admin` for the admin panel.

## Admin panel notes

- Set your admin token in the header input (saved in local storage).
- Add video or image URLs that you host yourself.
- Toggle the featured item with the "Make featured" button.

## Data storage

Uploads are stored in `cattomint.db` (SQLite) in the project root. Delete the file to reset the catalog.

## Hosting configuration

- `CATTOMINT_HOST` (default `127.0.0.1`) controls the bind address.
- `CATTOMINT_PORT` (default `8000`) controls the port.
