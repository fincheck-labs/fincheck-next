import requests
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# GitHub release info
RELEASE_TAG = "v1-models"
BASE_URL = f"https://github.com/mukesh1352/fincheck-next/releases/download/{RELEASE_TAG}"

# Model variants and datasets
VARIANTS = [
    "baseline",
    "kd",
    "lrf",
    "pruned",
    "quantized",
    "ws",
]

DATASETS = ["mnist", "cifar"]

# Build model filenames dynamically
MODELS = [
    f"{variant}_{dataset}.pth"
    for variant in VARIANTS
    for dataset in DATASETS
]

def ensure_models():
    missing = [name for name in MODELS if not (MODEL_DIR / name).exists()]

    if not missing:
        print("✅ All model files already present")
        return

    print(f"⬇️ Downloading {len(missing)} missing model(s)")

    for name in missing:
        url = f"{BASE_URL}/{name}"
        dest = MODEL_DIR / name

        print(f"⬇️ {name}")
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()

        with open(dest, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

    print("🎉 Model download complete")

if __name__ == "__main__":
    ensure_models()