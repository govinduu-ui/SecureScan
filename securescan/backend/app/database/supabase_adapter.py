"""Supabase PostgREST async database client adapter for SecureScan.

Allows SecureScan to run natively on Supabase PostgreSQL tables using the same
clean async collection interface (find, find_one, insert_one, update_one, etc.)
over standard async HTTP without needing heavy ORM dependencies.
"""

import json
import logging
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger("securescan.supabase_db")


def _serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Serialize datetime and complex values for Supabase PostgREST JSON."""
    out = {}
    for k, v in doc.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


class SupabaseCursor:
    """Async cursor supporting chained sort, skip, limit, and to_list."""

    def __init__(self, client: "SupabaseDatabaseClient", table: str, params: Dict[str, str]):
        self.client = client
        self.table = table
        self.params = dict(params)

    def sort(self, field: str, direction: int = 1) -> "SupabaseCursor":
        order_dir = "asc" if direction == 1 else "desc"
        self.params["order"] = f"{field}.{order_dir}"
        return self

    def skip(self, offset: int) -> "SupabaseCursor":
        if offset > 0:
            self.params["offset"] = str(offset)
        return self

    def limit(self, count: int) -> "SupabaseCursor":
        if count > 0:
            self.params["limit"] = str(count)
        return self

    async def to_list(self, length: int = 100) -> List[Dict[str, Any]]:
        if "limit" not in self.params:
            self.params["limit"] = str(length)
        return await self.client._get(self.table, self.params)


class SupabaseCollection:
    """Emulates an asynchronous MongoDB collection on top of a Supabase table."""

    def __init__(self, client: "SupabaseDatabaseClient", table_name: str):
        self.client = client
        self.table_name = table_name

    def _build_filter_params(self, filter_dict: Optional[Dict[str, Any]]) -> Dict[str, str]:
        params = {}
        if not filter_dict:
            return params
        for k, v in filter_dict.items():
            if isinstance(v, dict):
                for op, val in v.items():
                    if op == "$eq":
                        params[k] = f"eq.{val}"
                    elif op == "$in":
                        params[k] = f"in.({','.join(str(x) for x in val)})"
            elif v is not None:
                params[k] = f"eq.{v}"
        return params

    async def find_one(self, filter_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        params = self._build_filter_params(filter_dict)
        params["limit"] = "1"
        rows = await self.client._get(self.table_name, params)
        return rows[0] if rows else None

    def find(self, filter_dict: Optional[Dict[str, Any]] = None) -> SupabaseCursor:
        params = self._build_filter_params(filter_dict)
        return SupabaseCursor(self.client, self.table_name, params)

    async def insert_one(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        sanitized = await self.client._sanitize_doc(self.table_name, doc)
        await self.client._post(self.table_name, sanitized)
        return {"inserted_id": doc.get("_id")}

    async def insert_many(self, docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not docs:
            return {"inserted_ids": []}
        sanitized = [await self.client._sanitize_doc(self.table_name, d) for d in docs]
        await self.client._post(self.table_name, sanitized)
        return {"inserted_ids": [d.get("_id") for d in docs]}

    async def update_one(
        self, filter_dict: Dict[str, Any], update_dict: Dict[str, Any], upsert: bool = False
    ) -> Dict[str, Any]:
        params = self._build_filter_params(filter_dict)
        data = update_dict.get("$set", update_dict)
        sanitized = await self.client._sanitize_doc(self.table_name, data)

        if upsert:
            existing = await self.find_one(filter_dict)
            if not existing:
                combined = {**filter_dict, **sanitized}
                sanitized_combined = await self.client._sanitize_doc(self.table_name, combined)
                await self.client._post(self.table_name, sanitized_combined)
                return {"modified_count": 1, "upserted_id": combined.get("_id")}

        await self.client._patch(self.table_name, params, sanitized)
        return {"modified_count": 1}

    async def delete_one(self, filter_dict: Dict[str, Any]) -> Dict[str, Any]:
        params = self._build_filter_params(filter_dict)
        params["limit"] = "1"
        await self.client._delete(self.table_name, params)
        return {"deleted_count": 1}

    async def delete_many(self, filter_dict: Dict[str, Any]) -> Dict[str, Any]:
        params = self._build_filter_params(filter_dict)
        await self.client._delete(self.table_name, params)
        return {"deleted_count": 1}

    async def count_documents(self, filter_dict: Optional[Dict[str, Any]] = None) -> int:
        params = self._build_filter_params(filter_dict)
        params["select"] = "count"
        return await self.client._count(self.table_name, params)

    async def create_index(self, *args, **kwargs) -> None:
        """No-op for compatibility (indexes managed via SQL in Supabase)."""
        pass


class SupabaseDatabaseClient:
    """Async database client managing Supabase collections."""

    def __init__(self, supabase_url: str, supabase_key: str):
        clean_url = re.sub(r"/rest(/v1)?/?$", "", supabase_url.strip()).rstrip("/")
        self.base_url = f"{clean_url}/rest/v1"
        self.headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        self._columns_cache: Dict[str, List[str]] = {}

        # Standard collections
        self.users = SupabaseCollection(self, "users")
        self.scans = SupabaseCollection(self, "scans")
        self.findings = SupabaseCollection(self, "findings")
        self.reports = SupabaseCollection(self, "reports")

    def __getitem__(self, item: str) -> SupabaseCollection:
        return SupabaseCollection(self, item)

    async def get_table_columns(self, table: str) -> Optional[List[str]]:
        """Fetch known column names for a table from PostgREST OpenAPI schema cache."""
        if table in self._columns_cache:
            return self._columns_cache[table]
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/?apikey={self.headers['apikey']}")
                if resp.status_code == 200:
                    defs = resp.json().get("definitions", {})
                    for t_name, t_def in defs.items():
                        self._columns_cache[t_name] = list(t_def.get("properties", {}).keys())
                    return self._columns_cache.get(table)
        except Exception as e:
            logger.warning(f"Could not fetch columns for {table}: {e}")
        return None

    async def _sanitize_doc(self, table: str, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Align payload attributes to match the exact Supabase table schema."""
        cols = await self.get_table_columns(table)
        serialized = _serialize_doc(doc)
        if not cols:
            return serialized

        # Smart mapping: hashed_password <-> password_hash
        if "hashed_password" in serialized and "password_hash" in cols and "hashed_password" not in cols:
            serialized["password_hash"] = serialized["hashed_password"]
        elif "password_hash" in serialized and "hashed_password" in cols and "password_hash" not in cols:
            serialized["hashed_password"] = serialized["password_hash"]

        # Only retain columns that exist in the database table
        return {k: v for k, v in serialized.items() if k in cols}

    async def _get(self, table: str, params: Dict[str, str]) -> List[Dict[str, Any]]:
        # Validate filter columns
        cols = await self.get_table_columns(table)
        filtered_params = {}
        for k, v in params.items():
            if k in ("limit", "offset", "order", "select") or cols is None or k in cols:
                filtered_params[k] = v
            else:
                # If filter is on a column that doesn't exist, return empty results without 400 error
                logger.info(f"Skipping filter for non-existent column '{k}' on table '{table}'")
                return []

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{self.base_url}/{table}", headers=self.headers, params=filtered_params)
            resp.raise_for_status()
            rows = resp.json()

            # Normalize password_hash -> hashed_password for Python models
            for r in rows:
                if "password_hash" in r and "hashed_password" not in r:
                    r["hashed_password"] = r["password_hash"]
                if "hashed_password" in r and "password_hash" not in r:
                    r["password_hash"] = r["hashed_password"]
            return rows

    async def _post(self, table: str, data: Any) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(f"{self.base_url}/{table}", headers=self.headers, json=data)
            resp.raise_for_status()
            try:
                return resp.json()
            except Exception:
                return []

    async def _patch(self, table: str, params: Dict[str, str], data: Dict[str, Any]) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.patch(
                f"{self.base_url}/{table}", headers=self.headers, params=params, json=data
            )
            resp.raise_for_status()
            try:
                return resp.json()
            except Exception:
                return []

    async def _delete(self, table: str, params: Dict[str, str]) -> None:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.delete(f"{self.base_url}/{table}", headers=self.headers, params=params)
            resp.raise_for_status()

    async def _count(self, table: str, params: Dict[str, str]) -> int:
        headers = dict(self.headers)
        headers["Prefer"] = "count=exact"
        headers["Range-Unit"] = "items"
        headers["Range"] = "0-0"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{self.base_url}/{table}", headers=headers, params=params)
            content_range = resp.headers.get("content-range")
            if content_range and "/" in content_range:
                try:
                    return int(content_range.split("/")[1])
                except (ValueError, IndexError):
                    pass
            rows = resp.json() if resp.status_code == 200 else []
            return len(rows)

    async def ping(self) -> bool:
        """Verify Supabase PostgREST connection."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/users?limit=1", headers=self.headers)
                return resp.status_code in (200, 206)
        except Exception:
            return False
