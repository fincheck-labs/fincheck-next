import torch
import torch.nn as nn
from common import BaselineCNN, get_dataloader

device = "cuda" if torch.cuda.is_available() else "cpu"

model = BaselineCNN().to(device)
loader = get_dataloader()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
criterion = nn.CrossEntropyLoss()

for epoch in range(5):
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        loss = criterion(model(x), y)
        loss.backward()
        optimizer.step()

torch.save(model.state_dict(), "../../models/emnist_pth/baseline_mnist.pth")
