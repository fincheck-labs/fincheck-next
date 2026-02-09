import torch
from cifar_model import CIFARCNN

model = CIFARCNN()
model.load_state_dict(torch.load("models/baseline_cifar.pth"))
model.eval()

x = torch.randn(1, 3, 32, 32)
y = model(x)

print(y.shape)  # MUST be [1, 10]
