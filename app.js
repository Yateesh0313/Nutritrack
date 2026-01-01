// app.js - NutriClone (vanilla JS static site)
// Load data from data/foods.json and render UI features:
// search, filters, sort, pagination, modal, favorites (localStorage), export

const DATA_URL = 'data/foods.json';
let foods = [];
let filtered = [];
let categories = ['All', 'Fruits', 'Vegetables', 'Meat', 'Fish', 'Grains', 'Dairy & Alternatives', 'Legumes', 'Nuts & Seeds', 'Snacks', 'Fats & Oils', 'Others'];
let currentCategory = 'All';
let pageSize = 9;
let currentPage = 1;
let favorites = new Set(JSON.parse(localStorage.getItem('nutriclone_favs') || '[]'));

// DOM refs
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const categoryBtns = document.getElementById('categoryBtns');
const cardsContainer = document.getElementById('cardsContainer');
const resultsCount = document.getElementById('resultsCount');
const sortSelect = document.getElementById('sortSelect');
const pagination = document.getElementById('pagination');
const exportBtn = document.getElementById('exportBtn');
const favoritesBtn = document.getElementById('favoritesBtn');

// Modal refs (Bootstrap)
const foodModal = new bootstrap.Modal(document.getElementById('foodModal'));
const modalTitle = document.getElementById('foodModalLabel');
const modalImage = document.getElementById('modalImage');
const modalCategory = document.getElementById('modalCategory');
const modalSummary = document.getElementById('modalSummary');
const modalBenefits = document.getElementById('modalBenefits');
const nutritionTable = document.getElementById('nutritionTable');
const openImageBtn = document.getElementById('openImageBtn');
const favModalBtn = document.getElementById('favModalBtn');

let currentModalItem = null;

// Init
async function init() {
  try {
    const res = await fetch(DATA_URL);
    foods = await res.json();
  } catch (e) {
    console.error('Failed to load dataset:', e);
    cardsContainer.innerHTML = `<div class="alert alert-danger">Failed to load data. Make sure data/foods.json exists.</div>`;
    return;
  }
  renderCategoryButtons();
  wireEvents();
  applyFilters();
}

function renderCategoryButtons() {
  categoryBtns.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm';
    btn.classList.add(cat === 'All' ? 'btn-light active' : 'btn-outline-light');
    btn.textContent = cat;
    btn.dataset.cat = cat;
    btn.addEventListener('click', () => {
      currentCategory = cat;
      currentPage = 1;
      // style active
      Array.from(categoryBtns.children).forEach(b => b.classList.remove('active', 'btn-light'));
      btn.classList.add('active', 'btn-light');
      applyFilters();
    });
    categoryBtns.appendChild(btn);
  });
}

function wireEvents() {
  searchInput.addEventListener('input', () => { currentPage = 1; applyFilters(); });
  clearSearch.addEventListener('click', () => { searchInput.value=''; searchInput.dispatchEvent(new Event('input')); });
  sortSelect.addEventListener('change', () => { applyFilters(); });
  exportBtn.addEventListener('click', exportJSON);
  favoritesBtn.addEventListener('click', () => {
    // Toggle to show favorites
    if (currentCategory === 'Favorites') {
      currentCategory = 'All';
    } else {
      currentCategory = 'Favorites';
    }
    Array.from(categoryBtns.children).forEach(b => b.classList.remove('active', 'btn-light'));
    currentPage = 1;
    applyFilters();
  });
}

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  filtered = foods.filter(f => {
    // category filter
    if (currentCategory === 'All') {
      // ok
    } else if (currentCategory === 'Favorites') {
      if (!favorites.has(f.id)) return false;
    } else {
      if (f.category !== currentCategory) return false;
    }
    // search match name or benefits
    if (!q) return true;
    const hay = (f.name + ' ' + (f.benefits||'') + ' ' + (f.summary||'')).toLowerCase();
    return hay.includes(q);
  });

  // sort
  const sortVal = sortSelect.value;
  if (sortVal === 'cal-asc') filtered.sort((a,b) => a.cal_per_100g - b.cal_per_100g);
  else if (sortVal === 'cal-desc') filtered.sort((a,b) => b.cal_per_100g - a.cal_per_100g);
  else if (sortVal === 'alpha') filtered.sort((a,b) => a.name.localeCompare(b.name));
  // else keep default (data order / relevance)

  renderCards();
  renderPagination();
}

function renderCards() {
  const start = (currentPage-1)*pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  resultsCount.textContent = filtered.length;

  cardsContainer.innerHTML = '';
  if (pageItems.length === 0) {
    cardsContainer.innerHTML = `<div class="col-12"><div class="alert alert-warning">No results found.</div></div>`;
    return;
  }

  pageItems.forEach(f => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    const card = document.createElement('div');
    card.className = 'card card-food h-100';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="row g-0">
        <div class="col-4">
          <img src="${f.image}" class="img-fluid rounded-start h-100 object-fit-cover" alt="${escapeHtml(f.name)}">
        </div>
        <div class="col-8">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <h5 class="card-title mb-1">${escapeHtml(f.name)}</h5>
              <button class="btn btn-sm btn-link fav-toggle" title="Toggle favorite" data-id="${f.id}">
                <i class="fa ${favorites.has(f.id) ? 'fa-star favorite-star' : 'fa-regular fa-star'}"></i>
              </button>
            </div>
            <p class="small-attr mb-1">${escapeHtml(f.category)}</p>
            <p class="mb-1"><strong>${f.cal_per_100g}</strong> cal per 100g</p>
            <p class="card-text small">${escapeHtml(truncate(f.summary, 90))}</p>
          </div>
        </div>
      </div>
    `;
    // click to open modal
    card.addEventListener('click', (ev) => {
      // prevent when clicking fav button inside
      if (ev.target.closest('.fav-toggle')) return;
      openModal(f);
    });
    // favorite toggle
    card.querySelectorAll('.fav-toggle').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id = btn.dataset.id;
        toggleFavorite(id);
        // refresh
        applyFilters();
      });
    });

    col.appendChild(card);
    cardsContainer.appendChild(col);
  });
}

function renderPagination() {
  const total = Math.ceil(filtered.length / pageSize);
  pagination.innerHTML = '';
  if (total <= 1) return;
  const makePageItem = (page, label = null, disabled=false, active=false) => {
    const li = document.createElement('li');
    li.className = 'page-item' + (active ? ' active' : '') + (disabled ? ' disabled' : '');
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = label || page;
    a.addEventListener('click', (ev) => { ev.preventDefault(); if (!disabled) { currentPage = page; renderCards(); renderPagination(); }});
    li.appendChild(a);
    return li;
  };

  // prev
  pagination.appendChild(makePageItem(Math.max(1,currentPage-1), '«', currentPage===1, false));
  for (let p=1;p<=total;p++){
    if (p>1 && p< total && total>7 && Math.abs(p-currentPage)>2) {
      // condense: show first, last, nearby pages
      if (p===2 && currentPage>4) { const li=document.createElement('li'); li.className='page-item disabled'; li.innerHTML='<span class="page-link">...</span>'; pagination.appendChild(li); }
      if (p===total-1 && currentPage<total-3) continue;
      if (p<=currentPage+2 && p>=currentPage-2) pagination.appendChild(makePageItem(p, null, false, p===currentPage));
    } else {
      pagination.appendChild(makePageItem(p, null, false, p===currentPage));
    }
  }
  // next
  pagination.appendChild(makePageItem(Math.min(total,currentPage+1), '»', currentPage===total, false));
}

function openModal(item) {
  currentModalItem = item;
  modalTitle.textContent = item.name;
  modalImage.src = item.image;
  modalImage.alt = item.name;
  modalCategory.textContent = item.category;
  modalSummary.textContent = item.summary;
  modalBenefits.textContent = item.benefits;
  nutritionTable.innerHTML = `
    <tr><th>Calories (per 100g)</th><td>${item.cal_per_100g}</td></tr>
    <tr><th>Protein (g)</th><td>${item.protein_g}</td></tr>
    <tr><th>Fat (g)</th><td>${item.fat_g}</td></tr>
    <tr><th>Carbs (g)</th><td>${item.carbs_g}</td></tr>
    <tr><th>Fiber (g)</th><td>${item.fiber_g}</td></tr>
  `;
  favModalBtn.onclick = () => { toggleFavorite(item.id); applyFilters(); };
  openImageBtn.onclick = () => { window.open(item.image, '_blank'); };
  // update modal fav btn text
  updateModalFavButton();
  foodModal.show();
}

function updateModalFavButton() {
  if (!currentModalItem) return;
  if (favorites.has(currentModalItem.id)) {
    favModalBtn.innerHTML = '<i class="fa fa-star"></i> Remove favorite';
    favModalBtn.classList.remove('btn-outline-warning');
    favModalBtn.classList.add('btn-warning');
  } else {
    favModalBtn.innerHTML = '<i class="fa fa-star"></i> Favorite';
    favModalBtn.classList.remove('btn-warning');
    favModalBtn.classList.add('btn-outline-warning');
  }
}

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  localStorage.setItem('nutriclone_favs', JSON.stringify(Array.from(favorites)));
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(filtered, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nutriclone_export.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// small helpers
function truncate(s, n=100){ return s.length > n ? s.slice(0,n-1)+'…' : s; }
function escapeHtml(s){ return s?.replace?.(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') || ''; }

init();
