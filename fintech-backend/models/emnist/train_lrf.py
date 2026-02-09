import torch
import torch.nn as nn
import os
from common import BaselineCNN

# ------------------------------------------------------------------
# Absolute-safe paths (NO dependency on working directory)
# ------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PTH_DIR = os.path.join(BASE_DIR, "..", "emnist_pth")

BASELINE_PATH = os.path.join(PTH_DIR, "baseline_mnist.pth")
OUT_PATH = os.path.join(PTH_DIR, "lrf_mnist.pth")

# Safety checks
assert os.path.exists(BASELINE_PATH), f"Baseline model not found at {BASELINE_PATH}"

# ------------------------------------------------------------------
# Load baseline model
# ------------------------------------------------------------------
model = BaselineCNN()
model.load_state_dict(torch.load(BASELINE_PATH, map_location="cpu"))
model.eval()

# ------------------------------------------------------------------
# Apply Low-Rank Factorization to first FC layer after Flatten
# ------------------------------------------------------------------
fc = model.net[7]  # nn.Linear(64*5*5 -> 128)

W = fc.weight.data
U, S, Vh = torch.linalg.svd(W, full_matrices=False)

rank = 40  # safe compression rank

fc1 = nn.Linear(Vh.shape[1], rank, bias=False)
fc2 = nn.Linear(rank, U.shape[0], bias=True)

fc1.weight.data = Vh[:rank, :]
fc2.weight.data = U[:, :rank] @ torch.diag(S[:rank])
fc2.bias.data = fc.bias.data.clone()

model.net[7] = nn.Sequential(fc1, fc2)

# ------------------------------------------------------------------
# Save compressed model
# ------------------------------------------------------------------
torch.save(model.state_dict(), OUT_PATH)
print("✅ LRF model saved at:", OUT_PATH)
