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

    # 3. In-memory MongoMock / pure-python fallback engine for zero-configuration deployments
    try:
        from mongomock_motor import AsyncMongoMockClient

        _client = AsyncMongoMockClient()
        _database = _client[settings.MONGODB_DB_NAME]
        _is_mock = True
        _provider = "mock"
        logger.info("Operating in-memory MongoMock database engine.")
        return
    except Exception as mock_err:
        logger.warning(f"mongomock_motor not available ({mock_err}); initializing internal async in-memory store.")

    # 4. Pure Python Async In-Memory fallback store (guarantees zero-crash startup anywhere)
    class _InMemoryCursor:
        def __init__(self, docs):
            self.docs = list(docs)
            self._idx = 0

        def sort(self, field: str, direction: int = 1):
            rev = direction == -1
            self.docs.sort(key=lambda d: d.get(field) or "", reverse=rev)
            return self

        def skip(self, offset: int):
            self.docs = self.docs[offset:]
            return self

        def limit(self, count: int):
            self.docs = self.docs[:count]
            return self

        async def to_list(self, length: Optional[int] = None):
            if length is not None:
                return self.docs[:length]
            return self.docs

        def __aiter__(self):
            self._idx = 0
            return self

        async def __anext__(self):
            if self._idx < len(self.docs):
                val = self.docs[self._idx]
                self._idx += 1
                return val
            raise StopAsyncIteration

    class _InMemoryCollection:
        def __init__(self, name: str):
            self.name = name
            self.docs = []

        def _matches(self, doc: dict, query: dict) -> bool:
            if not query:
                return True
            for k, v in query.items():
                if k.startswith("$"):
                    continue
                if isinstance(v, dict):
                    continue
                if doc.get(k) != v:
                    return False
            return True

        async def find_one(self, query: Optional[dict] = None) -> Optional[dict]:
            import copy
            for d in self.docs:
                if self._matches(d, query or {}):
                    return copy.deepcopy(d)
            return None

        def find(self, query: Optional[dict] = None):
            import copy
            matched = [copy.deepcopy(d) for d in self.docs if self._matches(d, query or {})]
            return _InMemoryCursor(matched)

        async def insert_one(self, doc: dict) -> Any:
            import copy
            new_doc = copy.deepcopy(doc)
            self.docs.append(new_doc)
            class Res:
                inserted_id = new_doc.get("_id")
            return Res()

        async def insert_many(self, docs: list) -> Any:
            import copy
            for d in docs:
                self.docs.append(copy.deepcopy(d))

        async def update_one(self, query: dict, update: dict, upsert: bool = False) -> Any:
            import copy
            target = None
            for d in self.docs:
                if self._matches(d, query):
                    target = d
                    break
            if target is not None:
                if "$set" in update:
                    target.update(copy.deepcopy(update["$set"]))
                if "$inc" in update:
                    for k, v in update["$inc"].items():
                        target[k] = target.get(k, 0) + v
            elif upsert:
                new_doc = copy.deepcopy(query)
                if "$set" in update:
                    new_doc.update(copy.deepcopy(update["$set"]))
                self.docs.append(new_doc)

        async def delete_one(self, query: dict) -> Any:
            for i, d in enumerate(self.docs):
                if self._matches(d, query):
                    del self.docs[i]
                    break

        async def delete_many(self, query: dict) -> Any:
            self.docs = [d for d in self.docs if not self._matches(d, query)]

        async def count_documents(self, query: Optional[dict] = None) -> int:
            return sum(1 for d in self.docs if self._matches(d, query or {}))

        async def create_index(self, *args, **kwargs) -> None:
            pass

    class _InMemoryDatabase:
        def __init__(self):
            self._colls = {}

        def __getitem__(self, name: str) -> _InMemoryCollection:
            if name not in self._colls:
                self._colls[name] = _InMemoryCollection(name)
            return self._colls[name]

        def __getattr__(self, name: str) -> _InMemoryCollection:
            return self[name]

    mem_db = _InMemoryDatabase()
    _client = mem_db
    _database = mem_db
    _is_mock = True
    _provider = "mock"
    logger.info("Operating in pure Python async in-memory database store.")


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
