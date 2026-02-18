import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from tqdm import tqdm
import os
import json
from pathlib import Path
from sklearn.metrics import classification_report

# -----------------------
# Config
# -----------------------
BATCH_SIZE = 32                      # ↑ increased batch size
EPOCHS = 25                          # ↑ train longer
LR = 1e-4                            # ↓ lower LR for stability
WEIGHT_DECAY = 1e-4
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# DATA_DIR = "dataset"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "dataset")

MODELS_DIR = "models"
Path(MODELS_DIR).mkdir(exist_ok=True)

PATIENCE = 5                         # ↑ more patience
best_val_acc = 0.0
patience_counter = 0

print(f"Using device: {DEVICE}")

# -----------------------
# Stronger Augmentation
# -----------------------
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),   # prevents size memorization
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(0.2, 0.2, 0.2, 0.1),             # prevents color bias
    transforms.RandomRotation(10),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# -----------------------
# Dataset
# -----------------------
train_dataset = datasets.ImageFolder(os.path.join(DATA_DIR, "train"), transform=train_transform)
val_dataset = datasets.ImageFolder(os.path.join(DATA_DIR, "val"), transform=val_transform)

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)

print("Classes:", train_dataset.classes)

# -----------------------
# Handle Class Imbalance
# -----------------------
class_counts = torch.tensor([
    len(os.listdir(os.path.join(DATA_DIR, "train", cls)))
    for cls in train_dataset.classes
], dtype=torch.float)

class_weights = 1.0 / class_counts
class_weights = class_weights / class_weights.sum()

# -----------------------
# Model
# -----------------------
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# Freeze everything first
for param in model.parameters():
    param.requires_grad = False

# Unfreeze last TWO blocks (controlled fine-tuning)
for param in model.layer3.parameters():
    param.requires_grad = True

for param in model.layer4.parameters():
    param.requires_grad = True

# Replace classifier
num_features = model.fc.in_features
model.fc = nn.Linear(num_features, 2)

model = model.to(DEVICE)

# -----------------------
# Loss + Optimizer
# -----------------------
criterion = nn.CrossEntropyLoss(weight=class_weights.to(DEVICE))

optimizer = optim.Adam(
    filter(lambda p: p.requires_grad, model.parameters()),
    lr=LR,
    weight_decay=WEIGHT_DECAY
)

# Learning rate scheduler (VERY important)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode='max', factor=0.5, patience=2
)

# -----------------------
# Training
# -----------------------
for epoch in range(EPOCHS):

    # ---- Train ----
    model.train()
    train_correct = 0

    for images, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS} [Train]"):
        images, labels = images.to(DEVICE), labels.to(DEVICE)

        outputs = model(images)
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        _, predicted = torch.max(outputs, 1)
        train_correct += (predicted == labels).sum().item()

    train_acc = train_correct / len(train_dataset)

    # ---- Validation ----
    model.eval()
    val_correct = 0
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for images, labels in tqdm(val_loader, desc=f"Epoch {epoch+1}/{EPOCHS} [Val]"):
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)

            val_correct += (predicted == labels).sum().item()
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    val_acc = val_correct / len(val_dataset)

    print(f"\nTrain Acc: {train_acc*100:.2f}% | Val Acc: {val_acc*100:.2f}%")

    # Print classification metrics (real vs AI balance)
    print(classification_report(all_labels, all_preds, target_names=train_dataset.classes))

    scheduler.step(val_acc)

    # ---- Early Stopping ----
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        patience_counter = 0
        torch.save(model.state_dict(), os.path.join(MODELS_DIR, "best_model.pth"))
        print("New best model saved")
    else:
        patience_counter += 1
        print(f"No improvement ({patience_counter}/{PATIENCE})")

    if patience_counter >= PATIENCE:
        print("Early stopping triggered")
        break

torch.save(model.state_dict(), os.path.join(MODELS_DIR, "final_model.pth"))

print(f"\nBest Validation Accuracy: {best_val_acc*100:.2f}%")
