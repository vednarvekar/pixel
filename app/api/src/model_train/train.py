import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from tqdm import tqdm
import os
import json
from pathlib import Path

# -----------------------
# Config
# -----------------------
BATCH_SIZE = 16
EPOCHS = 12
LR = 0.0003
WEIGHT_DECAY = 1e-4
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

DATA_DIR = "dataset"
MODELS_DIR = "models"
Path(MODELS_DIR).mkdir(exist_ok=True)

PATIENCE = 3
best_val_acc = 0.0
patience_counter = 0

print(f"🖥️ Using device: {DEVICE}")
print(f"📁 Data directory: {DATA_DIR}")

# -----------------------
# Transforms
# -----------------------
train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(p=0.5),
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
# Datasets
# -----------------------
train_dataset = datasets.ImageFolder(os.path.join(DATA_DIR, "train"), transform=train_transform)
val_dataset = datasets.ImageFolder(os.path.join(DATA_DIR, "val"), transform=val_transform)

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)

print(f"\n📊 Dataset Loaded:")
print(f" Train: {len(train_dataset)} images | Val: {len(val_dataset)} images")
print(f" Classes: {train_dataset.classes}\n")

# -----------------------
# Model
# -----------------------
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# Freeze all layers
for param in model.parameters():
    param.requires_grad = False

# Unfreeze last residual block
for param in model.layer4.parameters():
    param.requires_grad = True

# Replace classifier
num_features = model.fc.in_features
model.fc = nn.Linear(num_features, 2)

model = model.to(DEVICE)

# -----------------------
# Loss + Optimizer
# -----------------------
criterion = nn.CrossEntropyLoss()

optimizer = optim.Adam(
    filter(lambda p: p.requires_grad, model.parameters()),
    lr=LR,
    weight_decay=WEIGHT_DECAY
)

history = {"train_acc": [], "val_acc": []}

# -----------------------
# Training
# -----------------------
print("="*30)
print("🚀 Starting Training")
print("="*30)

for epoch in range(EPOCHS):

    # ---- Train ----
    model.train()
    correct = 0

    for images, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS} [Train]"):
        images, labels = images.to(DEVICE), labels.to(DEVICE)

        outputs = model(images)
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        _, predicted = torch.max(outputs, 1)
        correct += (predicted == labels).sum().item()

    train_acc = correct / len(train_dataset)

    # ---- Validation ----
    model.eval()
    val_correct = 0

    with torch.no_grad():
        for images, labels in tqdm(val_loader, desc=f"Epoch {epoch+1}/{EPOCHS} [Val]"):
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)
            val_correct += (predicted == labels).sum().item()

    val_acc = val_correct / len(val_dataset)

    history["train_acc"].append(train_acc)
    history["val_acc"].append(val_acc)

    print(f"\nTrain Acc: {train_acc*100:.2f}% | Val Acc: {val_acc*100:.2f}%")

    # ---- Early Stopping ----
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        patience_counter = 0
        torch.save(model.state_dict(), os.path.join(MODELS_DIR, "best_model.pth"))
        print("⭐ New Best Model Saved")
    else:
        patience_counter += 1
        print(f"⏸️ No improvement ({patience_counter}/{PATIENCE})")

    if patience_counter >= PATIENCE:
        print("⏹️ Early stopping triggered")
        break

# Save final model
torch.save(model.state_dict(), os.path.join(MODELS_DIR, "final_model.pth"))

with open(os.path.join(MODELS_DIR, "history.json"), "w") as f:
    json.dump(history, f)

print(f"\n✅ Training Complete | Best Val Accuracy: {best_val_acc*100:.2f}%")