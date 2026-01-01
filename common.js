// common.js - shared utilities and app state
const App = {
  storageKey: 'nutritrack_clone',
  getState(){
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : {
      favorites: [],
      plans: [],
      credits: 9999, // free unlimited in practice
      currentPlan: null
    };
  },
  saveState(s){
    localStorage.setItem(this.storageKey, JSON.stringify(s));
  },
  addFavorite(id){
    const s=this.getState(); if(!s.favorites.includes(id)) s.favorites.push(id); this.saveState(s);
  },
  removeFavorite(id){ const s=this.getState(); s.favorites = s.favorites.filter(x=>x!==id); this.saveState(s); },
  toggleFavorite(id){ const s=this.getState(); if(s.favorites.includes(id)) s.favorites = s.favorites.filter(x=>x!==id); else s.favorites.push(id); this.saveState(s); },
  addPlan(plan){ const s=this.getState(); s.plans.unshift(plan); s.currentPlan = plan; this.saveState(s); },
  setCredits(n){ const s=this.getState(); s.credits = n; this.saveState(s); },
  navHighlight(){
    const nav = document.querySelectorAll('.navlinks a');
    nav.forEach(a=>{
      const href = a.getAttribute('href');
      if(window.location.pathname.endsWith(href)) a.classList.add('active');
      else a.classList.remove('active');
    });
  }
};

// DOM helper
function el(sel){ return document.querySelector(sel); }
function elAll(sel){ return Array.from(document.querySelectorAll(sel)); }
function create(tag, attrs={}){ const e=document.createElement(tag); for(const k in attrs) e.setAttribute(k, attrs[k]); return e; }
