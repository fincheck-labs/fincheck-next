import torch
import torch.nn as nn
import torch.optim as optim

from cifar_model import CIFARCNN
from cifar_data import get_cifar_loaders

device = "cpu"

model = CIFARCNN().to(device)
train_loader, test_loader = get_cifar_loaders()

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3)

for epoch in range(10):
    model.train()
    for x, y in train_loader:
        x, y = x.to(device), y.to(device)

        optimizer.zero_grad()
        loss = criterion(model(x), y)
        loss.backward()
        optimizer.step()

    print(f"Epoch {epoch+1} done")

torch.save(model.state_dict(), "models/baseline_cifar.pth")
