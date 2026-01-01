// foodinfo.js — Updated with confidence check + blank image detection
//-------------------------------------------------------------
console.log("foodinfo.js LOADED");

let allFoods = [];
let cameraStream = null;

// 🚀 LOAD ON PAGE OPEN
document.addEventListener("DOMContentLoaded", async () => {
  await loadFoods();
  renderFoods(allFoods);

  attachSearchFunction();
  attachScannerEvents();
  attachCameraEvents();
});


// ================= LOAD FOOD DATA ======================
async function loadFoods() {
  const res = await fetch("data/foods.json");
  allFoods = await res.json();
}


// ================= SEARCH FILTER =======================
function attachSearchFunction() {
  const bar = document.getElementById("foodSearch");
  if (!bar) return;

  bar.addEventListener("input", () => {
    const text = bar.value.toLowerCase();

    const list = allFoods.filter(f =>
      f.name.toLowerCase().includes(text) ||
      f.category.toLowerCase().includes(text)
    );

    renderFoods(list);
  });
}


// ================== DISPLAY CARDS ======================
function renderFoods(list) {
  const box = document.getElementById("foodCards");
  if (!box) return;

  box.innerHTML = "";
  if (list.length === 0) {
    box.innerHTML = "<div class='small'>No foods found.</div>";
    return;
  }

  list.forEach(f => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div style="display:flex;gap:12px">
        <img src="${f.image}"
             style="width:90px;height:90px;border-radius:10px;object-fit:cover">
        <div>
          <h3>${f.name}</h3>
          <div class="small">${f.category}</div>
          <div class="small">${f.cal_per_100g} cal / 100g</div>
        </div>
      </div>

      <div style="margin-top:8px;font-size:14px">
        <strong>Summary:</strong> ${f.summary}
      </div>

      <div style="margin-top:4px;font-size:14px">
        <strong>Benefits:</strong> ${f.benefits}
      </div>
    `;

    box.appendChild(card);
  });
}



// ======================= BACKEND AI SCANNER =========================
function attachScannerEvents() {
  const btn = document.getElementById("scanBtn");
  if (btn) btn.addEventListener("click", scanFoodWithBackend);
}


async function scanFoodWithBackend() {
  const fileInput = document.getElementById("scanInput");
  const resultBox = document.getElementById("scanResult");

  if (!fileInput || !fileInput.files.length) {
    alert("Please upload or capture an image first.");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file);

  resultBox.innerHTML = `<p>🔍 Scanning... Please wait.</p>`;

  try {
    const res = await fetch("http://127.0.0.1:8000/scan-food", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();

    console.log("SCAN RESULT:", data);

    // NEW CONDITIONS ===========================================
    // 1) Prediction too weak
    if (data.confidence < 0.60) {
      resultBox.innerHTML = `
        <p style="color:red;">❌ Could not detect food.</p>
        <p>Confidence: ${(data.confidence * 100).toFixed(1)}%</p>
        <p>Please try again with a clearer food image.</p>
      `;
      return;
    }

    // 2) Food not found in database
    if (!data.found_in_database) {
      resultBox.innerHTML = `
        <p>Detected: <strong>${data.food}</strong></p>
        <p style="color:orange">${data.message}</p>
      `;
      return;
    }

    // If everything is valid, show nutrition card
    resultBox.innerHTML = `
      <div class="card" style="padding:15px; border-left:5px solid #22c55e;">
        <h2>🍽️ ${data.food}</h2>
        <p><strong>Category:</strong> ${data.category}</p>

        <table style="width:100%; font-size:14px;">
          <tr><td><strong>Calories</strong></td><td>${data.cal_per_100g} kcal</td></tr>
          <tr><td><strong>Protein</strong></td><td>${data.protein_g} g</td></tr>
          <tr><td><strong>Carbs</strong></td><td>${data.carbs_g} g</td></tr>
          <tr><td><strong>Fat</strong></td><td>${data.fat_g} g</td></tr>
          <tr><td><strong>Fiber</strong></td><td>${data.fiber_g ?? "-"} g</td></tr>
        </table>

        <p style="margin-top:10px"><strong>Summary:</strong> ${data.summary}</p>
        <p><strong>Benefits:</strong> ${data.benefits || "-"}</p>
      </div>
    `;

    // highlight detected food
    const match = allFoods.find(
      f => f.name.toLowerCase() === data.food.toLowerCase()
    );
    if (match) renderFoods([match]);

    resultBox.scrollIntoView({ behavior: "smooth" });

  } catch (error) {
    console.error(error);
    resultBox.innerHTML =
      `<p style="color:red">❌ Failed to scan. Is backend running?</p>`;
  }
}



// ===================== CAMERA CAPTURE FEATURE =========================
function attachCameraEvents() {
  const openBtn = document.getElementById("openCameraBtn");
  const captureBtn = document.getElementById("captureBtn");
  const video = document.getElementById("cameraPreview");

  if (!openBtn || !captureBtn || !video) return;

  openBtn.addEventListener("click", async () => {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      video.srcObject = cameraStream;
      video.style.display = "block";
      captureBtn.style.display = "inline-block";

    } catch (err) {
      console.error(err);
      alert("Camera not accessible. Please allow permissions.");
    }
  });

  captureBtn.addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });

      const scanInput = document.getElementById("scanInput");
      const dt = new DataTransfer();
      dt.items.add(file);
      scanInput.files = dt.files;

      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      video.style.display = "none";
      captureBtn.style.display = "none";

      alert("Image Captured! Now click Scan Food.");
    });
  });
}
