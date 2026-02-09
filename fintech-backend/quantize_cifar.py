# quantize_cifar.py

import torch
from pathlib import Path
from model_def import CIFARCNN

DEVICE = torch.device("cpu")

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"

SRC = MODEL_DIR / "baseline_cifar.pth"
DST = MODEL_DIR / "quantized_cifar.pth"

print("Loading:", SRC)

# Load baseline CIFAR model
model = CIFARCNN().to(DEVICE)
model.load_state_dict(torch.load(SRC, map_location=DEVICE))
model.eval()

# --------------------------------------------------
# Fake post-training quantization (weights only)
# FLOAT SAFE — no PyTorch quantized tensors
# --------------------------------------------------
with torch.no_grad():
    for name, param in model.named_parameters():
        if "weight" in name:
            scale = 127.0 / param.abs().max()
            q = torch.round(param * scale)
            param.copy_(q / scale)

# Save FLOAT model (server-compatible)
torch.save(model.state_dict(), DST)

print("✅ quantized_cifar.pth saved at:", DST)
