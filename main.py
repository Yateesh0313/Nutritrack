# backend/main.py

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from io import BytesIO

from model import predict_food, get_nutrition

app = FastAPI()

# Allow your frontend to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow local HTML pages
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Food Scanner Backend Running"}

@app.post("/scan-food")
async def scan_food(file: UploadFile = File(...)):
    """Receive image → predict food → send nutrition info"""

    # Convert file → image
    contents = await file.read()
    image = Image.open(BytesIO(contents)).convert("RGB")

    # Predict name
    detected = predict_food(image)

    # Find nutrition
    nutrition = get_nutrition(detected)

    if nutrition is None:
        return {
            "food": detected,
            "found_in_database": False,
            "message": "Food detected but not found in foods.json"
        }

    # Build response
    result = dict(nutrition)
    result["food"] = nutrition["name"]
    result["found_in_database"] = True
    return result
# backend/main.py

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from io import BytesIO

from model import predict_food, get_nutrition

app = FastAPI()

# Allow your frontend to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # allow local HTML pages
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Food Scanner Backend Running"}


@app.post("/scan-food")
async def scan_food(file: UploadFile = File(...)):
    """Receive image → predict food → send nutrition info"""

    # Convert file to PIL image
    contents = await file.read()
    image = Image.open(BytesIO(contents)).convert("RGB")

    # Predict food + confidence score
    food_name, confidence = predict_food(image)

    # ❌ Case 1: No detectable food (low confidence / blank image)
    if food_name is None:
        return {
            "success": False,
            "food": None,
            "confidence": confidence,
            "found_in_database": False,
            "message": "Could not detect a food item. Try capturing a clearer image."
        }

    # Try to fetch nutrition details
    nutrition = get_nutrition(food_name)

    # ❌ Case 2: Food detected but NOT in foods.json
    if nutrition is None:
        return {
            "success": True,
            "food": food_name,
            "confidence": confidence,
            "found_in_database": False,
            "message": "Food detected but not found in foods.json"
        }

    # ✅ Case 3: Everything OK — return full nutrition info
    nutrition_response = dict(nutrition)
    nutrition_response.update({
        "success": True,
        "food": food_name,
        "confidence": confidence,
        "found_in_database": True
    })

    return nutrition_response
