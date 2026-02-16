from fastapi import FastAPI, UploadFile, File
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import io
import uvicorn
from typing import cast

app = FastAPI()


# 1. Load the Model
DEVICE = torch.device("cpu")
model = models.resnet18()
model.fc = nn.Linear(model.fc.in_features, 2)

MODEL_PATH = "../models/best_model.pth"
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.eval()


# 2. Image Processing
transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])


# 3. API Route
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Read image sent form TypeScript
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert('RGB')

    raw_transformed = transform(image)
    image_t = cast(torch.Tensor, raw_transformed).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = model(image_t)
        # Convert raw scores to percentages (0.0 to 1.0)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        
        # Assuming index 0 is AI and index 1 is REAL
        ai_score = probabilities[0][0].item()
        real_score = probabilities[0][1].item()
        

    return {
        "ai_score": ai_score,
        "real_score": real_score,
        "verdict": "ai" if ai_score > real_score else "real"
    }

if __name__ == "__main__":
    # Start the server on localhost port 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)