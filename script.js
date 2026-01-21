const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

async function main(){
  const res = await fetch('assets/site-data.json');
  const data = await res.json();


  // Photographer
  const phName = document.getElementById('phName');
  const phBio = document.getElementById('phBio');
  if (data.photographer){
    if (phName) phName.textContent = data.photographer.name || 'Photographer';
    if (phBio) phBio.textContent = data.photographer.bio || '';
  }

  // Footer year
  $('#year').textContent = new Date().getFullYear();

  // Instagram link (optional)
  const ig = data.contact?.instagram || '';
  const igLink = $('#igLink');
  if (igLink){
    if (ig.startsWith('@')) {
      igLink.href = `https://instagram.com/${ig.slice(1)}`;
      igLink.textContent = ig;
    } else if (ig) {
      igLink.href = ig;
      igLink.textContent = ig;
    } else {
      igLink.style.display = 'none';
    }
  }

  // Theme
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('un_theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);
  const toggle = $('#themeToggle');
  toggle?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('un_theme', next);
    toggle.firstElementChild.textContent = next === 'light' ? '☼' : '☾';
  });
  // set initial icon
  toggle.firstElementChild.textContent = root.getAttribute('data-theme') === 'light' ? '☼' : '☾';

  // Accordion
  $$('[data-accordion] .accordion__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const panel = btn.nextElementSibling;
      btn.setAttribute('aria-expanded', String(!expanded));
      if (!panel) return;
      panel.hidden = expanded;
    });
  });

  // Gallery
  const chips = $('#chips');
  const masonry = $('#masonry');
  const search = $('#searchInput');

  let active = 'All';
  let q = '';
  const photos = data.photos || [];

  function renderChips(){
    chips.innerHTML = '';
    (data.categories || ['All']).forEach(cat => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.type = 'button';
      b.textContent = cat;
      b.setAttribute('aria-pressed', String(cat === active));
      b.addEventListener('click', () => {
        active = cat;
        renderChips();
        renderTiles();
      });
      chips.appendChild(b);
    });
  }

  function matches(photo){
    const inCat = (active === 'All') || (photo.category === active);
    const hay = `${photo.title} ${photo.category} ${photo.caption}`.toLowerCase();
    const inQ = !q || hay.includes(q.toLowerCase());
    return inCat && inQ;
  }

  // Lightbox state
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCap');
  let currentList = [];
  let idx = 0;

  function openLightbox(list, startIndex){
    currentList = list;
    idx = startIndex;
    lb.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    show();
  }
  function closeLightbox(){
    lb.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  function show(){
    const p = currentList[idx];
    if (!p) return;
    lbImg.src = p.src;
    lbImg.alt = p.alt || '';
    const parts = [];
    parts.push(`${p.category} • ${p.title}`);
    const cam = p.camera ? `Camera: ${p.camera}` : '';
    const lens = p.lens ? `Lens: ${p.lens}` : '';
    const s = p.settings || {};
    const settings = [s.focal, s.aperture, s.shutter, (s.iso ? `ISO ${s.iso}` : null)].filter(Boolean).join(' • ');
    const loc = p.location ? `Location: ${p.location}` : '';
    const line2 = [cam, lens].filter(Boolean).join(' • ');
    const line3 = [settings, loc].filter(Boolean).join(' • ');
    lbCap.textContent = [parts[0], line2, line3].filter(Boolean).join(' — ');
  }
  function prev(){ idx = (idx - 1 + currentList.length) % currentList.length; show(); }
  function next(){ idx = (idx + 1) % currentList.length; show(); }

  $('#lbClose')?.addEventListener('click', closeLightbox);
  $('#lbPrev')?.addEventListener('click', prev);
  $('#lbNext')?.addEventListener('click', next);
  lb?.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (lb.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  function renderTiles(){
    const list = photos.filter(matches);
    masonry.innerHTML = '';
    if (!list.length){
      masonry.innerHTML = '<p class="muted">No photos match this filter/search.</p>';
      return;
    }
    list.forEach((p, i) => {
      const tile = document.createElement('button');
      tile.className = 'tile';
      tile.type = 'button';
      tile.setAttribute('aria-label', `Open ${p.title}`);
      tile.innerHTML = `
        <img src="${p.thumb}" alt="${p.alt || ''}" loading="lazy" />
        <div class="tile__meta">
          <span class="badge">${p.category}</span>
          <span class="caption">${p.title}</span>
        </div>
      `;
      tile.addEventListener('click', () => openLightbox(list, i));
      masonry.appendChild(tile);
    });
  }

  renderChips();
  renderTiles();

  search?.addEventListener('input', () => {
    q = search.value.trim();
    renderTiles();
  });
}

main().catch(err => {
  console.error(err);
  const target = document.getElementById('masonry');
  if (target) target.innerHTML = '<p class="muted">Could not load gallery data. Check that assets/site-data.json exists.</p>';
});
