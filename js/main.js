const WA = "5493563413513";
const ARS = n => "$" + n.toLocaleString("es-AR");

/* Nombres plurales para mostrar en la tienda */
const CAT_DISPLAY = {
  "Buzo":    "Buzos",
  "Pantalón":"Pantalones",
  "Remera":  "Remeras",
};
function catDisplayName(name){ return CAT_DISPLAY[name] || name; }

/* ===== ÍCONOS SVG (fallback sin foto) ===== */
const CAT_SVG = {
  "Buzo":    `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M18 9 L10 13 L13.5 21 L17 19 V40 H31 V19 L34.5 21 L38 13 L30 9"/><path d="M18 9 Q24 17 30 9"/><path d="M22 16 V22 M26 16 V22"/><path d="M19 30 H29 V36 H19 Z"/></svg>`,
  "Pantalón":`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M15 8 H33 V40 H26 L24 21 L22 40 H15 Z"/><path d="M15 13 H33"/></svg>`,
  "Remera":  `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M18 8 L10 12 L13.5 20 L17 18 V40 H31 V18 L34.5 20 L38 12 L30 8 L27 11 H21 Z"/></svg>`,
};
function catIconSVG(name){
  return CAT_SVG[name] ||
    `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="12" y="12" width="24" height="24" rx="4"/></svg>`;
}

/* ===== STOCK HELPERS ===== */
function totalQty(p){
  if(p.qtyBySize) return Object.values(p.qtyBySize).reduce((a,b)=>a+(+b||0),0);
  return (p.qty ?? (p.stock ? 1 : 0));
}
const inStock = p => totalQty(p) > 0;
function sizesInStock(p){
  if(p.qtyBySize) return (p.sizes||Object.keys(p.qtyBySize)).filter(s=>(p.qtyBySize[s]||0)>0);
  return p.sizes||[];
}

/* ===== DATA ===== */
const DEFAULT_CATALOG = {
  supreme:{name:"Supreme",cls:"supreme",img:"",sub:"New York · Box Logo",categories:[
    {name:"Buzo",icon:"🧥",coverImg:"",products:[]},
    {name:"Pantalón",icon:"👖",coverImg:"",products:[]},
    {name:"Remera",icon:"👕",coverImg:"",products:[]}]},
  nike:{name:"Nike",cls:"nike",img:"",sub:"Just Do It",categories:[
    {name:"Buzo",icon:"🧥",coverImg:"",products:[]},
    {name:"Pantalón",icon:"👖",coverImg:"",products:[]},
    {name:"Remera",icon:"👕",coverImg:"",products:[]}]},
  adidas:{name:"Adidas",cls:"adidas",img:"",sub:"Originals · Trefoil",categories:[
    {name:"Buzo",icon:"🧥",coverImg:"",products:[]},
    {name:"Pantalón",icon:"👖",coverImg:"",products:[]},
    {name:"Remera",icon:"👕",coverImg:"",products:[]}]},
  essentials:{name:"Essentials",cls:"essentials",img:"",sub:"Fear of God",categories:[
    {name:"Buzo",icon:"🧥",coverImg:"",products:[]},
    {name:"Pantalón",icon:"👖",coverImg:"",products:[]},
    {name:"Remera",icon:"👕",coverImg:"",products:[]}]},
};
const DEFAULT_DROPS = [
  {name:"Winter Capsule", sub:"Buzos + remeras edición invierno", date:"2026-07-10T20:00:00", status:"soon"},
  {name:"Restock Essentials", sub:"Vuelven los talles agotados", date:"2026-07-02T20:00:00", status:"live"},
  {name:"Cosmos Series 02", sub:"La nueva tanda con el mascot JSS", date:"2026-08-01T20:00:00", status:"soon"},
];

let CATALOG = {};
let DROPS   = [];

/* ===== ESTADO ===== */
let currentBrand = null;
let currentCat   = null;
const selSize    = {};

/* ===== RENDERS ===== */
function renderBrands(){
  document.getElementById("brandsGrid").innerHTML = Object.entries(CATALOG).map(([key,b])=>{
    const total = b.categories.reduce((a,c)=>a+c.products.filter(inStock).length, 0);
    const fotoHtml = b.img
      ? `<img src="${b.img}" alt="${b.name}">`
      : `<div class="foto-placeholder"><span>📷</span>${b.name}</div>`;
    return `<div class="brand-card ${b.cls}" onclick="openBrand('${key}')">
      <div class="brand-logo-wrap">${fotoHtml}</div>
      <div class="brand-card-name">${b.name}</div>
      <div class="brand-card-sub">${b.sub}</div>
      <div class="brand-card-count">${total} productos</div>
    </div>`;
  }).join("");
}

function renderCats(brandKey){
  const b = CATALOG[brandKey];
  document.getElementById("catsGrid").innerHTML = b.categories.map((c,i)=>{
    const label      = catDisplayName(c.name);
    const stockCount = c.products.filter(inStock).length;
    const countTxt   = `${stockCount} producto${stockCount!==1?"s":""}`;

    if(c.coverImg){
      return `<div class="cat-card cat-card--photo" onclick="openCat('${brandKey}',${i})"
        style="--cover:url('${c.coverImg}')">
        <div class="cat-card-photo-overlay"></div>
        <div class="cat-card-photo-content">
          <div class="cat-card-photo-name">${label}</div>
          <div class="cat-card-photo-count">${countTxt}</div>
        </div>
      </div>`;
    }
    return `<div class="cat-card" onclick="openCat('${brandKey}',${i})">
      <div class="cat-icon">${catIconSVG(c.name)}</div>
      <div class="cat-name">${label}</div>
      <div class="cat-count">${countTxt}</div>
    </div>`;
  }).join("");
}

function renderProds(brandKey, catIdx){
  const b   = CATALOG[brandKey];
  const cat = b.categories[catIdx];
  const visibles = cat.products.filter(inStock);
  if(!visibles.length){
    document.getElementById("prodsGrid").innerHTML =
      `<p class="note">No hay productos disponibles en esta categoría por ahora.</p>`;
    return;
  }
  document.getElementById("prodsGrid").innerHTML = visibles.map((p,i)=>{
    const pid  = `${brandKey}-${catIdx}-${i}`;
    const g    = p.g || ["#151520","#080810"];
    const bg   = `background:radial-gradient(120% 90% at 30% 10%,${g[0]},${g[1]})`;
    const talles = sizesInStock(p);
    const sizes  = talles.map(s=>
      `<button class="sz" data-pid="${pid}" data-s="${s}" onclick="pickSize('${pid}','${s}',this)">${s}</button>`
    ).join("");
    return `<article class="prod-card">
      <div class="prod-img" style="${bg}">
        ${p.img ? `<img src="${p.img}" alt="${p.name}" loading="lazy">` : `<div class="art-label">${p.name}<small>JEASS</small></div>`}
      </div>
      <div class="prod-body">
        <span class="prod-cat">${catDisplayName(cat.name)} · ${b.name}</span>
        <h3>${p.name}</h3>
        <span class="stock-badge in-stock">En stock</span>
        <div class="prod-price">${ARS(p.price)}</div>
        <div class="prod-sizes">${sizes}</div>
        <button class="prod-ask" onclick="askProduct('${p.name}','${b.name}','${pid}')">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#04210f"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2z"/></svg>
          Consultar por WhatsApp
        </button>
      </div>
    </article>`;
  }).join("");
}

/* ===== NAVEGACIÓN ===== */
function openBrand(brandKey){
  currentBrand = brandKey; currentCat = null;
  renderCats(brandKey); switchView("view-cats"); updateCrumb();
  document.getElementById("catalogo").scrollIntoView({behavior:"smooth"});
}
function openCat(brandKey, catIdx){
  currentBrand = brandKey; currentCat = catIdx;
  renderProds(brandKey, catIdx); switchView("view-prods"); updateCrumb();
  document.getElementById("catalogo").scrollIntoView({behavior:"smooth"});
}
function goBack(){
  if(currentCat !== null){
    currentCat = null; renderCats(currentBrand); switchView("view-cats"); updateCrumb();
  } else {
    currentBrand = null; switchView("view-brands"); updateCrumb();
  }
  document.getElementById("catalogo").scrollIntoView({behavior:"smooth"});
}
function switchView(id){
  ["view-brands","view-cats","view-prods"].forEach(v=>{
    document.getElementById(v).classList.toggle("active", v===id);
  });
  document.getElementById("catalogNav").style.display = id!=="view-brands" ? "flex" : "none";
}
function updateCrumb(){
  const el = document.getElementById("crumb");
  if(!currentBrand){ el.innerHTML=""; return; }
  const b = CATALOG[currentBrand];
  if(currentCat === null){
    el.innerHTML = `<span class="cur">${b.name}</span>`;
  } else {
    const cat = b.categories[currentCat];
    el.innerHTML = `<span onclick="openBrand('${currentBrand}')" style="cursor:pointer;color:var(--muted)">${b.name}</span>
      <span class="sep">›</span><span class="cur">${catDisplayName(cat.name)}</span>`;
  }
}

/* ===== TALLES ===== */
function pickSize(pid, s, el){
  selSize[pid] = s;
  document.querySelectorAll(`.sz[data-pid="${pid}"]`).forEach(b=>b.classList.toggle("sel", b.dataset.s===s));
}

/* ===== CONSULTAR ===== */
function askProduct(name, brand, pid){
  const size = selSize[pid];
  let msg = `¡Hola JEASS! 🪐 Quiero consultar por:\n\n▸ ${brand} — ${name}`;
  if(size) msg += `\n▸ Talle: ${size}`;
  msg += `\n\n¿Está disponible?`;
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
}
function encargo(){
  const msg = "¡Hola JEASS! 🪐 Quiero hacer un encargo. Estoy buscando:";
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
}

/* ===== DROPS ===== */
function renderDrops(){
  document.getElementById("dropsGrid").innerHTML = DROPS.map((d,i)=>{
    const badge = d.status==="live"
      ? `<span class="drop-badge live"><span class="dot"></span>Disponible</span>`
      : `<span class="drop-badge soon"><span class="dot"></span>Próximo</span>`;
    return `<div class="drop">
      ${badge}
      <div><h3>${d.name}</h3><p class="drop-sub">${d.sub}</p></div>
      <div class="countdown" id="cd-${i}">
        <div class="cd-box"><div class="num">--</div><div class="unit">Días</div></div>
        <div class="cd-box"><div class="num">--</div><div class="unit">Hs</div></div>
        <div class="cd-box"><div class="num">--</div><div class="unit">Min</div></div>
        <div class="cd-box"><div class="num">--</div><div class="unit">Seg</div></div>
      </div>
      <button class="notify" onclick="notifyDrop('${d.name.replace(/'/g,"")}')">🔔 Avisame cuando salga</button>
    </div>`;
  }).join("");
  tick();
}
function tick(){
  DROPS.forEach((d,i)=>{
    const el=document.getElementById(`cd-${i}`); if(!el) return;
    const diff = new Date(d.date) - Date.now();
    const boxes = el.querySelectorAll(".num");
    if(diff<=0){ boxes.forEach(b=>b.textContent="00"); return; }
    const dd=Math.floor(diff/864e5),hh=Math.floor(diff%864e5/36e5),
          mm=Math.floor(diff%36e5/6e4),ss=Math.floor(diff%6e4/1e3);
    [dd,hh,mm,ss].forEach((v,k)=>boxes[k].textContent=String(v).padStart(2,"0"));
  });
}
function notifyDrop(name){
  const msg = `¡Hola JEASS! 🔔 Avisame cuando salga el drop "${name}". Quiero asegurarme uno.`;
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
}

/* ===== STARFIELD ===== */
(function(){
  const c=document.getElementById("stars"),x=c.getContext("2d");
  let stars=[],w,h,reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
  function size(){
    w=c.width=innerWidth;h=c.height=innerHeight;
    const n=Math.min(160,Math.floor(w*h/9000));
    stars=Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,
      r:Math.random()*1.3+.2,a:Math.random(),s:Math.random()*.4+.05,tw:Math.random()*.02+.004}));
  }
  function draw(){
    x.clearRect(0,0,w,h);
    for(const st of stars){
      st.a+=st.tw*(Math.random()>.5?1:-1);st.a=Math.max(.1,Math.min(1,st.a));
      if(!reduce){st.y+=st.s;if(st.y>h){st.y=0;st.x=Math.random()*w;}}
      x.beginPath();x.arc(st.x,st.y,st.r,0,7);
      x.fillStyle=`rgba(${200+st.r*30},${200+st.r*20},255,${st.a*.85})`;x.fill();
    }
    requestAnimationFrame(draw);
  }
  size();draw();addEventListener("resize",size);
})();

/* ===== INIT ===== */
async function initApp(){
  try {
    const [catalogRes, dropsRes] = await Promise.all([
      fetch("api/catalog.php"),
      fetch("api/drops.php"),
    ]);
    const catalogData = await catalogRes.json();
    const dropsData   = await dropsRes.json();

    CATALOG = Object.keys(catalogData).length > 0 ? catalogData : DEFAULT_CATALOG;
    DROPS   = Array.isArray(dropsData) && dropsData.length > 0 ? dropsData : DEFAULT_DROPS;
  } catch(e) {
    CATALOG = DEFAULT_CATALOG;
    DROPS   = DEFAULT_DROPS;
  }
  renderBrands();
  renderDrops();
  setInterval(tick, 1000);
}

initApp();
