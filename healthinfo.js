// healthinfo.js
let healthData = [];
async function loadHealth(){
  try{
    const res = await fetch('data/health.json');
    healthData = await res.json();
    renderList(healthData);
  }catch(e){ console.error(e); document.getElementById('healthList').innerHTML = '<div class="card">Failed to load health.json</div>'; }
}
function renderList(list){
  const out = document.getElementById('healthList'); out.innerHTML='';
  list.forEach(h=>{
    const div = document.createElement('div'); div.className='card';
    div.innerHTML = `<h3>${h.name}</h3><div class="small">${h.summary}</div><h4 style="margin-top:12px">Common Symptoms</h4><div>${h.symptoms}</div><h4 style="margin-top:12px">Recommended Foods</h4><div>${h.recommended}</div><h4 style="margin-top:12px">Foods to Avoid</h4><div>${h.avoid}</div>`;
    out.appendChild(div);
  });
}
document.addEventListener('DOMContentLoaded', ()=>{
  App.navHighlight();
  document.getElementById('hiSearchBtn').addEventListener('click', ()=>{
    const q = document.getElementById('hiSearch').value.trim().toLowerCase();
    renderList(healthData.filter(h=> h.name.toLowerCase().includes(q) || h.summary.toLowerCase().includes(q)));
  });
  loadHealth();
});
