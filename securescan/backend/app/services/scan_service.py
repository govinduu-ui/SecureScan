"""Background scan execution service."""

import logging
from datetime import datetime, timezone
import uuid

from app.database.connection import get_database
from app.scanner.engine import execute_passive_scan
from app.scanner.validator import ValidationError

logger = logging.getLogger("securescan.services.scan")


async def run_scan(scan_id: str) -> None:
    """Execute the full passive scan lifecycle for a given scan_id."""
    db = get_database()

    scan_doc = await db.scans.find_one({"_id": scan_id})
    if not scan_doc:
        logger.error(f"Scan {scan_id} not found in database.")
        return

    target_url = scan_doc["target_url"]

    # Mark as running
    await db.scans.update_one(
        {"_id": scan_id},
        {"$set": {"status": "running", "started_at": datetime.now(timezone.utc)}},
    )

    try:
        results = await execute_passive_scan(target_url)

        # Store individual findings in findings collection
        findings_to_insert = []
        for finding in results["findings"]:
            finding_doc = {
                "_id": str(uuid.uuid4()),
                "scan_id": scan_id,
                "check_id": finding["check_id"],
                "title": finding["title"],
                "description": finding["description"],
                "severity": finding["severity"],
                "category": finding["category"],
                "points_earned": finding["points_earned"],
                "points_possible": finding["points_possible"],
                "details": finding.get("details"),
                "recommendation": finding.get("recommendation"),
                "created_at": datetime.now(timezone.utc),
            }
            findings_to_insert.append(finding_doc)

        if findings_to_insert:
            await db.findings.insert_many(findings_to_insert)

        # Update scan record to completed
        await db.scans.update_one(
            {"_id": scan_id},
            {
                "$set": {
                    "status": "completed",
                    "score": results["score"],
                    "grade": results["grade"],
                    "category_scores": results["category_scores"],
                    "findings_count": results["findings_count"],
                    "duration_ms": results["duration_ms"],
                    "raw_headers": results.get("raw_headers", []),
                    "completed_at": datetime.now(timezone.utc),
                }
            },
        )
        logger.info(f"Scan {scan_id} for {target_url} completed successfully. Score: {results['score']} ({results['grade']})")

    except ValidationError as ve:
        logger.warning(f"Scan {scan_id} validation error: {ve}")
        await db.scans.update_one(
            {"_id": scan_id},
            {
                "$set": {
                    "status": "failed",
                    "error_message": str(ve),
                    "completed_at": datetime.now(timezone.utc),
                }
            },
        )
    except Exception as e:
        logger.error(f"Scan {scan_id} failed with unhandled exception: {e}", exc_info=True)
        await db.scans.update_one(
            {"_id": scan_id},
            {
                "$set": {
                    "status": "failed",
                    "error_message": f"Scan failed: {str(e)}",
                    "completed_at": datetime.now(timezone.utc),
                }
            },
        )

