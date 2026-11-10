import sys
from pathlib import Path

# Ensure backend directory is in sys.path regardless of execution working directory
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database.connection import connect_db, close_db, is_mock_db, get_db_provider
from app.services.cloud_storage import cloud_storage
from app.api.auth import router as auth_router
from app.api.scans import router as scans_router
from app.api.reports import router as reports_router
from app.api.analytics import router as analytics_router
from app.middleware.error_handler import register_error_handlers
from app.middleware.rate_limiter import limiter


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Manage application startup and shutdown."""
    await connect_db()
    # Seed default enterprise demo user if not present
    try:
        from app.database.connection import get_database
        from app.core.security import hash_password
        db = get_database()
        demo_email = "lead@fintech-soc.internal"
        existing = await db.users.find_one({"email": demo_email})
        if not existing:
            demo_user = {
                "_id": "securescan-default-demo-user-id",
                "name": "SecOps Lead Engineer",
                "email": demo_email,
                "username": "secops_lead",
                "password_hash": hash_password("ProductionPassword2026!"),
                "hashed_password": hash_password("ProductionPassword2026!"),
                "is_active": True,
                "scan_count": 0,
            }
            await db.users.insert_one(demo_user)
    except Exception:
        pass
    yield
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Security scanner API for analyzing website security posture",
    lifespan=lifespan,
)

# Rate limiter
app.state.limiter = limiter

# CORS
cors_origins = settings.CORS_ORIGINS
if isinstance(cors_origins, str):
    cors_origins = [cors_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handlers
register_error_handlers(app)

# Routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(scans_router, prefix="/api/scans", tags=["Scans"])
app.include_router(reports_router, prefix="/api/reports", tags=["Reports"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "health_url": "/api/health",
        "message": "SecureScan Enterprise API is online. Connect the frontend web application to interact with the scanner platform.",
    }


@app.get("/healthz", tags=["Health"])
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check():
    cloud_status = await cloud_storage.get_storage_status()
    provider = get_db_provider()
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "database": {
            "provider": provider,
            "connected": True,
            "is_cloud_database": provider in ("supabase", "mongodb"),
            "database_name": settings.MONGODB_DB_NAME,
        },
        "cloud_storage": cloud_status,
    }


@app.get("/api/system/storage-status", tags=["System"])
async def storage_status():
    """Retrieve detailed status of database and object cloud storage."""
    cloud_status = await cloud_storage.get_storage_status()
    provider = get_db_provider()
    return {
        "database": {
            "provider": provider,
            "connected": True,
            "is_cloud_database": provider in ("supabase", "mongodb"),
            "database_name": settings.MONGODB_DB_NAME,
        },
        "cloud_storage": cloud_status,
    }
