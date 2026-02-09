import torch
from cifar_model import CIFARCNN
from cifar_data import get_cifar_loaders

device = "cpu"
_, test_loader = get_cifar_loaders(batch_size=128)

# Rebuild quantized model structure
model = CIFARCNN()
model.qconfig = torch.quantization.get_default_qconfig("fbgemm")
torch.quantization.prepare(model, inplace=True)

# Calibration
with torch.no_grad():
    model(torch.randn(1, 3, 32, 32))

torch.quantization.convert(model, inplace=True)

# Load quantized weights
model.load_state_dict(torch.load("models/quantized_cifar.pth", map_location=device))
model.eval()

correct, total = 0, 0
with torch.no_grad():
    for x, y in test_loader:
        outputs = model(x)
        preds = outputs.argmax(dim=1)
        correct += (preds == y).sum().item()
        total += y.size(0)

print(f"Quantized : {correct/total:.4f}")
