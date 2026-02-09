import torch
import torch.nn as nn

from cifar_model import CIFARCNN

model = CIFARCNN()
model.load_state_dict(torch.load("models/baseline_cifar.pth"))

W = model.fc1.weight.data
U, S, V = torch.svd(W)

rank = 64

model.fc1 = nn.Sequential(
    nn.Linear(V.size(0), rank, bias=False),
    nn.Linear(rank, U.size(0), bias=True)
)

model.fc1[0].weight.data = V[:, :rank].T
model.fc1[1].weight.data = (U[:, :rank] @ torch.diag(S[:rank]))

torch.save(model.state_dict(), "models/lrf_cifar.pth")
