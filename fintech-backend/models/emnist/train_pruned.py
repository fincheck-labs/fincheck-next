import torch
import torch.nn.utils.prune as prune
from common import BaselineCNN

model = BaselineCNN()
model.load_state_dict(torch.load("../../models/emnist_pth/baseline_mnist.pth"))

for module in model.modules():
    if isinstance(module, torch.nn.Conv2d) or isinstance(module, torch.nn.Linear):
        prune.l1_unstructured(module, name="weight", amount=0.4)
        prune.remove(module, "weight")

torch.save(model.state_dict(), "../../models/emnist_pth/pruned_mnist.pth")
