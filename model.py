# backend/model.py

import json
from pathlib import Path
import torch
from PIL import Image
import clip

# ========= LOAD FOOD DATABASE =========
PROJECT_ROOT = Path(__file__).resolve().parents[1]
FOODS_JSON_PATH = PROJECT_ROOT / "data" / "foods.json"

with open(FOODS_JSON_PATH, "r", encoding="utf-8") as f:
    FOODS_DATA = json.load(f)

FOOD_NAMES = [item["name"] for item in FOODS_DATA]
NUTRITION_LOOKUP = { item["name"].lower(): item for item in FOODS_DATA }

# ========= LOAD CLIP MODEL =========
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# Improved prompt for better food recognition
PROMPTS = [f"a clear photo of {name}, food item" for name in FOOD_NAMES]

with torch.no_grad():
    text_tokens = clip.tokenize(PROMPTS).to(device)
    TEXT_FEATURES = model.encode_text(text_tokens)
    TEXT_FEATURES /= TEXT_FEATURES.norm(dim=-1, keepdim=True)


def predict_food(image: Image.Image):
    """Predict the closest food name + confidence score using CLIP."""

    img_tensor = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        image_features = model.encode_image(img_tensor)
        image_features /= image_features.norm(dim=-1, keepdim=True)

        similarity = (image_features @ TEXT_FEATURES.T).squeeze(0)
        best_index = similarity.argmax().item()

    best_food = FOOD_NAMES[best_index]

    # Convert similarity (-1 to 1) → confidence (0 to 1)
    raw_score = float(similarity[best_index].item())
    confidence = (raw_score + 1) / 2  

    # Allow lower threshold since CLIP food scores rarely exceed 0.7
    CONFIDENCE_THRESHOLD = 0.20

    if confidence < CONFIDENCE_THRESHOLD:
        return None, confidence

    return best_food, confidence


def get_nutrition(food_name: str):
    """Return nutrition dictionary from foods.json"""
    return NUTRITION_LOOKUP.get(food_name.lower(), None)
