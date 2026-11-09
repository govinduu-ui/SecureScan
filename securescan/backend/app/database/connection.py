import logging
import os
from typing import Optional, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("securescan.database")

_client: Optional[Any] = None
_database: Optional[Any] = None
_is_mock: bool = False
_provider: str = "mock"


async def connect_db() -> None:
    """Establish database connection (Supabase PostgreSQL / MongoDB Atlas / Local Mock)."""
    global _client, _database, _is_mock, _provider

    if _database is not None:
        return

    # 1. Supabase PostgreSQL Provider
    use_supabase = (
        settings.DATABASE_PROVIDER.lower() == "supabase"
        or (
            settings.DATABASE_PROVIDER.lower() == "auto"
            and settings.SUPABASE_URL
            and settings.SUPABASE_KEY
            and settings.MONGODB_URL == "mongodb://localhost:27017"
        )
    )

    if use_supabase and settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            from app.database.supabase_adapter import SupabaseDatabaseClient

            supa_client = SupabaseDatabaseClient(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            is_alive = await supa_client.ping()
            if is_alive:
                _client = supa_client
                _database = supa_client
                _is_mock = False
                _provider = "supabase"
                logger.info(f"Connected successfully to Supabase PostgreSQL at {settings.SUPABASE_URL}")
                return
            else:
                logger.warning("Supabase ping returned non-200. Check table creation or API keys.")
        except Exception as e:
            logger.warning(f"Could not connect to Supabase: {e}. Checking secondary options...")

    # 2. Live MongoDB Atlas Provider
    use_live_mongo = (
        settings.DATABASE_PROVIDER.lower() == "mongodb"
        or settings.MONGODB_URL.startswith("mongodb+srv://")
        or os.getenv("USE_REAL_MONGO") == "true"
        or (settings.MONGODB_URL != "mongodb://localhost:27017" and "localhost" not in settings.MONGODB_URL)
    )

    if use_live_mongo:
        try:
            real_client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=3000,
            )
            await real_client.admin.command("ping")
            _client = real_client
            _database = _client[settings.MONGODB_DB_NAME]
            _is_mock = False
            _provider = "mongodb"
            logger.info(f"Connected successfully to live MongoDB at {settings.MONGODB_URL}")

            # Performance indexes
            await _database.users.create_index("email", unique=True)
            await _database.scans.create_index("user_id")
            await _database.scans.create_index("created_at")
            await _database.findings.create_index("scan_id")
            await _database.reports.create_index("scan_id", unique=True)
            return
        except Exception as e:
            logger.warning(f"Could not connect to live MongoDB: {e}. Falling back to in-memory store.")

    # 3. In-memory MongoMock engine for zero-configuration local dev and testing
    try:
        from mongomock_motor import AsyncMongoMockClient

        _client = AsyncMongoMockClient()
        _database = _client[settings.MONGODB_DB_NAME]
        _is_mock = True
        _provider = "mock"
        logger.info("Operating in-memory MongoMock database engine.")
    except Exception as mock_err:
        logger.error(f"Failed to initialize in-memory database: {mock_err}")
        raise


async def close_db() -> None:
    """Close active database connections."""
    global _client, _database, _provider
    if _client is not None and not _is_mock and _provider == "mongodb":
        _client.close()
    _client = None
    _database = None
    _provider = "closed"


def get_database() -> Any:
    """Return the active database instance."""
    if _database is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _database


def is_mock_db() -> bool:
    """Return True if running on in-memory mock engine."""
    return _is_mock


def get_db_provider() -> str:
    """Return the active database provider: 'supabase', 'mongodb', or 'mock'."""
    return _provider
