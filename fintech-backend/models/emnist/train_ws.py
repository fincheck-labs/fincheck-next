import torch
import os
from common import BaselineCNN

# ------------------------------------------------------------------
# Absolute-safe paths
# ------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PTH_DIR = os.path.join(BASE_DIR, "..", "emnist_pth")

BASELINE_PATH = os.path.join(PTH_DIR, "baseline_mnist.pth")
OUT_PATH = os.path.join(PTH_DIR, "ws_mnist.pth")

# Safety checks
assert os.path.exists(BASELINE_PATH), f"Baseline model not found at {BASELINE_PATH}"

# ------------------------------------------------------------------
# Load baseline model
# ------------------------------------------------------------------
model = BaselineCNN()
model.load_state_dict(torch.load(BASELINE_PATH, map_location="cpu"))
model.eval()

# ------------------------------------------------------------------
# Weight Sharing via value tying (rounding)
# ------------------------------------------------------------------
with torch.no_grad():
    for param in model.parameters():
        param.copy_(param.round(decimals=2))

# ------------------------------------------------------------------
# Save model
# ------------------------------------------------------------------
torch.save(model.state_dict(), OUT_PATH)
print("✅ Weight-sharing model saved at:", OUT_PATH)
