"""Report generation and ReportLab PDF document compilation service."""

import os
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)

from app.database.connection import get_database
from app.schemas.report import ReportResponse, FindingsSummary
from app.scanner.scoring import DISCLAIMER

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "reports_storage")
os.makedirs(REPORTS_DIR, exist_ok=True)


async def generate_report(scan_id: str, user_id: str) -> ReportResponse:
    """Create or retrieve a ScanReport document in MongoDB."""
    db = get_database()

    scan_doc = await db.scans.find_one({"_id": scan_id, "user_id": user_id})
    if not scan_doc:
        raise ValueError("Scan not found")

    cursor = db.findings.find({"scan_id": scan_id})
    findings = await cursor.to_list(length=200)

    # Compute findings summary
    summary_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        sev = f.get("severity", "info").lower()
        if sev in summary_counts:
            summary_counts[sev] += 1

    findings_summary = FindingsSummary(
        critical=summary_counts["critical"],
        high=summary_counts["high"],
        medium=summary_counts["medium"],
        low=summary_counts["low"],
        info=summary_counts["info"],
    )

    report_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    report_doc = {
        "_id": report_id,
        "scan_id": scan_id,
        "user_id": user_id,
        "target_url": scan_doc["target_url"],
        "score": scan_doc.get("score", 0),
        "grade": scan_doc.get("grade", "N/A"),
        "category_scores": scan_doc.get("category_scores", {}),
        "findings_summary": findings_summary.model_dump(),
        "created_at": now,
    }

    # Upsert report
    await db.reports.update_one(
        {"scan_id": scan_id},
        {"$set": report_doc},
        upsert=True,
    )

    return ReportResponse(
        id=report_id,
        scan_id=scan_id,
        user_id=user_id,
        target_url=scan_doc["target_url"],
        score=scan_doc.get("score", 0),
        grade=scan_doc.get("grade", "N/A"),
        category_scores=scan_doc.get("category_scores", {}),
        findings_summary=findings_summary,
        created_at=now,
    )


def generate_pdf(report_doc: Dict[str, Any], findings: List[Dict[str, Any]]) -> str:
    """Compile an enterprise-grade PDF report using ReportLab."""
    scan_id = report_doc["scan_id"]
    filename = f"securescan-report-{scan_id[:8]}.pdf"
    pdf_path = os.path.join(REPORTS_DIR, filename)

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#090D16"),
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748B"),
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#0D1322"),
        spaceBefore=14,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
    )
    mono_style = ParagraphStyle(
        "CodeText",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#64748B"),
    )

    elements = []

    # Header Bar
    elements.append(Paragraph("SECURESCAN • SECURITY ASSESSMENT REPORT", title_style))
    elements.append(Paragraph("Enterprise Automated Passive Posture Audit • Confidential", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#00E5FF"), spaceBefore=2, spaceAfter=12))

    # Executive Summary Card Table
    score = report_doc.get("score", 0)
    grade = report_doc.get("grade", "N/A")
    target_url = report_doc.get("target_url", "N/A")
    created_at = report_doc.get("created_at")
    date_str = created_at.strftime("%Y-%m-%d %H:%M UTC") if hasattr(created_at, "strftime") else str(created_at)[:19]

    summary_data = [
        [
            Paragraph("<b>Target Domain:</b>", body_style),
            Paragraph(target_url, mono_style),
            Paragraph("<b>Posture Grade:</b>", body_style),
            Paragraph(f"<font color='#00626e'><b>{grade} ({score}/100)</b></font>", body_style),
        ],
        [
            Paragraph("<b>Assessment ID:</b>", body_style),
            Paragraph(scan_id, mono_style),
            Paragraph("<b>Evaluation Date:</b>", body_style),
            Paragraph(date_str, body_style),
        ],
    ]

    summary_table = Table(summary_data, colWidths=[1.3 * inch, 2.5 * inch, 1.2 * inch, 1.8 * inch])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 14))

    # Category Breakdown Table
    elements.append(Paragraph("Category Performance Breakdown", section_heading))
    cat_scores = report_doc.get("category_scores", {})

    cat_data = [
        ["Category", "Score Earned", "Max Points", "Compliance Status"],
        ["TLS & HTTPS Protocols", f"{cat_scores.get('tls_https', 0)} pts", "25 pts", "PASSED" if cat_scores.get("tls_https", 0) >= 20 else "ATTENTION"],
        ["HTTP Security Headers", f"{cat_scores.get('security_headers', 0)} pts", "45 pts", "PASSED" if cat_scores.get("security_headers", 0) >= 35 else "HARDENING NEEDED"],
        ["Cookie Security Policies", f"{cat_scores.get('cookie_security', 0)} pts", "15 pts", "PASSED" if cat_scores.get("cookie_security", 0) >= 10 else "REVIEW FLAGS"],
        ["Information Disclosure", f"{cat_scores.get('information_disclosure', 0)} pts", "15 pts", "PASSED" if cat_scores.get("information_disclosure", 0) >= 10 else "MINIMIZE HEADERS"],
    ]

    cat_table = Table(cat_data, colWidths=[2.6 * inch, 1.3 * inch, 1.3 * inch, 1.6 * inch])
    cat_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0D1322")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FFFFFF")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8.5),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(cat_table)
    elements.append(Spacer(1, 14))

    # Findings Summary Counts Table
    findings_sum = report_doc.get("findings_summary", {})
    elements.append(Paragraph("Vulnerability & Hygiene Telemetry", section_heading))

    stat_data = [
        ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"],
        [
            str(findings_sum.get("critical", 0)),
            str(findings_sum.get("high", 0)),
            str(findings_sum.get("medium", 0)),
            str(findings_sum.get("low", 0)),
            str(findings_sum.get("info", 0)),
        ],
    ]
    stat_table = Table(stat_data, colWidths=[1.36 * inch] * 5)
    stat_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#FFE4E6")),
        ("TEXTCOLOR", (0, 0), (0, 0), colors.HexColor("#9F1239")),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#FFEDD5")),
        ("TEXTCOLOR", (1, 0), (1, 0), colors.HexColor("#9A3412")),
        ("BACKGROUND", (2, 0), (2, 0), colors.HexColor("#FEF3C7")),
        ("TEXTCOLOR", (2, 0), (2, 0), colors.HexColor("#92400E")),
        ("BACKGROUND", (3, 0), (3, 0), colors.HexColor("#E0F2FE")),
        ("TEXTCOLOR", (3, 0), (3, 0), colors.HexColor("#0369A1")),
        ("BACKGROUND", (4, 0), (4, 0), colors.HexColor("#F1F5F9")),
        ("TEXTCOLOR", (4, 0), (4, 0), colors.HexColor("#334155")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("FONTSIZE", (0, 1), (-1, 1), 13),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(stat_table)
    elements.append(Spacer(1, 16))

    # Detailed Findings List
    elements.append(Paragraph("Evaluated Security Checks & Actionable Remediations", section_heading))

    for idx, f in enumerate(findings, 1):
        sev = f.get("severity", "info").upper()
        title = f.get("title", "Check")
        desc = f.get("description", "")
        details = f.get("details", "")
        rec = f.get("recommendation", "")
        pts = f"{f.get('points_earned', 0)} / {f.get('points_possible', 0)} pts"

        sev_color = "#10B981" if sev == "PASS" else ("#F43F5E" if sev in ("CRITICAL", "HIGH") else "#F59E0B")

        finding_block = [
            Paragraph(f"<b>#{idx}. {title}</b> — <font color='{sev_color}'><b>[{sev}]</b></font> ({pts})", body_style),
            Paragraph(f"<b>Observation:</b> {desc}", body_style),
        ]
        if details:
            finding_block.append(Paragraph(f"<b>Evidence:</b> {details}", mono_style))
        if rec and sev != "PASS":
            finding_block.append(Paragraph(f"<b>Action Required:</b> {rec}", body_style))

        elements.append(KeepTogether(finding_block))
        elements.append(Spacer(1, 8))

    # Formal Legal & Methodology Disclaimer
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#94A3B8"), spaceBefore=4, spaceAfter=8))
    elements.append(Paragraph(f"<b>Disclaimer:</b> {DISCLAIMER}", disclaimer_style))

    doc.build(elements)
    return pdf_path

