import torch
import torch.nn.functional as F
import torch.nn as nn

from cifar_model import CIFARCNN
from cifar_data import get_cifar_loaders

device = "cpu"

teacher = CIFARCNN().to(device)
teacher.load_state_dict(torch.load("models/baseline_cifar.pth"))
teacher.eval()

student = CIFARCNN().to(device)

train_loader, _ = get_cifar_loaders()

optimizer = torch.optim.Adam(student.parameters(), lr=1e-3)

T = 4.0
alpha = 0.7

for epoch in range(5):
    for x, y in train_loader:
        x, y = x.to(device), y.to(device)

        with torch.no_grad():
            t_logits = teacher(x)

        s_logits = student(x)

        kd_loss = F.kl_div(
            F.log_softmax(s_logits / T, dim=1),
            F.softmax(t_logits / T, dim=1),
            reduction="batchmean"
        ) * (T * T)

        ce_loss = F.cross_entropy(s_logits, y)
        loss = alpha * kd_loss + (1 - alpha) * ce_loss

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

torch.save(student.state_dict(), "models/kd_cifar.pth")
