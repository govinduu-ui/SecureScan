from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import FileResponse
from typing import List
import os

from app.core.dependencies import get_current_user
from app.database.connection import get_database
from app.schemas.report import ReportResponse, FindingsSummary
from app.services.report_service import generate_report, generate_pdf
from app.services.cloud_storage import cloud_storage

router = APIRouter()


@router.get("", response_model=List[ReportResponse])
async def list_reports(current_user: dict = Depends(get_current_user)):
    """List all reports generated for the current user."""
    db = get_database()
    cursor = db.reports.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)

    reports = []
    for doc in docs:
        reports.append(
            ReportResponse(
                id=doc["_id"],
                scan_id=doc["scan_id"],
                user_id=doc["user_id"],
                target_url=doc["target_url"],
                score=doc["score"],
                grade=doc["grade"],
                category_scores=doc.get("category_scores", {}),
                findings_summary=FindingsSummary(**doc.get("findings_summary", {})),
                created_at=doc["created_at"],
                cloud_report_url=doc.get("cloud_report_url"),
            )
        )
    return reports


@router.get("/{scan_id}", response_model=ReportResponse)
@router.get("/{scan_id}/report", response_model=ReportResponse)
async def get_report(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Get or generate a report for a completed scan."""
    db = get_database()

    # Verify scan ownership and completion
    scan_doc = await db.scans.find_one({"_id": scan_id, "user_id": current_user["_id"]})
    if not scan_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")

    if scan_doc["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scan is not yet completed",
        )

    # Check for existing report
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
            cloud_report_url=report_doc.get("cloud_report_url"),
        )

    # Generate new report
    report = await generate_report(scan_id, current_user["_id"])
    return report


@router.get("/{scan_id}/download")
async def download_pdf(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Download the PDF report for a completed scan."""
    db = get_database()

    # Verify scan ownership
    scan_doc = await db.scans.find_one({"_id": scan_id, "user_id": current_user["_id"]})
    if not scan_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")

    if scan_doc["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scan is not yet completed",
        )

    # Check for existing report or generate it
    report_doc = await db.reports.find_one({"scan_id": scan_id})
    if not report_doc:
        await generate_report(scan_id, current_user["_id"])
        report_doc = await db.reports.find_one({"scan_id": scan_id})

    # Generate PDF if it doesn't exist
    pdf_path = report_doc.get("pdf_path")
    pdf_filename = f"securescan-report-{scan_id[:8]}.pdf"
    if not pdf_path or not os.path.exists(pdf_path):
        findings_cursor = db.findings.find({"scan_id": scan_id})
        findings = await findings_cursor.to_list(length=100)
        pdf_path = generate_pdf(report_doc, findings)
        
        # Upload to cloud storage if enabled
        cloud_url = await cloud_storage.upload_pdf(pdf_path, pdf_filename)
        update_fields = {"pdf_path": pdf_path}
        if cloud_url:
            update_fields["cloud_report_url"] = cloud_url

        await db.reports.update_one(
            {"_id": report_doc["_id"]},
            {"$set": update_fields},
        )
    elif not report_doc.get("cloud_report_url"):
        # Upload if not previously in cloud
        cloud_url = await cloud_storage.upload_pdf(pdf_path, pdf_filename)
        if cloud_url:
            await db.reports.update_one(
                {"_id": report_doc["_id"]},
                {"$set": {"cloud_report_url": cloud_url}},
            )

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=pdf_filename,
    )
