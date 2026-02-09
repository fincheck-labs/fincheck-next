import cv2
import numpy as np
import torch
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import torchvision.transforms as transforms
from scipy import ndimage
import io
import random
import time
from torchvision.datasets import MNIST
from torchvision.transforms import GaussianBlur
from sklearn.metrics import confusion_matrix

from fastapi.responses import StreamingResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from model_def import MNISTCNN
from download_modes import ensure_models
import re
import pytesseract
import io
from torchvision.datasets import CIFAR10
from model_def import CIFARCNN



load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI missing from .env")


# =========================
# TORCH CONFIG
# =========================
torch.set_grad_enabled(False)
torch.backends.cudnn.benchmark = False
torch.backends.cudnn.deterministic = True

# =========================
# APP
# =========================
app = FastAPI()
# =========================
# MONGO CONNECTION
# =========================
mongo_client = MongoClient(MONGODB_URI)

# Atlas URL DB NAME → fintech-auth
mongo_db = mongo_client["fintech-auth"]

mongo_results = mongo_db["model_results"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"
DATA_DIR = BASE_DIR / "data"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MODEL_FILES = [
    "baseline_mnist.pth",
    "kd_mnist.pth",
    "lrf_mnist.pth",
    "pruned_mnist.pth",
    "quantized_mnist.pth",
    "ws_mnist.pth",
]

CIFAR_MODEL_FILES = [
    "baseline_cifar.pth",
    "kd_cifar.pth",
    "lrf_cifar.pth",
    "pruned_cifar.pth",
    "quantized_cifar.pth",
    "ws_cifar.pth",
]


# ==================================================
# PDF HELPER → BUILD METRIC TABLE
# ==================================================

def build_perturbation_transform(
    blur=0,
    rotation=0,
    noise_std=0,
    erase_pct=0
):
    t = [
        transforms.Grayscale(1),
        transforms.Resize((28, 28)),
    ]

    if rotation > 0:
        t.append(
            transforms.RandomRotation(
                degrees=(-rotation, rotation),
                fill=0
            )
        )

    if blur > 0:
        t.append(GaussianBlur(5, blur))

    t.append(transforms.ToTensor())

    if noise_std > 0:
        t.append(
            transforms.Lambda(
                lambda x: torch.clamp(
                    x + noise_std * torch.randn_like(x),
                    0, 1
                )
            )
        )

    if erase_pct > 0:
        t.append(
            transforms.RandomErasing(
                p=1.0,
                scale=(erase_pct, erase_pct),
                value=0
            )
        )

    return transforms.Compose(t)

def build_cifar_perturbation_transform(
    blur=0, rotation=0, noise_std=0
):
    t = [transforms.Resize((32, 32))]

    if rotation > 0:
        t.append(transforms.RandomRotation(rotation))

    if blur > 0:
        t.append(GaussianBlur(5, blur))

    t.append(transforms.ToTensor())

    if noise_std > 0:
        t.append(transforms.Lambda(
            lambda x: torch.clamp(x + noise_std * torch.randn_like(x), 0, 1)
        ))

    return transforms.Compose(t)


def build_pdf_metric_rows(result_models: dict):

    rows = [[
        "Model",
        "Confidence (%)",
        "Latency (ms)",
        "Entropy",
        "Stability",
        "Risk Score"
    ]]

    def pick(data, *keys, default="-"):
        for k in keys:
            if k in data and data[k] is not None:
                return round(data[k], 4) if isinstance(data[k], float) else data[k]
        return default

    for model_name, data in result_models.items():
        eval_data = data.get("evaluation", {})

        rows.append([
            model_name,
            pick(data, "confidence_percent", "confidence_mean"),
            pick(data, "latency_ms", "latency_mean"),
            pick(data, "entropy", "entropy_mean"),
            pick(data, "stability", "stability_mean"),
            pick(eval_data, "risk_score"),
        ])

    return rows


# =========================
# LOAD KD MNIST MODEL
# =========================

MNIST_MODELS = {}
CIFAR_MODELS = {}


@app.on_event("startup")
def startup_event():
    """
    Runs once when the app starts.
    Ensures models exist and loads them into memory.
    """
    ensure_models()
    load_models()


def load_models():
    MNIST_MODELS.clear()

    for f in MODEL_FILES:
        model_path = MODEL_DIR / f

        if not model_path.exists():
            raise RuntimeError(f"❌ Model file missing: {f}")

        model = MNISTCNN().to(DEVICE)
        model.load_state_dict(
            torch.load(model_path, map_location=DEVICE),
            strict=False,
        )
        model.eval()

        MNIST_MODELS[f] = model

    print("✅ MNIST models loaded into memory")

    for f in CIFAR_MODEL_FILES:
        model_path = MODEL_DIR / f
        model = CIFARCNN().to(DEVICE)
        model.load_state_dict(
            torch.load(model_path, map_location=DEVICE),
            strict=False
        )
        model.eval()
        CIFAR_MODELS[f] = model

    print("✅ CIFAR models loaded")

def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

# =========================
# TRANSFORM
# =========================
TRANSFORM = transforms.Compose([
    transforms.ToTensor(),  # already 28x28
])

CIFAR_CLEAN = transforms.Compose([
    transforms.Resize((32, 32)),
    transforms.ToTensor(),
])

def CIFAR_NOISY(std=0.1):
    return transforms.Compose([
        transforms.Resize((32, 32)),
        transforms.ToTensor(),
        transforms.Lambda(
            lambda x: torch.clamp(
                x + std * torch.randn_like(x), 0, 1
            )
        ),
    ])
#==================
# ENHANCE KEYSTROKE
#==================
def enhance_strokes(gray):
    kernel = np.ones((2, 2), np.uint8)

    # close gaps in strokes
    gray = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)

    # thicken strokes slightly
    gray = cv2.dilate(gray, kernel, iterations=0)

    return gray

# =========================
# CLEAN IMAGE (CHEQUE SAFE)
# =========================
def clean_image(img: Image.Image):
    img = np.array(img.convert("L"))

    img = enhance_strokes(img)

    _, img = cv2.threshold(
        img, 0, 255,
        cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )

    return img


# =========================
# MNIST NORMALIZATION (CRITICAL)
# =========================
def normalize_mnist_digit(digit_img):
    """
    Convert segmented digit into MNIST-style 28x28 image
    digit_img: binary image (white digit on black background)
    """

    # 1️⃣ Crop tight bounding box
    coords = cv2.findNonZero(digit_img)
    if coords is None:
        return None

    x, y, w, h = cv2.boundingRect(coords)
    digit_img = digit_img[y:y+h, x:x+w]

    # 2️⃣ Aspect-ratio safe resize (max side = 20)
    h, w = digit_img.shape
    scale = 20.0 / max(h, w)

    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))

    digit_img = cv2.resize(
        digit_img,
        (new_w, new_h),
        interpolation=cv2.INTER_AREA
    )

    # 3️⃣ Place in 28x28 canvas (centered)
    canvas = np.zeros((28, 28), dtype=np.uint8)
    y_offset = (28 - new_h) // 2
    x_offset = (28 - new_w) // 2

    canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = digit_img

    # 4️⃣ Center-of-mass alignment (CRITICAL for MNIST)
    cy, cx = ndimage.center_of_mass(canvas)

    if np.isnan(cx) or np.isnan(cy):
        return None

    shift_x = int(round(14 - cx))
    shift_y = int(round(14 - cy))

    canvas = ndimage.shift(
        canvas,
        shift=(shift_y, shift_x),
        mode="constant",
        cval=0
    )

    return Image.fromarray(canvas.astype(np.uint8))


# =========================
# SEGMENT DIGITS (OPENCV)
# =========================
def segment_digits(img):
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        img, connectivity=8
    )

    digits = []
    for i in range(1, num_labels):  # skip background
        x, y, w, h, area = stats[i]

        if area < 80 or w < 8 or h < 15:
            continue

        digit = img[y:y+h, x:x+w]
        digits.append((x, digit))

    digits.sort(key=lambda d: d[0])
    return [d[1] for d in digits]

# =========================
# MNIST INFERENCE
# =========================
@torch.inference_mode()
def classify_digit(img):
    model = MNIST_MODELS["kd_mnist.pth"]  # ✅ explicit

    tensor = TRANSFORM(img).unsqueeze(0).to(DEVICE)
    probs = torch.softmax(model(tensor), dim=1)[0]

    top = torch.topk(probs, 3)
    return [
        {
            "digit": int(d),
            "confidence": round(float(c * 100), 2)
        }
        for d, c in zip(top.indices.cpu(), top.values.cpu())
    ]


# =========================
# API
# =========================
# ==================================================
# TRANSFORMS
# ==================================================
CLEAN = transforms.Compose([
    transforms.Grayscale(1),
    transforms.Resize((28, 28)),
    transforms.ToTensor(),
])

def NOISY(std=0.2):
    return transforms.Compose([
        transforms.Grayscale(1),
        transforms.Resize((28, 28)),
        transforms.ToTensor(),
        transforms.Lambda(lambda x: torch.clamp(
            x + std * torch.randn_like(x), 0.0, 1.0
        )),
    ])

def BLUR():
    return transforms.Compose([
        transforms.Grayscale(1),
        transforms.Resize((28, 28)),
        GaussianBlur(5, 1.0),
        transforms.ToTensor(),
    ])

def NOISY_BLUR(std=0.2):
    return transforms.Compose([
        transforms.Grayscale(1),
        transforms.Resize((28, 28)),
        GaussianBlur(5, 1.0),
        transforms.ToTensor(),
        transforms.Lambda(lambda x: torch.clamp(
            x + std * torch.randn_like(x), 0.0, 1.0
        )),
    ])

def compute_far_frr_generic(y_true, y_pred, num_classes):
    cm = confusion_matrix(y_true, y_pred, labels=list(range(num_classes)))
    total = cm.sum()

    FARs, FRRs = [], []

    for c in range(num_classes):
        TP = cm[c, c]
        FP = cm[:, c].sum() - TP
        FN = cm[c, :].sum() - TP
        TN = total - TP - FP - FN

        FARs.append(FP / (FP + TN + 1e-8))
        FRRs.append(FN / (FN + TP + 1e-8))

    return cm.tolist(), round(np.mean(FARs), 4), round(np.mean(FRRs), 4)


def risk_score(FAR, FRR, alpha=0.5, beta=0.5):
    return round(alpha * FAR + beta * FRR, 4)

# ======================================================
# INFERENCE CORE
# ======================================================
@torch.inference_mode()
def run_batch(images, true_labels=None):
    batch = torch.stack(images).to(DEVICE)
    out = {}

    for name, model in MNIST_MODELS.items():
        start = time.perf_counter()
        logits = model(batch)
        probs = torch.softmax(logits, dim=1)
        preds = probs.argmax(dim=1).cpu().numpy()

        entry = {
            "latency_ms": round((time.perf_counter() - start) * 1000 / len(batch), 3),
            "confidence_percent": round(probs.max(dim=1).values.mean().item() * 100, 2),
            "entropy": round(float(-(probs * torch.log(probs + 1e-8)).sum(dim=1).mean()), 4),
            "stability": round(float(logits.std()), 4),
            "ram_mb": 0.0,
        }

        if true_labels is not None:
            cm, FAR, FRR = compute_far_frr_generic(true_labels, preds, num_classes=10)
            entry["evaluation"] = {
                "confusion_matrix": cm,
                "FAR": FAR,
                "FRR": FRR,
                "risk_score": risk_score(FAR, FRR)
            }

        out[name] = entry

    return out

@torch.inference_mode()
def run_batch_cifar(images, true_labels=None):
    batch = torch.stack(images).to(DEVICE)
    out = {}

    for name, model in CIFAR_MODELS.items():
        start = time.perf_counter()
        logits = model(batch)
        probs = torch.softmax(logits, dim=1)
        preds = probs.argmax(dim=1).cpu().numpy()

        entry = {
            "latency_ms": round((time.perf_counter() - start) * 1000 / len(batch), 3),
            "confidence_percent": round(
                probs.max(dim=1).values.mean().item() * 100, 2
            ),
            "entropy": round(
                float(-(probs * torch.log(probs + 1e-8)).sum(dim=1).mean()), 4
            ),
            "stability": round(float(logits.std()), 4),
            "ram_mb": 0.0,
        }

        if true_labels is not None:
            cm, FAR, FRR = compute_far_frr_generic(true_labels, preds, num_classes=10)
            entry["evaluation"] = {
                "confusion_matrix": cm,
                "FAR": FAR,
                "FRR": FRR,
                "risk_score": risk_score(FAR, FRR),
            }

        out[name] = entry

    return out

# ==================================================
# INFERENCE (MULTI RUN – NOISY)
# ==================================================
def run_noisy_multi_eval(build_fn, true_labels, runs=5):
    acc = {k: [] for k in MNIST_MODELS}
    all_preds = {k: [] for k in MNIST_MODELS}

    for r in range(runs):
        set_seed(42 + r)
        images = build_fn()
        res = run_batch(images)

        for m, v in res.items():
            acc[m].append(v)

        batch = torch.stack(images).to(DEVICE)
        for name, model in MNIST_MODELS.items():
            logits = model(batch)
            preds = torch.softmax(logits, dim=1).argmax(dim=1)
            all_preds[name].extend(preds.cpu().numpy())

    final = {}

    for m, vals in acc.items():
        entry = {
            "latency_mean": round(np.mean([x["latency_ms"] for x in vals]), 3),
            "latency_std": round(np.std([x["latency_ms"] for x in vals]), 3),
            "confidence_mean": round(np.mean([x["confidence_percent"] for x in vals]), 2),
            "confidence_std": round(np.std([x["confidence_percent"] for x in vals]), 2),
            "entropy_mean": round(np.mean([x["entropy"] for x in vals]), 4),
            "entropy_std": round(np.std([x["entropy"] for x in vals]), 4),
            "stability_mean": round(np.mean([x["stability"] for x in vals]), 4),
            "stability_std": round(np.std([x["stability"] for x in vals]), 4),
        }

        repeated_labels = true_labels * runs

        cm, FAR, FRR = compute_far_frr_generic(
            repeated_labels,
            all_preds[m],
            num_classes=10
        )

        entry["evaluation"] = {
            "confusion_matrix": cm,
            "FAR": FAR,
            "FRR": FRR,
            "risk_score": risk_score(FAR, FRR)
        }

        final[m] = entry

    return final

# ==================================================
# SINGLE IMAGE (WITH STRESS SUPPORT)
# ==================================================
@app.post("/run")
async def run(
    image: UploadFile = File(...),
    expected_digit: int = Form(...),

    # ⭐ STRESS CONTROLS
    blur: float = Form(0),
    rotation: float = Form(0),
    noise: float = Form(0),
    erase: float = Form(0),
):
    img = Image.open(io.BytesIO(await image.read())).convert("L")

    use_stress = blur > 0 or rotation > 0 or noise > 0 or erase > 0

    if use_stress:
        transform = build_perturbation_transform(
            blur=blur,
            rotation=rotation,
            noise_std=noise,
            erase_pct=erase
        )
        tensor_img = transform(img)
    else:
        tensor_img = CLEAN(img)

    # ---------- RUN INFERENCE ----------
    mnist_results = run_batch(
        [tensor_img],
        true_labels=[expected_digit]
    )

    # ---------- BUILD DOCUMENT ----------
    doc = {
        "data": {
            "MNIST": mnist_results
        },
        "meta": {
            "evaluation_type": "SINGLE",
            "source": "IMAGE_UPLOAD",
            "expected_digit": expected_digit,
            "stress_applied": use_stress,
            "createdAt": datetime.utcnow(),
        }
    }

    inserted = mongo_results.insert_one(doc)

    # ---------- RETURN ID ----------
    return {
        "id": str(inserted.inserted_id)
    }
@app.post("/run-dataset")
async def run_dataset(
    dataset_name: str = Form(None),

    # ⭐ STRESS PARAMS
    blur: float = Form(0),
    rotation: float = Form(0),
    noise: float = Form(0),
    erase: float = Form(0),
):
    # --------------------------------------------------
    # VALIDATION
    # --------------------------------------------------
    if not dataset_name:
        raise HTTPException(400, "dataset_name or zip_file required")

    # --------------------------------------------------
    # LOAD DATASETS
    # --------------------------------------------------
    base = MNIST(root=DATA_DIR, train=False, download=True)
    cifar = CIFAR10(root=DATA_DIR, train=False, download=True)

    # --------------------------------------------------
    # STRESS FLAG
    # --------------------------------------------------
    use_stress = blur > 0 or rotation > 0 or noise > 0 or erase > 0

    # --------------------------------------------------
    # CIFAR PIPELINE
    # --------------------------------------------------
    cifar_transform = (
        build_cifar_perturbation_transform(
            blur=blur,
            rotation=rotation,
            noise_std=noise
        )
        if use_stress
        else CIFAR_CLEAN
    )

    MAX_CIFAR = 1000
    cifar_imgs = [cifar_transform(cifar[i][0]) for i in range(MAX_CIFAR)]
    cifar_lbls = [cifar[i][1] for i in range(MAX_CIFAR)]
    cifar_results = run_batch_cifar(cifar_imgs, cifar_lbls)

    # --------------------------------------------------
    # MNIST PIPELINE
    # --------------------------------------------------
    if use_stress:
        mnist_transform = build_perturbation_transform(
            blur=blur,
            rotation=rotation,
            noise_std=noise,
            erase_pct=erase
        )
    else:
        mnist_transform = CLEAN

    # --------------------------------------------------
    # MNIST DATASET SELECTION
    # --------------------------------------------------
    images, labels = [], []

    if dataset_name == "MNIST_100":
        limit = 100
    elif dataset_name == "MNIST_500":
        limit = 500
    elif dataset_name == "MNIST_FULL":
        limit = len(base)
    elif dataset_name == "MNIST_NOISY_100":
        labels = [base[i][1] for i in range(100)]
        mnist_results = run_noisy_multi_eval(
            lambda: [NOISY()(base[i][0]) for i in range(100)],
            true_labels=labels
        )
        limit = 100
    elif dataset_name == "MNIST_NOISY_500":
        labels = [base[i][1] for i in range(500)]
        mnist_results = run_noisy_multi_eval(
            lambda: [NOISY()(base[i][0]) for i in range(500)],
            true_labels=labels
        )
        limit = 500
    elif dataset_name == "MNIST_NOISY_BLUR_100":
        labels = [base[i][1] for i in range(100)]
        mnist_results = run_noisy_multi_eval(
            lambda: [NOISY_BLUR()(base[i][0]) for i in range(100)],
            true_labels=labels
        )
        limit = 100
    elif dataset_name == "MNIST_NOISY_BLUR_500":
        labels = [base[i][1] for i in range(500)]
        mnist_results = run_noisy_multi_eval(
            lambda: [NOISY_BLUR()(base[i][0]) for i in range(500)],
            true_labels=labels
        )
        limit = 500
    else:
        raise HTTPException(400, "Unknown dataset")

    # --------------------------------------------------
    # NORMAL MNIST RUN
    # --------------------------------------------------
    if not dataset_name.startswith("MNIST_NOISY"):
        images = [mnist_transform(base[i][0]) for i in range(limit)]
        labels = [base[i][1] for i in range(limit)]
        mnist_results = run_batch(images, labels)

    # --------------------------------------------------
    # BUILD DOCUMENT
    # --------------------------------------------------
    doc = {
        "data": {
            "MNIST": mnist_results,
            "CIFAR": cifar_results
        },
        "meta": {
            "evaluation_type": "DATASET",
            "source": "PREBUILT",
            "dataset_type": dataset_name,
            "num_images": limit,
            "stress_applied": use_stress,
            "createdAt": datetime.utcnow(),
        }
    }

    inserted = mongo_results.insert_one(doc)

    # --------------------------------------------------
    # RETURN ID
    # --------------------------------------------------
    return {
        "id": str(inserted.inserted_id)
    }


# ==================================================
# OCR
# ==================================================
import pytesseract
@app.post("/verify")
async def verify(image: UploadFile = File(...), raw_text: str = Form(...)):
    img = Image.open(image.file).convert("L").resize((128, 32))

    ocr_text = pytesseract.image_to_string(
        img,
        config="--psm 10 --oem 1 -c tessedit_char_whitelist=0123456789",
    ).strip()

    errors = []

    max_len = max(len(raw_text), len(ocr_text))

    for i in range(max_len):
        typed_char = raw_text[i] if i < len(raw_text) else ""
        ocr_char = ocr_text[i] if i < len(ocr_text) else ""

        if typed_char != ocr_char:
            errors.append({
                "position": i + 1,
                "typed_char": typed_char,
                "ocr_char": ocr_char,
            })

    return {
        "verdict": "VALID_TYPED_TEXT" if not errors else "INVALID_OR_AMBIGUOUS",
        "final_output": ocr_text,
        "errors": errors,
        "why": (
            "OCR output perfectly matches typed text."
            if not errors
            else "One or more characters differ between typed text and OCR output."
        ),
    }
import base64

def encode_img(img):
    _, buf = cv2.imencode(".png", img)
    return base64.b64encode(buf).decode()
CONF_MARGIN = 5   # +/- window for ambiguous
@app.post("/verify-digit-only")
async def verify_digit_only(
    image: UploadFile = File(...),
    confidence_threshold: float = Form(0.90)  # 0.0 – 1.0
):
    try:
        raw = Image.open(image.file).convert("L")

        # ===== PREPROCESS =====
        cleaned = clean_image(raw)
        digit_imgs = segment_digits(cleaned)

        if not digit_imgs:
            return {
                "verdict": "INVALID",
                "digits": "",
                "analysis": [],
                "preview": None
            }

        threshold_pct = confidence_threshold * 100
        buffer_pct = threshold_pct - 5  

        analysis = []
        final_digits = []
        verdict = "VALID"

        preview_cropped = None
        preview_norm = None

        # ===== DIGIT LOOP =====
        for i, dimg in enumerate(digit_imgs):

            # Save first cropped preview
            if preview_cropped is None:
                preview_cropped = encode_img(dimg)

            mnist_img = normalize_mnist_digit(dimg)

            if mnist_img is None:
                verdict = "INVALID"

                analysis.append({
                    "position": i + 1,
                    "predicted": None,
                    "confidence": 0,
                    "status": "INVALID"
                })

                final_digits.append("?")
                continue

            # Save normalized preview
            if preview_norm is None:
                preview_norm = encode_img(np.array(mnist_img))

            # ===== MODEL INFERENCE (.pth) =====
            preds = classify_digit(mnist_img)
            best = preds[0]

            conf = best["confidence"]

            # ===== B MODE DECISION =====
            if conf >= threshold_pct:
                status = "VALID"

            elif conf >= buffer_pct:
                status = "AMBIGUOUS"
                if verdict != "INVALID":
                    verdict = "AMBIGUOUS"

            else:
                status = "INVALID"
                verdict = "INVALID"

            analysis.append({
                "position": i + 1,
                "predicted": str(best["digit"]),
                "confidence": conf,
                "status": status,
                "possible_values": [p["digit"] for p in preds]
            })

            final_digits.append(str(best["digit"]))

        return {
            "verdict": verdict,
            "digits": "".join(final_digits),
            "analysis": analysis,
            "preview": {
                "original": encode_img(np.array(raw)),
                "cropped": preview_cropped,
                "normalized": preview_norm
            }
        }

    except Exception as e:
        return {
            "verdict": "ERROR",
            "message": str(e)
        }
# ==================================================
# PDF EXPORT
# ==================================================
from bson import ObjectId
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime
import io

@app.get("/export/pdf/{id}")
def export_pdf_from_db(id: str):
    try:
        # =========================
        # FETCH RESULT FROM DB
        # =========================
        doc = mongo_results.find_one({"_id": ObjectId(id)})

        if not doc:
            raise HTTPException(404, "Result not found")

        models_by_family = doc["data"]   # { MNIST: {...}, CIFAR: {...} }
        meta = doc.get("meta", {})

        # =========================
        # PDF SETUP
        # =========================
        buffer = io.BytesIO()
        styles = getSampleStyleSheet()
        story = []

        # ---------- TITLE ----------
        story.append(Paragraph("Model Evaluation Report", styles["Title"]))
        story.append(Spacer(1, 12))

        story.append(
            Paragraph(
                f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
                styles["Normal"],
            )
        )
        story.append(Spacer(1, 16))

        # ---------- META ----------
        story.append(Paragraph("Experiment Settings", styles["Heading2"]))
        for k, v in meta.items():
            story.append(Paragraph(f"{k}: {v}", styles["Normal"]))
        story.append(Spacer(1, 20))

        # =========================
        # FAMILY-WISE RESULTS
        # =========================
        for family, models in models_by_family.items():

            # ---- METRICS TABLE ----
            story.append(Paragraph(f"{family} Models", styles["Heading2"]))
            story.append(Table(build_pdf_metric_rows(models)))
            story.append(Spacer(1, 20))

            # ---- CONFUSION MATRICES ----
            story.append(
                Paragraph(f"{family} Confusion Matrices", styles["Heading3"])
            )

            for model_name, data in models.items():
                eval_data = data.get("evaluation")
                if not eval_data:
                    continue

                story.append(
                    Paragraph(model_name, styles["Heading4"])
                )
                story.append(Table(eval_data["confusion_matrix"]))
                story.append(Spacer(1, 12))

            story.append(Spacer(1, 20))

        # =========================
        # BUILD PDF
        # =========================
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

    except Exception as e:
        raise HTTPException(500, str(e))



def preprocess(image: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blur, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11, 2
    )
    return thresh


def crop_amount_digits_roi(image: np.ndarray) -> np.ndarray:
    h, w, _ = image.shape
    return image[int(h * 0.40):int(h * 0.55), int(w * 0.58):int(w * 0.95)]


def preprocess_digits(image: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    _, thresh = cv2.threshold(
        gray, 0, 255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )
    return thresh
def extract_amount(text: str):
    text = text.upper()

    # ---------- WORDS ----------
    word_match = re.search(r"([A-Z\s]+RUPEES\s+ONLY)", text)
    amount_words = word_match.group(1).strip() if word_match else None

    # ---------- DIGITS ----------
    digit_patterns = [
        r"₹\s*([\d,]+)",
        r"RS\.?\s*([\d,]+)",
        r"([\d,]+)\s*/",        # matches 10,000/
        r"\b([\d,]{3,})\b",     # fallback for large numbers
    ]

    amount_digits = None
    for pattern in digit_patterns:
        match = re.search(pattern, text)
        if match:
            amount_digits = match.group(1)
            break

    return amount_digits, amount_words
WORD_TO_NUM = {
    "ZERO": 0, "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4,
    "FIVE": 5, "SIX": 6, "SEVEN": 7, "EIGHT": 8, "NINE": 9,
    "TEN": 10, "ELEVEN": 11, "TWELVE": 12, "THIRTEEN": 13,
    "FOURTEEN": 14, "FIFTEEN": 15, "SIXTEEN": 16,
    "SEVENTEEN": 17, "EIGHTEEN": 18, "NINETEEN": 19,
    "TWENTY": 20, "THIRTY": 30, "FORTY": 40,
    "FIFTY": 50, "SIXTY": 60, "SEVENTY": 70,
    "EIGHTY": 80, "NINETY": 90,
}

MULTIPLIERS = {
    "HUNDRED": 100,
    "THOUSAND": 1_000,
    "LAKH": 100_000, "LAKHS": 100_000,
    "CRORE": 10_000_000, "CRORES": 10_000_000,
}


def words_to_number(words: str | None) -> int | None:
    if not words:
        return None

    words = (
        words.replace("RUPEES", "")
             .replace("ONLY", "")
             .strip()
    )

    total = 0
    current = 0

    for token in words.split():
        if token in WORD_TO_NUM:
            current += WORD_TO_NUM[token]
        elif token in MULTIPLIERS:
            if current == 0:
                current = 1
            current *= MULTIPLIERS[token]
            total += current
            current = 0
        else:
            return None  # unsafe OCR

    return total + current
def normalize_digits(digits: str | None) -> int | None:
    if not digits:
        return None
    return int(digits.replace(",", ""))
from ultralytics import YOLO
from pathlib import Path
# Load YOLOv8 nano model (custom trained)
YOLO_MODEL_PATH = Path("models/amount_words_yolov8n.pt")
yolo_words_model = None

def get_yolo_model():
    global yolo_words_model

    if not YOLO_MODEL_PATH.exists():
        return None  # ❗ model not available → skip YOLO safely

    if yolo_words_model is None:
        yolo_words_model = YOLO(str(YOLO_MODEL_PATH))

    return yolo_words_model
def yolo_detect_amount_words(image: np.ndarray):
    model = get_yolo_model()
    if model is None:
        return None

    results = model(image, conf=0.4, verbose=False)

    for r in results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            return x1, y1, x2, y2

    return None

@app.post("/extract-cheque-amount")
async def extract_cheque_amount(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_np = np.array(image)

    # ---------- WORDS OCR (FAST PATH) ----------
    processed_full = preprocess(image_np)
    text_full = pytesseract.image_to_string(
        processed_full,
        config="--psm 6"
    )

    # ---------- DIGITS OCR ----------
    roi = crop_amount_digits_roi(image_np)
    roi_processed = preprocess_digits(roi)

    text_digits = pytesseract.image_to_string(
        roi_processed,
        config="--psm 7 -c tessedit_char_whitelist=0123456789,/"
    )

    amount_digits, amount_words = extract_amount(
        (text_full + " " + text_digits).upper()
    )

    digit_value = normalize_digits(amount_digits)
    word_value = words_to_number(amount_words)

    # ---------- INITIAL VERIFICATION ----------
    if digit_value is None or word_value is None:
        status = "UNVERIFIED"
    elif digit_value == word_value:
        status = "MATCH"
    else:
        status = "MISMATCH"

    # ---------- YOLO FALLBACK ----------
    used_yolo=False
    if status == "UNVERIFIED":
        bbox = yolo_detect_amount_words(image_np)

        if bbox:
            used_yolo = True
            x1, y1, x2, y2 = bbox

            words_roi = image_np[y1:y2, x1:x2]
            processed_words = preprocess(words_roi)

            retry_text = pytesseract.image_to_string(
                processed_words,
                config="--psm 6"
            )

            retry_words = extract_amount(retry_text.upper())[1]
            retry_word_value = words_to_number(retry_words)

            if retry_word_value is not None and retry_word_value == digit_value:
                status = "MATCH"
                amount_words = retry_words
                word_value = retry_word_value

    return {
    "amount_digits": amount_digits,
    "amount_words": amount_words,
    "digits_value": digit_value,
    "words_value": word_value,
    "verification_status": status,
    "used_yolo_fallback": used_yolo,
    "raw_ocr_text": text_full,
    "digits_roi_ocr": text_digits,
}

from bson import ObjectId

@app.get("/results/{id}")
def get_result(id: str):
    doc = mongo_results.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(404, "Result not found")

    doc["_id"] = str(doc["_id"])
    return doc