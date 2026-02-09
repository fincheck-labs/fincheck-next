import torch
import torch.nn as nn
from common import BaselineCNN, get_dataloader

device = "cuda" if torch.cuda.is_available() else "cpu"

teacher = BaselineCNN().to(device)
teacher.load_state_dict(torch.load("../../models/emnist_pth/baseline_mnist.pth"))
teacher.eval()

student = BaselineCNN().to(device)
loader = get_dataloader()

optimizer = torch.optim.Adam(student.parameters(), lr=1e-3)
ce = nn.CrossEntropyLoss()
kl = nn.KLDivLoss(reduction="batchmean")

T = 4.0
alpha = 0.7

for epoch in range(5):
    for x, y in loader:
        x, y = x.to(device), y.to(device)

        with torch.no_grad():
            t_logits = teacher(x)

        s_logits = student(x)

        loss = alpha * kl(
            nn.functional.log_softmax(s_logits / T, dim=1),
            nn.functional.softmax(t_logits / T, dim=1)
        ) * (T * T) + (1 - alpha) * ce(s_logits, y)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

torch.save(student.state_dict(), "../../models/emnist_pth/kd_mnist.pth")
