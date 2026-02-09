import torch
from cifar_model import CIFARCNN

model = CIFARCNN()
model.load_state_dict(torch.load("models/baseline_cifar.pth"))
model.eval()

model.qconfig = torch.quantization.get_default_qconfig("fbgemm")
torch.quantization.prepare(model, inplace=True)

# dummy calibration
x = torch.randn(1, 3, 32, 32)
model(x)

torch.quantization.convert(model, inplace=True)

torch.save(model.state_dict(), "models/quantized_cifar.pth")
