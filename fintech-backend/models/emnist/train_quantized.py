import torch
from common import BaselineCNN

model = BaselineCNN()
model.load_state_dict(torch.load("../../models/emnist_pth/baseline_mnist.pth"))
model.eval()

quantized = torch.quantization.quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8
)

torch.save(quantized.state_dict(), "../../models/emnist_pth/quantized_mnist.pth")
