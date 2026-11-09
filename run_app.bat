@echo off
echo ========================================================
echo Starting SecureScan Platform (Frontend + Backend)
echo ========================================================
echo.
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "SecureScan Backend" cmd /k "python -m uvicorn main:app --app-dir securescan/backend --port 8000 --reload"

echo Starting Vite Frontend on http://localhost:3000 ...
start "SecureScan Frontend" cmd /k "npm --prefix securescan/frontend run dev"

echo.
echo SecureScan running:
echo - Frontend: http://localhost:3000
echo - Backend:  http://127.0.0.1:8000
echo - Docs:     http://127.0.0.1:8000/docs
echo ========================================================

