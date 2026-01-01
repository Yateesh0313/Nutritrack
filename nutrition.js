// ================== FINAL nutrition.js ==================

document.addEventListener("DOMContentLoaded", () => {

  App.navHighlight();

  document.querySelectorAll(".tab").forEach(t => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");

      const name = t.dataset.tab;
      document.getElementById("gen").style.display     = name === "generate" ? "" : "none";
      document.getElementById("history").style.display = name === "history" ? "" : "none";
      document.getElementById("current").style.display = name === "current" ? "" : "none";
    });
  });

  document.getElementById("creditsGen").textContent = App.getState().credits;

  let pendingInput = null;

  document.getElementById("generatePlanBtn").onclick = () => {
    pendingInput = collectUserInput();
    document.getElementById("dietChoiceBox").style.display = "block";
  };

  document.getElementById("vegBtn").onclick = () => {
    processPlanGeneration(pendingInput, "veg");
    document.getElementById("dietChoiceBox").style.display = "none";
  };

  document.getElementById("nonvegBtn").onclick = () => {
    processPlanGeneration(pendingInput, "nonveg");
    document.getElementById("dietChoiceBox").style.display = "none";
  };

  renderHistory();
  renderCurrentPlan();
});

function collectUserInput(){
  return {
    age: +age.value || 25,
    weight: +weight.value || 70,
    height: +height.value || 170,
    gender: document.querySelector('input[name="gender"]:checked').value,
    activity: +activity.value || 1.55
  };
}

async function processPlanGeneration(u, dietType){

  let bmr = u.gender==="male"
    ? 10*u.weight + 6.25*u.height - 5*u.age + 5
    : 10*u.weight + 6.25*u.height - 5*u.age - 161;

  let tdee = Math.round(bmr * u.activity);

  const bmi = u.weight / ((u.height/100)**2);

  let goal="maintain";
  if(bmi<18.5){ goal="gain"; tdee+=300; }
  else if(bmi>24.9){ goal="lose"; tdee-=500; }

  autoGoalLabel.innerHTML = `${goal.toUpperCase()} | BMI ${bmi.toFixed(1)}`;

  const protein = Math.round(1.6 * u.weight);
  const fats    = Math.round((tdee*0.30)/9);
  const carbs   = Math.round((tdee - protein*4 - fats*9)/4);

  const meals = await generateMeals(tdee, dietType);

  const plan = {
    id:"plan-"+Date.now(),
    date:new Date().toLocaleDateString(),
    totalCalories:tdee,
    protein,fats,carbs,
    title:`${goal.toUpperCase()} PLAN (${tdee} cal)`,
    bmi:bmi.toFixed(1),
    goal,dietType,meals
  };

  App.addPlan(plan);
  renderHistory();
  renderCurrentPlan();
}

async function generateMeals(totalCal, dietType){

  const data = await fetch("data/foods.json").then(r=>r.json());

  const structure = [
    {key:"breakfast", ratio:0.30, time:"7:00 - 8:00 AM"},
    {key:"lunch",     ratio:0.35, time:"12:00 - 1:00 PM"},
    {key:"dinner",    ratio:0.30, time:"6:30 - 7:30 PM"},
    {key:"snacks",    ratio:0.05, time:"10:30 AM & 3:30 PM"}
  ];

  return structure.map(m=>{
    const target = Math.round(totalCal * m.ratio);
    const options = data[m.key][dietType];
    const pick = options[Math.floor(Math.random()*options.length)];

    return {
      name:m.key.toUpperCase(),
      time:m.time,
      calories:target,
      items:[{
        food:pick.name,
        grams:Math.round((target/pick.cal)*100),
        calories:pick.cal,
        image:"https://source.unsplash.com/100x100/?"+encodeURIComponent(pick.name)
      }]
    };
  });
}

function renderHistory(){
  const h = historyList;
  const s = App.getState();
  h.innerHTML = s.plans.length
    ? s.plans.map(p=>`
      <div class="kv">
        <div>
          <b>${p.title}</b>
          <div class="small">${p.date}</div>
        </div>
        <a href="plans.html">View</a>
      </div>
    `).join("")
    : `<div class="small">No plans yet</div>`;
}

function renderCurrentPlan(){
  const s = App.getState();
  const p = s.currentPlan;
  if(!p){ currentPlanArea.innerHTML=`<div class="small">No current plan</div>`; return; }

  currentPlanArea.innerHTML = `
    <h2>${p.title}</h2>
    <div class="small">BMI: ${p.bmi} | Diet: ${p.dietType}</div>

    ${p.meals.map(m=>`
      <div class="card">
        <b>${m.name}</b> <span class="small">${m.time}</span>
        ${m.items.map(i=>`
          <div style="display:flex;margin-top:8px">
            <img src="${i.image}" width="40" height="40">
            <div style="margin-left:10px">
              <b>${i.food}</b>
              <div class="small">${i.grams}g • ${i.calories} cal</div>
            </div>
          </div>
        `).join("")}
      </div>
    `).join("")}
  `;
}
