import torch
import torch.nn.utils.prune as prune

from cifar_model import CIFARCNN

model = CIFARCNN()
model.load_state_dict(torch.load("models/baseline_cifar.pth"))

for module in model.modules():
    if isinstance(module, torch.nn.Conv2d):
        prune.l1_unstructured(module, name="weight", amount=0.3)
        prune.remove(module, "weight")

torch.save(model.state_dict(), "models/pruned_cifar.pth")
