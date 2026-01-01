// plans.js
document.addEventListener('DOMContentLoaded', ()=>{
  App.navHighlight();
  renderPlans();
});

function renderPlans(){
  const s = App.getState();
  const out = document.getElementById('plansList');
  out.innerHTML = '';

  if(!s.plans.length){
    out.innerHTML = '<div class="small card">No plans yet</div>';
    return;
  }

  s.plans.forEach(p=>{
    const c = document.createElement('div');
    c.className = 'card';

    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h3>${p.title}</h3>
          <div class="small">${p.date}</div>
        </div>
        <div>
          <button class="btn btn-outline" onclick='viewPlan("${p.id}")'>View</button>
        </div>
      </div>

      <div style="margin-top:12px">
        <div class="kv">
          <div>Total Calories</div>
          <div>${p.totalCalories}</div>
        </div>
      </div>
    `;

    out.appendChild(c);
  });
}


// UPDATED viewPlan() — NOW SHOWS MEALS + FOOD ITEMS
function viewPlan(id){
  const s = App.getState();
  const p = s.plans.find(x=>x.id===id);
  if(!p) return alert("Plan not found");

  const w = window.open('', '_blank');

  w.document.write(`
    <html>
    <head>
      <title>${p.title}</title>
      <link rel="stylesheet" href="styles/main.css">
    </head>

    <body>
      <div class="container">
        <h1>${p.title}</h1>
        <div class="small">${p.date}</div>

        <div style="margin-top:20px" class="card">
          <div class="kv">
            <div>Total Calories</div>
            <div>${p.totalCalories}</div>
          </div>

          <hr>

          <h3 style="margin-top:12px">Meals</h3>

          ${p.meals.map(m => `
            <div class="card" style="margin-top:12px">
              <strong>${m.name}</strong>
              <div class="small">${m.time}</div>
              <div>${m.calories} cal</div>

              <div style="margin-top:10px">
                ${m.items.map(i => `
                  <div style="margin-bottom:8px;display:flex;align-items:center;">
                    <img src="${i.image}" 
                         style="width:40px;height:40px;border-radius:8px;object-fit:cover;margin-right:10px">

                    <div>
                      <strong>${i.food}</strong>
                      <div class="small">${i.grams}g — ${i.calories} cal</div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          `).join("")}

        </div>
      </div>
    </body>
    </html>
  `);

  w.document.close();
}
