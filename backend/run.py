# /backend/run.py
"""
Development server runner.
Usage: python backend/run.py  (or cd backend && python run.py)
"""

import sys
from pathlib import Path
import uvicorn

# Ensure the backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    # Default to production if on Render, otherwise check ENVIRONMENT
    is_dev = os.environ.get("ENVIRONMENT", "development").lower() == "development"
    if os.environ.get("RENDER") == "true" or os.environ.get("RENDER") == "1":
        is_dev = False

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=is_dev,
        app_dir=str(backend_dir),
        log_level="info",
    )