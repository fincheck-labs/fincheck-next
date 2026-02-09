import torch
from cifar_model import CIFARCNN

model = CIFARCNN()
model.load_state_dict(torch.load("models/baseline_cifar.pth"))

for p in model.parameters():
    p.data = torch.round(p.data * 128) / 128

torch.save(model.state_dict(), "models/ws_cifar.pth")
