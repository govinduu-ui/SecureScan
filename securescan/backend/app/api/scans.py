from fastapi import APIRouter, HTTPException, status, Depends, Query, BackgroundTasks
from typing import Optional

from app.core.dependencies import get_current_user
from app.database.connection import get_database
from app.schemas.scan import ScanCreateRequest, ScanResponse, ScanListResponse
from app.schemas.finding import FindingResponse, FindingsListResponse
from app.schemas.report import ReportResponse, FindingsSummary
from app.models.scan import ScanModel
from app.services.scan_service import run_scan
from app.services.report_service import generate_report

router = APIRouter()


def _scan_doc_to_response(doc: dict) -> ScanResponse:
    """Convert a MongoDB scan document to a ScanResponse."""
    return ScanResponse(
        id=doc["_id"],
        user_id=doc["user_id"],
        target_url=doc["target_url"],
        status=doc["status"],
        score=doc.get("score"),
        grade=doc.get("grade"),
        category_scores=doc.get("category_scores"),
        findings_count=doc.get("findings_count", 0),
        duration_ms=doc.get("duration_ms"),
        raw_headers=doc.get("raw_headers"),
        error_message=doc.get("error_message"),
        created_at=doc["created_at"],
        completed_at=doc.get("completed_at"),
    )


@router.post("", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    request: ScanCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Start a new security scan for the given URL."""
    db = get_database()

    scan = ScanModel(
        user_id=current_user["_id"],
        target_url=request.target_url,
    )
    scan_doc = scan.model_dump(by_alias=True)
    await db.scans.insert_one(scan_doc)

    # Increment user scan count
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"scan_count": 1}},
    )

    # Run the scan in the background
    background_tasks.add_task(run_scan, scan.id)

    return _scan_doc_to_response(scan_doc)


@router.get("", response_model=ScanListResponse)
async def list_scans(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: dict = Depends(get_current_user),
):
    """List all scans for the current user with pagination."""
    db = get_database()

    query = {"user_id": current_user["_id"]}
    if status_filter:
        query["status"] = status_filter

    total = await db.scans.count_documents(query)
    skip = (page - 1) * page_size

    cursor = db.scans.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    docs = await cursor.to_list(length=page_size)

    return ScanListResponse(
        scans=[_scan_doc_to_response(doc) for doc in docs],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Get details for a specific scan."""
    db = get_database()

    doc = await db.scans.find_one({"_id": scan_id, "user_id": current_user["_id"]})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")

    return _scan_doc_to_response(doc)


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a scan and its associated findings and reports."""
    db = get_database()

    doc = await db.scans.find_one({"_id": scan_id, "user_id": current_user["_id"]})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")

    await db.findings.delete_many({"scan_id": scan_id})
    await db.reports.delete_many({"scan_id": scan_id})
    await db.scans.delete_one({"_id": scan_id})

    # Decrement user scan count
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"scan_count": -1}},
    )

    return None


@router.get("/{scan_id}/findings", response_model=FindingsListResponse)
async def get_scan_findings(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Get all findings for a specific scan."""
    db = get_database()

    # Verify scan ownership
    scan_doc = await db.scans.find_one({"_id": scan_id, "user_id": current_user["_id"]})
    if not scan_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")

    cursor = db.findings.find({"scan_id": scan_id}).sort("created_at", 1)
    docs = await cursor.to_list(length=100)

    findings = [
        FindingResponse(
            id=d["_id"],
            scan_id=d["scan_id"],
            check_id=d["check_id"],
            title=d["title"],
            description=d["description"],
            severity=d["severity"],
            category=d["category"],
            points_earned=d["points_earned"],
            points_possible=d["points_possible"],
            details=d.get("details"),
            recommendation=d.get("recommendation"),
            created_at=d["created_at"],
        )
        for d in docs
    ]

    return FindingsListResponse(findings=findings, total=len(findings))


@router.get("/{scan_id}/report", response_model=ReportResponse)
async def get_scan_report(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Get or generate a report for a completed scan."""
    db = get_database()
    scan_doc = await db.scans.find_one({"_id": scan_id, "user_id": current_user["_id"]})
    if not scan_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")

    if scan_doc["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scan is not yet completed",
        )

    report_doc = await db.reports.find_one({"scan_id": scan_id})
    if report_doc:
        return ReportResponse(
            id=report_doc["_id"],
            scan_id=report_doc["scan_id"],
            user_id=report_doc["user_id"],
            target_url=report_doc["target_url"],
            score=report_doc["score"],
            grade=report_doc["grade"],
            category_scores=report_doc["category_scores"],
            findings_summary=FindingsSummary(**report_doc["findings_summary"]),
            created_at=report_doc["created_at"],
        )

    return await generate_report(scan_id, current_user["_id"])

