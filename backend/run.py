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

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        app_dir=str(backend_dir),
        log_level="info",
    )