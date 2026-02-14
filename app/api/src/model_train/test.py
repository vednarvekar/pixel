import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from sklearn.metrics import confusion_matrix, classification_report
import os

DEVICE = torch.device("cpu")
DATA_DIR = "dataset"
MODEL_PATH = "models/best_model.pth"

# -----------------------
# Transform
# -----------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# -----------------------
# Dataset
# -----------------------
test_dataset = datasets.ImageFolder(os.path.join(DATA_DIR, "test"), transform=transform)
test_loader = DataLoader(test_dataset, batch_size=16)

# -----------------------
# Load Model
# -----------------------
model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, 2)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model = model.to(DEVICE)
model.eval()

# -----------------------
# Evaluation
# -----------------------
all_preds = []
all_labels = []
correct = 0

with torch.no_grad():
    for images, labels in test_loader:
        images, labels = images.to(DEVICE), labels.to(DEVICE)
        outputs = model(images)
        _, predicted = torch.max(outputs, 1)

        correct += (predicted == labels).sum().item()
        all_preds.extend(predicted.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

accuracy = correct / len(test_dataset)

print(f"\nTest Accuracy: {accuracy*100:.2f}%\n")

print("Confusion Matrix:")
print(confusion_matrix(all_labels, all_preds))

print("\nClassification Report:")
print(classification_report(all_labels, all_preds, target_names=test_dataset.classes))


# Find the filenames of the mistakes
for i in range(len(all_preds)):
    if all_preds[i] != all_labels[i]:
        full_path, _ = test_dataset.samples[i]
        filename = os.path.basename(full_path)
        actual = test_dataset.classes[all_labels[i]]
        pred = test_dataset.classes[all_preds[i]]
        print(f"Mistake: {filename} is actually {actual.upper()}, but predicted as {pred.upper()}")