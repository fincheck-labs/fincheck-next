from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from bson import ObjectId
from pymongo import MongoClient
import io
from datetime import datetime

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet

router = APIRouter()

# =========================================================
# MONGO
# =========================================================
client = MongoClient("mongodb://localhost:27017")
db = client["fintech"]
collection = db["model_results"]


# =========================================================
# SAFE OBJECT ID
# =========================================================
def parse_object_id(id_str: str):
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(400, "Invalid ObjectId")


# =========================================================
# METRIC FLATTEN (PDF SAFE)
# =========================================================
def flatten_metrics(doc):

    rows = []

    for model, data in doc.get("data", {}).items():

        # Handles normal + noisy dataset outputs
        confidence = data.get("confidence_percent") or data.get("confidence_mean")
        latency = data.get("latency_ms") or data.get("latency_mean")
        entropy = data.get("entropy") or data.get("entropy_mean")
        stability = data.get("stability") or data.get("stability_mean")

        eval_data = data.get("evaluation", {})

        rows.append({
            "model": model,
            "confidence": confidence,
            "latency": latency,
            "entropy": entropy,
            "stability": stability,
            "risk_score": eval_data.get("risk_score"),
            "cm": eval_data.get("confusion_matrix")
        })

    return rows


# =========================================================
# PDF EXPORT
# =========================================================
@router.get("/export/pdf/{id}")
def export_pdf(id: str):

    oid = parse_object_id(id)

    doc = collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Result not found")

    buffer = io.BytesIO()
    styles = getSampleStyleSheet()
    story = []

    # =====================================================
    # HEADER
    # =====================================================
    story.append(Paragraph("MNIST Evaluation Report", styles["Title"]))
    story.append(Spacer(1, 12))

    story.append(
        Paragraph(
            f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
            styles["Normal"]
        )
    )

    story.append(Spacer(1, 10))

    # =====================================================
    # META
    # =====================================================
    meta = doc.get("meta", {})

    story.append(Paragraph("Experiment Settings", styles["Heading2"]))
    story.append(Spacer(1, 6))

    for k, v in meta.items():
        story.append(Paragraph(f"{k}: {v}", styles["Normal"]))

    story.append(Spacer(1, 16))

    # =====================================================
    # METRIC TABLE
    # =====================================================
    story.append(Paragraph("Model Metrics", styles["Heading2"]))
    story.append(Spacer(1, 8))

    rows = flatten_metrics(doc)

    table_data = [[
        "Model",
        "Confidence %",
        "Latency ms",
        "Entropy",
        "Stability",
        "Risk"
    ]]

    for r in rows:
        table_data.append([
            r["model"],
            r["confidence"],
            r["latency"],
            r["entropy"],
            r["stability"],
            r["risk_score"],
        ])

    story.append(Table(table_data))
    story.append(Spacer(1, 20))

    # =====================================================
    # CONFUSION MATRICES
    # =====================================================
    story.append(Paragraph("Confusion Matrices", styles["Heading2"]))
    story.append(Spacer(1, 10))

    for r in rows:
        if not r["cm"]:
            continue

        story.append(Paragraph(r["model"], styles["Heading3"]))
        story.append(Table(r["cm"]))
        story.append(Spacer(1, 12))

    # =====================================================
    # BUILD PDF
    # =====================================================
    pdf = SimpleDocTemplate(buffer)
    pdf.build(story)

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=result_{id}.pdf"
        },
    )
