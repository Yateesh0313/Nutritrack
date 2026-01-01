// dashboard.js
document.addEventListener('DOMContentLoaded', ()=> {
  App.navHighlight();

  // wire tabs
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click', ()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const name = t.dataset.tab;
      document.querySelectorAll('.tabview').forEach(v=> v.style.display = (v.id === name) ? '' : 'none');
    });
  });

  // show state
  const s = App.getState();
  document.getElementById('creditsCount').textContent = s.credits;
  document.getElementById('availCredits').textContent = s.credits;
  document.getElementById('totalPlans').textContent = s.plans.length;
  document.getElementById('dailyCal').textContent = s.currentPlan ? s.currentPlan.totalCalories : 2100;
  // recent plans list
  const rp = document.getElementById('recentPlans');
  rp.innerHTML = '';
  s.plans.slice(0,5).forEach(pl=>{
    const d = document.createElement('div');
    d.className='kv';
    d.innerHTML = `<div><strong>${pl.title}</strong><div class="small">${pl.date}</div></div><div><span class="small">${pl.status||'completed'}</span> <a href="plans.html">View</a></div>`;
    rp.appendChild(d);
    rp.appendChild(document.createElement('br'));
  });

  // Generate button
  document.getElementById('genBtn').addEventListener('click', ()=> location.href='nutrition.html');
});
