import torch
import torch.nn as nn
import torch.nn.functional as F
from cifar_data import get_cifar_loaders
from cifar_model import CIFARCNN

# =============================
# LRF-compatible architecture
# =============================
class CIFARCNN_LRF(nn.Module):
    def __init__(self, num_classes=10, rank=64):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)

        self.fc1 = nn.Sequential(
            nn.Linear(128 * 4 * 4, rank, bias=False),
            nn.Linear(rank, 256, bias=True),
        )
        self.fc2 = nn.Linear(256, num_classes)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        x = x.view(x.size(0), -1)
        x = F.relu(self.fc1(x))
        return self.fc2(x)


# =============================
# Setup
# =============================
device = "cpu"
_, test_loader = get_cifar_loaders(batch_size=128)


def evaluate(model):
    model.eval()
    correct, total = 0, 0
    with torch.no_grad():
        for x, y in test_loader:
            x, y = x.to(device), y.to(device)
            out = model(x)
            pred = out.argmax(dim=1)
            correct += (pred == y).sum().item()
            total += y.size(0)
    return correct / total


# =============================
# FLOAT + LRF MODELS
# =============================
models = [
    ("Baseline", "models/baseline_cifar.pth", CIFARCNN),
    ("KD", "models/kd_cifar.pth", CIFARCNN),
    ("Pruned", "models/pruned_cifar.pth", CIFARCNN),
    ("WS", "models/ws_cifar.pth", CIFARCNN),
    ("LRF", "models/lrf_cifar.pth", CIFARCNN_LRF),
]

print("=== Float / LRF Models ===")
for name, path, model_cls in models:
    model = model_cls().to(device)
    model.load_state_dict(torch.load(path, map_location=device))
    acc = evaluate(model)
    print(f"{name:12s}: {acc:.4f}")


# =============================
# DYNAMIC QUANTIZATION MODEL
# =============================
print("\n=== Dynamic Quantized Model ===")

try:
    # Load baseline
    model = CIFARCNN().to(device)
    model.load_state_dict(
        torch.load("models/baseline_cifar.pth", map_location=device)
    )
    model.eval()

    # Apply dynamic quantization (Linear layers only)
    model = torch.quantization.quantize_dynamic(
        model,
        {nn.Linear},
        dtype=torch.qint8
    )

    acc = evaluate(model)
    print(f"Quantized-Dynamic : {acc:.4f}")

except Exception as e:
    print("Quantized-Dynamic : SKIPPED")
    print("Reason           :", type(e).__name__)
