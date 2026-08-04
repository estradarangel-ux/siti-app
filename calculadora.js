(function(){
"use strict";
/* =============== Catálogos =============== */
const TIPOS = {
  GD:  { nombre:"Galvanizada pared delgada", conexion:"Conector pared delgada" },
  GG:  { nombre:"Galvanizada pared gruesa",  conexion:"Monitor + contra" },
  PVC: { nombre:"PVC conduit pesado",        conexion:"Adaptador terminal PVC" },
  C40: { nombre:"PVC cédula 40",             conexion:"Conector cédula 40" }
};
const DIAM_CODE = { '½" (13 mm)':"12", '¾" (19 mm)':"34", '1" (25 mm)':"100",
                    '1¼" (32 mm)':"114", '1½" (38 mm)':"112", '2" (51 mm)':"200" };
const ANCHO_CODE = { "50 mm":"50", "100 mm":"100", "150 mm":"150", "200 mm":"200", "300 mm":"300" };
const UNI_NOMBRE = { "4x2L":"Unicanal 4x2 lisa", "4x2T":"Unicanal 4x2 troquelada",
                     "4x4L":"Unicanal 4x4 lisa", "4x4T":"Unicanal 4x4 troquelada" };
const SUJ_NOMBRE = { uni:"Trapecio unicanal", una:"Abrazadera uña",
  omega:"Abrazadera omega", clip:"Abrazadera clip" };
const ABR_NOMBRE = {
  una:   { D:"Abrazadera uña p. delgada",      G:"Abrazadera uña p. gruesa/PVC" },
  omega: { D:"Abrazadera omega p. delgada",    G:"Abrazadera omega p. gruesa" },
  clip:  { D:"Abrazadera clip p. delgada",     G:"Abrazadera clip p. gruesa/PVC" },
  strut: { D:"Abrazadera unicanal p. delgada", G:"Abrazadera unicanal p. gruesa/PVC" }
};
const REGISTROS = {
  r232:  'Caja cuadrada galv. 4x4, prof. 2 1/8" (KO ½"–¾")',
  r231:  'Caja cuadrada galv. 4x4, prof. 2 1/8" (entradas ¾")',
  r233:  'Caja cuadrada galv. 4x4, prof. 2 1/8" (entradas 1", soldada)',
  r260:  'Caja cuadrada galv. 4 11/16", prof. 3 1/4" (hasta 2")',
  rP12:  'Caja cuadrada PVC pesado ½"',
  rP34:  'Caja cuadrada PVC pesado ½"–¾"',
  rP1:   'Caja cuadrada + tapa PVC pesado 1"'
};
const TAPAS = {
  rT752:  'Tapa cuadrada ciega 4" galv.',
  rT753:  'Tapa cuadrada 4" galv. c/ entrada ½"',
  tpC416: 'Tapa cuadrada ciega 4 11/16" galv.',
  tp833:  'Tapa cuadrada 4 11/16" galv. c/ entrada ½"',
  st771:  'Sobretapa cuadrada 4", realce ¼"',
  st772:  'Sobretapa cuadrada 4", realce ½"',
  st837:  'Sobretapa cuadrada 4 11/16", realce ½"',
  st838:  'Sobretapa cuadrada 4 11/16", realce ¾"',
  stP4:   'Sobretapa plana 4"',
  rPT4:   'Tapa p/ caja cuadrada PVC pesado 4"'
};
const REG_NOMBRE = id => REGISTROS[id] || TAPAS[id] || id;
const CONDULETS = { LB:"Condulet LB", LL:"Condulet LL", LR:"Condulet LR",
  T:"Condulet T", C:"Condulet C", FS1:"Condulet FS 1 boca",
  FS2:"Condulet FS 2 bocas", FS3:"Condulet FS 3 bocas" };
const CONDULET_CLAVES = {
  LB:  { "12":"OLB-2986C", "34":"OLB-0088C", "100":"OLB-0093C" },
  LL:  { "12":"OLL-2987C", "100":"OLL-0094C" },
  LR:  { "12":"OLR-2988C", "34":"OLR-0090C" },
  T:   { "34":"OT-0087C" },
  C:   {},
  FS1: { "12":"RR-0505", "100":"RR-2631" },
  FS2: { "12":"RR-0470", "34":"RR-0471", "100":"RR-2742" },
  FS3: {}
};
/* Claves base de syscom.mx: ok=true vista en el sitio; ok=false deducida del patrón */
const BASE = {};
function def(key, c, ok){ BASE[key] = c ? { c, ok } : null; }
Object.values(DIAM_CODE).forEach(d => {
  const c40 = d === "100" ? "1" : d === "200" ? "2" : d;
  def("tubo|C40|" + d, "ATC40-" + c40 + "-TUB", true);
  def("codo|C40|" + d, "ATC40-CUR-" + c40, true);
  def("cople|C40|" + d, "ATC40-COP-" + c40, d !== "200");
  def("conector|C40|" + d, "ATC40-CON-" + c40, true);
  def("tubo|GD|" + d, "JU-PD-" + d + "-TUB", true);
  def("tubo|GG|" + d, "JU-PG-" + d + "-TUB", true);
  def("tubo|PVC|" + d, "ATUP-" + d + "-TUB", ["34","114"].includes(d));
  def("codo|GD|" + d, "JU-PD-" + d + "-COD", d !== "34");
  def("codo|GG|" + d, "JU-PG-" + d + "-COD", ["12","100"].includes(d));
  def("codo|PVC|" + d, "ATUP-" + d + "-COD", ["12","34","100","112","200"].includes(d));
  def("cople|GD|" + d, "ANC-CPD" + d, ["34","100","114"].includes(d));
  def("cople|GG|" + d, "JU-PG-" + d + "-COP", ["12","100"].includes(d));
  def("cople|PVC|" + d, "ATUP-" + d + "-COP", d === "114");
  def("conector|GD|" + d, "ANC-CCL" + d, ["12","34","100","200"].includes(d));
  def("conector|PVC|" + d, "ATUP-" + d + "-CON", false);
  def("monitor|" + d, "ANC-MT-" + d, ["12","200"].includes(d));
  def("abr|una|D|" + d, "ANC-UC-" + d, d === "112");
  def("abr|strut|D|" + d, "ANC-AW-" + d, ["12","114"].includes(d));
  def("abr|strut|G|" + d, "ANC-AE-" + d, d === "100");
  ["contra|","colgador|","abr|una|G|","abr|omega|D|","abr|omega|G|",
   "abr|clip|D|","abr|clip|G|"].forEach(pfx => def(pfx + d, null, false));
  Object.keys(CONDULETS).forEach(t =>
    def("cond|" + t + "|" + d, CONDULET_CLAVES[t][d] || null, !!CONDULET_CLAVES[t][d]));
});
def("reg|r232", "HUB-232", true);  def("reg|r231", "HUB-231", true);
def("reg|r233", "HUB-233", true);  def("reg|r260", "HUB-260", true);
def("reg|rT752", "HUB-752", true); def("reg|rT753", "HUB-753", true);
def("reg|tp833", "HUB-833", true);
def("reg|st771", "HUB-771", true); def("reg|st772", "HUB-772", true);
def("reg|st837", "HUB-837", true); def("reg|st838", "HUB-838", true);
["rP12","rP34","rP1","rPT4","tpC416","stP4"].forEach(r => def("reg|" + r, null, false));
Object.values(ANCHO_CODE).forEach(a => {
  def("charola|" + a, "CH-54-" + a + "EZ", ["100","150"].includes(a));
  def("union|" + a, a === "300" ? "MG-51-110EZ" : "MG-67-112EZ", true);
});
def("kitclema", "MG-51-KIT1EZ", true);
def("uni|4x2L", "UNL-4X2-U30-EZ", true);
def("uni|4x2T", "UNP-4X2-U30-EZ", false);
def("uni|4x4L", "UNL-4X4-U30-EZ", false);
def("uni|4x4T", "UNP-4X4-U30-EZ", false);
def('varilla|1/4"', "CH-VR-6-3000", true);
def('varilla|3/8"', "CH-VR-9-3000", true);
def('taqZ|1/4"', "ANC-Z14", true);
def('taqZ|3/8"', "ANC-Z38", false);
['tuerca|1/4"','tuerca|3/8"','rondana|1/4"','rondana|3/8"',
 "anclaMuro","pija","taquete","cemento"].forEach(k => def(k, null, false));

/* =============== Claves editables con guardado =============== */
let OVR = {};      // { key: clave manual }
let PRECIOS = {};  // { key: precio unitario MXN sin IVA }
let cfgIVA = { on:false, tasa:16 };
const store = {
  async load(clave){
    try{
      if (window.storage){
        const r = await window.storage.get(clave);
        if (r && r.value) return JSON.parse(r.value);
      }
    }catch(e){}
    try{
      const v = window.localStorage && localStorage.getItem(clave);
      if (v) return JSON.parse(v);
    }catch(e){}
    return {};
  },
  async save(clave, o){
    let ok = false;
    try{
      if (window.storage){ await window.storage.set(clave, JSON.stringify(o)); ok = true; }
    }catch(e){}
    if (!ok){
      try{ localStorage.setItem(clave, JSON.stringify(o)); ok = true; }catch(e){}
    }
    return ok;
  }
};
function getClave(key){
  if (Object.prototype.hasOwnProperty.call(OVR, key))
    return { c: OVR[key], ok: true, custom: true };
  return BASE[key] !== undefined ? BASE[key] : null;
}
async function editarClave(key, nombre){
  const actual = getClave(key);
  const v = prompt("Clave Syscom para:\n" + nombre +
    "\n\n(Deja vacío para volver a la clave original)", actual ? actual.c : "");
  if (v === null) return;
  const limpio = v.trim();
  if (limpio) OVR[key] = limpio; else delete OVR[key];
  const guardado = await store.save("calc_claves_syscom_v1", OVR);
  $("catStatus").textContent = guardado
    ? "Claves guardadas en este dispositivo (" + Object.keys(OVR).length + " personalizadas)."
    : "Sin almacenamiento disponible: exporta las claves para no perderlas.";
  render();
}

const money = n => n.toLocaleString("es-MX", { style:"currency", currency:"MXN" });
function getPrecio(key){
  const v = PRECIOS[key];
  return typeof v === "number" && v > 0 ? v : null;
}
async function editarPrecio(key, nombre){
  const actual = getPrecio(key);
  const v = prompt("Precio unitario en MXN (sin IVA) para:\n" + nombre +
    "\n\n(Deja vacío para quitar el precio)", actual != null ? String(actual) : "");
  if (v === null) return;
  const num = parseFloat(v.replace(/[$,\s]/g, ""));
  if (num > 0) PRECIOS[key] = Math.round(num * 100) / 100; else delete PRECIOS[key];
  const guardado = await store.save("calc_precios_syscom_v1", PRECIOS);
  $("catStatus").textContent = guardado
    ? "Precios guardados en este dispositivo (" + Object.keys(PRECIOS).length + " partidas con precio)."
    : "Sin almacenamiento disponible: exporta el catálogo para no perderlo.";
  render();
}

/* =============== Estado =============== */
let tramos = [];
let sistemaActivo = "C";
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("es-MX");
const r1 = n => Math.round(n * 10) / 10;
const r2 = n => Math.round(n * 100) / 100;

function leerParams(){
  const num = (id, def, min) => Math.max(parseFloat($(id).value) || def, min);
  return {
    desp: Math.max(parseFloat($("pDesp").value) || 0, 0) / 100,
    largo: num("pLargo", 3.05, 0.5), sep: num("pSep", 1.5, 0.3),
    espC: $("pEspC").value, espCh: $("pEspCh").value,
    largoCh: num("pLargoCh", 3, 0.5), sepCh: num("pSepCh", 1.5, 0.3),
    uniones: Math.max(parseInt($("pUni").value, 10) || 2, 1),
    clemas: Math.max(parseInt($("pClemas").value, 10) || 2, 1),
    largoUni: num("pLargoUni", 3.05, 0.5), largoVar: num("pLargoVar", 3, 0.5)
  };
}

/* =============== Cálculo por tramo =============== */
function calcConduit(t, p){
  const tubos = t.metros > 0 ? Math.ceil(t.metros * (1 + p.desp) / p.largo) : 0;
  const s = t.metros > 0 ? Math.ceil(t.metros / p.sep) : 0;
  const fam = t.tipo === "GD" ? "D" : "G";
  const out = {
    tubos, coples: tubos,
    conectores: t.tipo !== "GG" ? t.salidas : 0,
    monitores: t.tipo === "GG" ? t.salidas : 0,
    contras: t.tipo === "GG" ? t.salidas : 0,
    codos: t.codos, soportes: s, fam,
    abrKey: null, colgadores: 0, pijas: 0, taquetes: 0,
    uniMedida: null, uniM: 0, espPzas: 0, espM: 0, anclasMuro: 0
  };
  if (s === 0) return out;
  if (t.sujecion === "uni"){
    out.abrKey = "strut";
    out.uniMedida = t.uniMedida; out.uniM = s * t.uniLargo;
    out.espPzas = s * 2; out.espM = s * 2 * t.espLargo;
  } else {
    out.abrKey = t.sujecion;                       // una / omega / clip
    const porSoporte = t.sujecion === "omega" ? 2 : 1;
    out.pijas = s * porSoporte; out.taquetes = s * porSoporte;
  }
  return out;
}
function calcCharofil(t, p){
  const tr = t.metros > 0 ? Math.ceil(t.metros * (1 + p.desp) / p.largoCh) : 0;
  const s = t.metros > 0 ? Math.ceil(t.metros / p.sepCh) : 0;
  const largo = t.uniLargo > 0 ? t.uniLargo : (parseInt(t.ancho, 10) / 1000 + 0.15);
  const out = { tramos: tr, uniones: tr * p.uniones, soportes: s,
    clemas: s * p.clemas, uniMedida: t.uniMedida, uniM: s * largo,
    espPzas: 0, espM: 0, anclasMuro: 0 };
  if (t.montaje === "A"){ out.espPzas = s * 2; out.espM = s * 2 * t.espLargo; }
  else out.anclasMuro = s * 2;
  return out;
}

/* =============== Agregación =============== */
function nuevoSop(){
  return { abr:new Map(), colg:new Map(), uni:new Map(), esp:new Map(),
    anclasMuro:0, pijas:0, taquetes:0, clemas:0, unionesCh:0, sopCh:0 };
}
function addEsp(m, dm, pzas, metros){
  const e = m.get(dm) || { pzas:0, m:0 };
  e.pzas += pzas; e.m += metros; m.set(dm, e);
}
function agrupar(){
  const p = leerParams();
  const gruposC = new Map(), gruposCh = new Map(), areas = new Map();
  const regs = new Map(), conds = new Map();
  const tot = nuevoSop();
  let unionesPVC = 0, mConduit = 0, mCharola = 0, tubosTot = 0, tramosChTot = 0;
  const sopArea = area => {
    if (!areas.has(area)) areas.set(area, nuevoSop());
    return areas.get(area);
  };
  const addUni = (m, medida, metros) => m.set(medida, (m.get(medida) || 0) + metros);

  tramos.forEach(t => {
    if (t.sistema === "C"){
      const c = calcConduit(t, p);
      const key = t.tipo + "|" + t.diam;
      if (!gruposC.has(key)) gruposC.set(key, { tipo:t.tipo, diam:t.diam, metros:0,
        tubos:0, coples:0, conectores:0, monitores:0, contras:0, codos:0 });
      const g = gruposC.get(key);
      g.metros += t.metros; g.tubos += c.tubos; g.coples += c.coples;
      g.conectores += c.conectores; g.monitores += c.monitores;
      g.contras += c.contras; g.codos += c.codos;
      (t.accs || []).forEach(a => {
        if (a.k === "reg") regs.set(a.id, (regs.get(a.id) || 0) + a.cant);
        else {
          const ck = a.id + "|" + t.diam;
          conds.set(ck, (conds.get(ck) || 0) + a.cant);
        }
      });
      const a = sopArea(t.area);
      [a, tot].forEach(sp => {
        if (c.abrKey){
          const ak = c.abrKey + "|" + c.fam + "|" + t.diam;
          sp.abr.set(ak, (sp.abr.get(ak) || 0) + c.soportes);
        }
        if (c.colgadores) sp.colg.set(t.diam, (sp.colg.get(t.diam) || 0) + c.colgadores);
        if (c.uniM) addUni(sp.uni, c.uniMedida, c.uniM);
        if (c.espPzas) addEsp(sp.esp, p.espC, c.espPzas, c.espM);
        sp.anclasMuro += c.anclasMuro; sp.pijas += c.pijas; sp.taquetes += c.taquetes;
      });
      mConduit += t.metros; tubosTot += c.tubos;
      if (t.tipo === "PVC" || t.tipo === "C40") unionesPVC += c.coples + c.conectores + c.codos;
    } else {
      const c = calcCharofil(t, p);
      if (!gruposCh.has(t.ancho)) gruposCh.set(t.ancho,
        { ancho:t.ancho, metros:0, tramos:0, uniones:0, clemas:0, soportes:0 });
      const g = gruposCh.get(t.ancho);
      g.metros += t.metros; g.tramos += c.tramos; g.uniones += c.uniones;
      g.clemas += c.clemas; g.soportes += c.soportes;
      const a = sopArea(t.area);
      [a, tot].forEach(sp => {
        addUni(sp.uni, c.uniMedida, c.uniM);
        if (c.espPzas) addEsp(sp.esp, p.espCh, c.espPzas, c.espM);
        sp.anclasMuro += c.anclasMuro;
        sp.clemas += c.clemas; sp.unionesCh += c.uniones; sp.sopCh += c.soportes;
      });
      mCharola += t.metros; tramosChTot += c.tramos;
    }
  });

  const uniTramos = new Map();
  tot.uni.forEach((m, medida) => uniTramos.set(medida, Math.ceil(m / p.largoUni)));
  const varillas = new Map(), taqZ = new Map(), tuercas = new Map(), rondanas = new Map();
  tot.esp.forEach((e, dm) => {
    varillas.set(dm, Math.ceil(e.m / p.largoVar));
    taqZ.set(dm, e.pzas); tuercas.set(dm, e.pzas * 2); rondanas.set(dm, e.pzas * 2);
  });
  return {
    gruposC: [...gruposC.values()], gruposCh: [...gruposCh.values()],
    regs, conds, areas, tot, uniTramos, varillas, taqZ, tuercas, rondanas,
    cemento: unionesPVC > 0 ? Math.ceil(unionesPVC / 75) : 0,
    mConduit, mCharola, tubosTot, tramosChTot
  };
}

/* =============== Partidas para cotizar (totales) =============== */
function partidasCotizacion(d){
  const out = [];
  const push = (nombre, key, cant, unidad) => {
    if (cant > 0) out.push({ nombre, key, clave: getClave(key), cant, unidad: unidad || "pza" });
  };
  d.gruposC.forEach(g => {
    const dc = DIAM_CODE[g.diam], n = TIPOS[g.tipo].nombre + " " + g.diam;
    push("Tubo " + n + " (3 m)", "tubo|" + g.tipo + "|" + dc, g.tubos);
    push("Cople " + n, "cople|" + g.tipo + "|" + dc, g.coples);
    if (g.conectores) push(TIPOS[g.tipo].conexion + " " + g.diam,
      "conector|" + g.tipo + "|" + dc, g.conectores);
    if (g.monitores){
      push("Monitor " + g.diam, "monitor|" + dc, g.monitores);
      push("Contratuerca " + g.diam, "contra|" + dc, g.contras);
    }
    push("Codo 90° " + n, "codo|" + g.tipo + "|" + dc, g.codos);
  });
  d.regs.forEach((n, id) => push(REG_NOMBRE(id), "reg|" + id, n));
  d.conds.forEach((n, ck) => {
    const p = ck.split("|");
    push(CONDULETS[p[0]] + " " + p[1], "cond|" + p[0] + "|" + DIAM_CODE[p[1]], n);
  });
  d.gruposCh.forEach(g => {
    const a = ANCHO_CODE[g.ancho];
    push("Charola Charofil 54/" + g.ancho + " (3 m)", "charola|" + a, g.tramos);
    push("Unión rápida charola " + g.ancho, "union|" + a, g.uniones);
    push("Kit de clema charola " + g.ancho, "kitclema", g.clemas);
  });
  d.tot.abr.forEach((n, ak) => {
    const parts = ak.split("|");
    push(ABR_NOMBRE[parts[0]][parts[1]] + " " + parts[2],
      "abr|" + parts[0] + "|" + parts[1] + "|" + DIAM_CODE[parts[2]], n);
  });
  d.tot.colg.forEach((n, diam) =>
    push("Colgador tipo pera " + diam, "colgador|" + DIAM_CODE[diam], n));
  d.uniTramos.forEach((n, medida) =>
    push(UNI_NOMBRE[medida] + " (tramo 3 m)", "uni|" + medida, n));
  [...d.tot.esp.keys()].sort().forEach(dm => {
    push("Varilla roscada " + dm + " x 3 m", "varilla|" + dm, d.varillas.get(dm));
    push("Taquete expansor Z " + dm + " (varilla)", "taqZ|" + dm, d.taqZ.get(dm));
    push("Tuerca hexagonal " + dm, "tuerca|" + dm, d.tuercas.get(dm));
    push("Rondana plana " + dm, "rondana|" + dm, d.rondanas.get(dm));
  });
  push("Ancla a muro c/ tornillo (unicanal)", "anclaMuro", d.tot.anclasMuro);
  push("Pija multiusos", "pija", d.tot.pijas);
  push("Taquete plástico", "taquete", d.tot.taquetes);
  push("Cemento PVC 250 ml", "cemento", d.cemento, "bote");
  return out;
}

/* =============== UI: formulario =============== */
function refrescarCamposC(){
  const uni = $("tSujecion").value === "uni";
  $("uniFieldsC").hidden = !uni;
  $("espFieldC").hidden = !uni;
}
function refrescarCamposCH(){
  $("espFieldCH").style.visibility = $("cMontaje").value === "A" ? "visible" : "hidden";
}

function agregarTramo(){
  if (sistemaActivo === "C"){
    const metros  = parseFloat($("tMetros").value)   || 0;
    const salidas = parseInt($("tSalidas").value,10) || 0;
    const codos   = parseInt($("tCodos").value,10)   || 0;
    const accs = [];
    $("accList").querySelectorAll(".acc-row").forEach(row => {
      const v = row.querySelector("select").value;
      const cant = parseInt(row.querySelector("input").value, 10) || 0;
      if (v && cant > 0){
        const p = v.split(":");
        accs.push({ k: p[0], id: p[1], cant });
      }
    });
    if (metros <= 0 && salidas <= 0 && codos <= 0 && !accs.length){
      $("tMetros").focus(); return;
    }
    tramos.push({
      id: Date.now() + Math.random(), sistema:"C",
      area: $("tArea").value.trim() || "Sin área",
      tipo: $("tTipo").value, diam: $("tDiam").value,
      montaje: $("tSujecion").value === "uni" ? "A" : "P",
      sujecion: $("tSujecion").value,
      uniMedida: $("tUniMedida").value,
      uniLargo: Math.max(parseFloat($("tUniLargo").value) || 0.30, 0.05),
      espLargo: Math.max(parseFloat($("tEspLargo").value) || 0.40, 0.05),
      metros, salidas, codos, accs
    });
    $("tMetros").value = ""; $("tSalidas").value = ""; $("tCodos").value = "";
    $("accList").innerHTML = "";
  } else {
    const metros = parseFloat($("cMetros").value) || 0;
    if (metros <= 0){ $("cMetros").focus(); return; }
    tramos.push({
      id: Date.now() + Math.random(), sistema:"CH",
      area: $("tArea").value.trim() || "Sin área",
      ancho: $("cAncho").value, metros,
      montaje: $("cMontaje").value, uniMedida: $("cUniMedida").value,
      uniLargo: parseFloat($("cUniLargo").value) || 0,
      espLargo: Math.max(parseFloat($("cEspLargo").value) || 0.40, 0.05)
    });
    $("cMetros").value = "";
  }
  $("tArea").focus();
  render();
}
function quitarTramo(id){ tramos = tramos.filter(t => t.id !== id); render(); }
function setSistema(s){
  sistemaActivo = s;
  $("formC").hidden = s !== "C"; $("formCH").hidden = s !== "CH";
  $("tabC").classList.toggle("on", s === "C");
  $("tabCH").classList.toggle("on", s === "CH");
  $("tabC").setAttribute("aria-selected", s === "C");
  $("tabCH").setAttribute("aria-selected", s === "CH");
}

function renderTramos(){
  const cont = $("listaTramos");
  if (!tramos.length){
    cont.innerHTML = '<div class="empty">Aún no hay tramos. Agrega el primero arriba.</div>';
    return;
  }
  cont.innerHTML = "";
  tramos.forEach(t => {
    const div = document.createElement("div");
    div.className = "tramo";
    const mont = t.montaje === "A" ? "Aérea" : "Pared";
    let desc;
    if (t.sistema === "C"){
      desc = '<span class="chip ' + t.tipo + '">' + t.tipo + "</span> " +
        TIPOS[t.tipo].nombre + " · " + t.diam + " · " + mont + " · " +
        SUJ_NOMBRE[t.sujecion] + " · " + t.salidas + " sal · " + t.codos + " codos";
      const nAcc = (t.accs || []).reduce((a, x) => a + x.cant, 0);
      if (nAcc) desc += " · " + nAcc + " accesorios";
    } else {
      desc = '<span class="chip CH">CH</span> Charofil ' + t.ancho + " · " + mont +
        " · " + UNI_NOMBRE[t.uniMedida];
    }
    div.innerHTML = '<div class="info"><strong></strong><span>' + desc + "</span></div>" +
      '<div class="num">' + fmt(t.metros) + " m</div>";
    div.querySelector("strong").textContent = t.area;
    const btn = document.createElement("button");
    btn.className = "btn-danger"; btn.type = "button";
    btn.setAttribute("aria-label", "Eliminar tramo " + t.area);
    btn.textContent = "✕";
    btn.addEventListener("click", () => quitarTramo(t.id));
    div.appendChild(btn);
    cont.appendChild(div);
  });
}

/* =============== UI: vale =============== */
function esc(s){ return s.replace(/[<>&"]/g, ch =>
  ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;" }[ch])); }
function tagClave(key, nombre){
  const cv = getClave(key);
  const attrs = ' role="button" tabindex="0" data-key="' + esc(key) +
    '" data-nombre="' + esc(nombre) + '" title="Toca para editar la clave"';
  if (!cv) return '<span class="cl na"' + attrs + ">s/clave ✎</span>";
  const cls = cv.custom ? "cl custom" : "cl";
  return '<span class="' + cls + '"' + attrs + ">" + esc(cv.c) +
    (cv.ok || cv.custom ? "" : "*") + "</span>" +
    '<button type="button" class="copy" data-copy="' + esc(cv.c) +
    '" title="Copiar número de parte" aria-label="Copiar clave ' + esc(cv.c) + '">⧉</button>';
}
function fila(nombre, cant, opts){
  const o = opts || {};
  const et = o.key ? tagClave(o.key, nombre) : "";
  const v = o.dec ? fmt(r2(cant)) : fmt(cant);
  return "<tr><td>" + nombre + et + "</td><td>" + v + (o.suf || "") + "</td></tr>";
}
function filasSoporteria(sp){
  let h = "";
  sp.abr.forEach((n, ak) => {
    const parts = ak.split("|");
    const nom = ABR_NOMBRE[parts[0]][parts[1]] + " " + parts[2];
    h += fila(nom + " (pza)", n, { key: "abr|" + parts[0] + "|" + parts[1] + "|" + DIAM_CODE[parts[2]] });
  });
  sp.colg.forEach((n, diam) =>
    h += fila("Colgador tipo pera " + diam + " (pza)", n, { key: "colgador|" + DIAM_CODE[diam] }));
  sp.uni.forEach((m, medida) =>
    h += fila(UNI_NOMBRE[medida], m, { key: "uni|" + medida, dec: true, suf: " m" }));
  [...sp.esp.keys()].sort().forEach(dm => {
    const e = sp.esp.get(dm);
    h += fila("Espárragos " + dm + " (" + fmt(r2(e.m)) + " m)", e.pzas, {}) +
         fila("Taquete expansor Z " + dm + " (pza)", e.pzas, { key: "taqZ|" + dm }) +
         fila("Tuerca hexagonal " + dm + " (pza)", e.pzas * 2, { key: "tuerca|" + dm }) +
         fila("Rondana plana " + dm + " (pza)", e.pzas * 2, { key: "rondana|" + dm });
  });
  if (sp.anclasMuro) h += fila("Ancla a muro c/ tornillo (pza)", sp.anclasMuro, { key: "anclaMuro" });
  if (sp.pijas) h += fila("Pijas (pza)", sp.pijas, { key: "pija" }) +
                     fila("Taquetes plásticos (pza)", sp.taquetes, { key: "taquete" });
  if (sp.clemas) h += fila("Kits de clema (pza)", sp.clemas, { key: "kitclema" }) +
                      fila("Uniones rápidas de charola (pza)", sp.unionesCh, {}) +
                      fila("Soportes de charola (pto)", sp.sopCh, {});
  return h;
}
function renderTicket(){
  const d = agrupar();
  const obra = $("obra").value.trim();
  const hoy = new Date();
  const fecha = hoy.toLocaleDateString("es-MX", { day:"2-digit", month:"short", year:"numeric" });
  $("folio").textContent = "FOLIO " + hoy.getFullYear() +
    String(hoy.getMonth()+1).padStart(2,"0") + String(hoy.getDate()).padStart(2,"0") +
    "-" + String(tramos.length).padStart(2,"0") + " · " + fecha;

  const body = $("ticketBody");
  if (!d.gruposC.length && !d.gruposCh.length){
    body.innerHTML = '<div class="empty">El vale se llena solo conforme agregas tramos.</div>';
    return;
  }
  let html = obra ? '<p style="margin:0 0 6px;font-size:13px"><b>Obra:</b> ' + esc(obra) + "</p>" : "";

  if (d.gruposC.length){
    html += '<div class="seccion">Tubería conduit</div>';
    ["GD","GG","PVC","C40"].forEach(tipo => {
      d.gruposC.filter(g => g.tipo === tipo)
        .sort((a,b) => a.diam.localeCompare(b.diam, "es"))
        .forEach(g => {
          const dc = DIAM_CODE[g.diam];
          html += '<div class="grupo"><div class="grupo-titulo">' +
            '<span class="chip ' + g.tipo + '">' + g.tipo + "</span>" +
            TIPOS[g.tipo].nombre + " · " + g.diam +
            ' <span style="color:var(--muted);font-weight:400">(' + fmt(r1(g.metros)) + " m)</span></div>" +
            '<table class="mat"><tbody>' +
            fila("Tubo de 3 m (pza)", g.tubos, { key: "tubo|" + g.tipo + "|" + dc }) +
            fila("Cople (pza)", g.coples, { key: "cople|" + g.tipo + "|" + dc });
          if (g.conectores) html += fila(TIPOS[g.tipo].conexion + " (pza)", g.conectores,
            { key: "conector|" + g.tipo + "|" + dc });
          if (g.monitores) html += fila("Monitor (pza)", g.monitores, { key: "monitor|" + dc }) +
            fila("Contratuerca (pza)", g.contras, { key: "contra|" + dc });
          if (g.codos) html += fila("Codo 90° (pza)", g.codos, { key: "codo|" + g.tipo + "|" + dc });
          html += "</tbody></table></div>";
        });
    });
  }
  if (d.regs.size || d.conds.size){
    html += '<div class="seccion">Registros, tapas y condulets</div><div class="grupo"><table class="mat"><tbody>';
    d.regs.forEach((n, id) => html += fila(REG_NOMBRE(id) + " (pza)", n, { key: "reg|" + id }));
    d.conds.forEach((n, ck) => {
      const p = ck.split("|");
      html += fila(CONDULETS[p[0]] + " " + p[1] + " (pza)", n, { key: "cond|" + p[0] + "|" + DIAM_CODE[p[1]] });
    });
    html += "</tbody></table></div>";
  }
  if (d.gruposCh.length){
    html += '<div class="seccion">Escalerilla Charofil</div>';
    d.gruposCh.sort((a,b) => parseInt(a.ancho,10) - parseInt(b.ancho,10)).forEach(g => {
      const a = ANCHO_CODE[g.ancho];
      html += '<div class="grupo"><div class="grupo-titulo">' +
        '<span class="chip CH">CH</span>Escalerilla 54/' + g.ancho +
        ' <span style="color:var(--muted);font-weight:400">(' + fmt(r1(g.metros)) + " m)</span></div>" +
        '<table class="mat"><tbody>' +
        fila("Tramo de charola 3 m (pza)", g.tramos, { key: "charola|" + a }) +
        fila("Unión rápida (pza)", g.uniones, { key: "union|" + a }) +
        fila("Kit de clema (pza)", g.clemas, { key: "kitclema" }) +
        "</tbody></table></div>";
    });
  }

  html += '<div class="seccion">Soportería por área</div>';
  [...d.areas.keys()].sort((a,b) => a.localeCompare(b, "es")).forEach(area => {
    const filasA = filasSoporteria(d.areas.get(area));
    if (!filasA) return;
    html += '<div class="grupo"><div class="area-tit">' + esc(area) + "</div>" +
      '<table class="mat"><tbody>' + filasA + "</tbody></table></div>";
  });

  html += '<div class="misc"><div class="seccion" style="margin-top:0">Total soportería (p/ compra)</div>' +
    '<table class="mat"><tbody>';
  d.tot.abr.forEach((n, ak) => {
    const parts = ak.split("|");
    html += fila(ABR_NOMBRE[parts[0]][parts[1]] + " " + parts[2] + " (pza)", n,
      { key: "abr|" + parts[0] + "|" + parts[1] + "|" + DIAM_CODE[parts[2]] });
  });
  d.tot.colg.forEach((n, diam) =>
    html += fila("Colgador tipo pera " + diam + " (pza)", n, { key: "colgador|" + DIAM_CODE[diam] }));
  d.uniTramos.forEach((n, medida) => {
    html += fila(UNI_NOMBRE[medida] + " — " + fmt(r2(d.tot.uni.get(medida))) + " m → tramo 3 m (pza)",
      n, { key: "uni|" + medida });
  });
  [...d.tot.esp.keys()].sort().forEach(dm => {
    html += fila("Varilla roscada " + dm + " x 3 m (pza)", d.varillas.get(dm), { key: "varilla|" + dm }) +
      fila("Taquete expansor Z " + dm + " (pza)", d.taqZ.get(dm), { key: "taqZ|" + dm }) +
      fila("Tuerca hexagonal " + dm + " (pza)", d.tuercas.get(dm), { key: "tuerca|" + dm }) +
      fila("Rondana plana " + dm + " (pza)", d.rondanas.get(dm), { key: "rondana|" + dm });
  });
  if (d.tot.anclasMuro) html += fila("Ancla a muro c/ tornillo (pza)", d.tot.anclasMuro, { key: "anclaMuro" });
  if (d.tot.pijas) html += fila("Pijas (pza)", d.tot.pijas, { key: "pija" }) +
    fila("Taquetes plásticos (pza)", d.tot.taquetes, { key: "taquete" });
  if (d.cemento) html += fila("Cemento PVC 250 ml (bote)", d.cemento, { key: "cemento" });
  html += "</tbody></table></div>";

  const partidas = partidasCotizacion(d);
  let sub = 0, sinPrecio = 0, filasC = "";
  partidas.forEach(x => {
    const pu = getPrecio(x.key);
    const imp = pu != null ? pu * x.cant : 0;
    sub += imp; if (pu == null) sinPrecio++;
    filasC += "<tr><td>" + x.nombre + tagClave(x.key, x.nombre) + "</td><td>" + fmt(x.cant) +
      '</td><td><span class="pu' + (pu == null ? " vacio" : "") +
      '" role="button" tabindex="0" data-pkey="' + esc(x.key) + '" data-nombre="' + esc(x.nombre) +
      '" title="Toca para capturar o corregir el precio">' + (pu == null ? "$ —" : money(pu)) +
      "</span></td><td>" + (pu == null ? "—" : money(imp)) + "</td></tr>";
  });
  const iva = cfgIVA.on ? sub * cfgIVA.tasa / 100 : 0;
  html += '<div class="seccion">Costo estimado de compra</div>' +
    '<table class="cot"><thead><tr><th>Partida</th><th>Cant</th><th>P.U.</th><th>Importe</th></tr></thead><tbody>' +
    filasC +
    '<tr class="cot-tot"><td colspan="3">Subtotal' + (cfgIVA.on ? " (sin IVA)" : "") + "</td><td>" + money(sub) + "</td></tr>" +
    (cfgIVA.on
      ? '<tr class="cot-tot"><td colspan="3">IVA ' + cfgIVA.tasa + "%</td><td>" + money(iva) + "</td></tr>" +
        '<tr class="cot-tot"><td colspan="3">TOTAL</td><td>' + money(sub + iva) + "</td></tr>"
      : "") +
    "</tbody></table>" +
    '<p class="hint" style="margin-top:6px"><label style="display:inline;font-size:12px;text-transform:none;letter-spacing:0;color:var(--ink)">' +
    '<input type="checkbox" id="ivaChk" style="width:auto;margin-right:5px"' + (cfgIVA.on ? " checked" : "") + ">Agregar IVA</label> " +
    '<input id="ivaTasa" type="number" min="0" max="30" step="0.5" value="' + cfgIVA.tasa +
    '" style="width:64px;padding:3px 6px;display:inline-block"> % · ' +
    "Toca un precio para capturarlo desde tu cotización de Syscom; queda guardado para futuros casos." +
    (sinPrecio ? " <b>" + sinPrecio + " partida(s) sin precio</b> no suman al costo." : "") + "</p>";

  html += '<p class="leyenda">Claves de syscom.mx: JUPITER (tubo y codo galvanizado), AMANCO WAVIN (PVC pesado y cédula 40), ' +
    "ANCLO (conexiones y abrazaderas), RAWELT (condulets y cajas FS), RACO (cajas cuadradas) y CHAROFIL 54 mm EZ. " +
    "Nota: el tubo pared gruesa JUPITER ya incluye 1 cople por tubo. " +
    "* = deducida del patrón de la serie · verde = clave asignada manualmente · " +
    "«s/clave» = tócala para asignar el número de parte; queda guardado para futuros casos.</p>";

  html += '<div class="totales">' +
    '<div class="kpi"><b>' + fmt(r1(d.mConduit)) + "</b><span>m conduit</span></div>" +
    '<div class="kpi"><b>' + fmt(d.tubosTot) + "</b><span>tubos</span></div>" +
    '<div class="kpi"><b>' + fmt(r1(d.mCharola)) + "</b><span>m charola</span></div>" +
    '<div class="kpi"><b>' + fmt(d.tramosChTot) + "</b><span>tramos charola</span></div></div>";

  body.innerHTML = html;
}
function render(){ renderTramos(); renderTicket(); }

/* =============== Exportaciones =============== */
function textoCotizacion(){
  const d = agrupar();
  const partidas = partidasCotizacion(d);
  const conClave = partidas.filter(x => x.clave);
  const sinClave = partidas.filter(x => !x.clave);
  let out = "COTIZACION SYSCOM - " + new Date().toLocaleDateString("es-MX") + "\n";
  const obra = $("obra").value.trim();
  if (obra) out += "Obra: " + obra + "\n";
  let sub = 0, sinPrecio = 0;
  const linPrecio = x => {
    const pu = getPrecio(x.key);
    if (pu == null){ sinPrecio++; return "-\t-"; }
    sub += pu * x.cant;
    return pu.toFixed(2) + "\t" + (pu * x.cant).toFixed(2);
  };
  out += "\nCLAVE\tCANTIDAD\tP.UNIT\tIMPORTE\tPARTIDA\n";
  conClave.forEach(x => {
    const marca = x.clave.custom ? " (manual)" : (x.clave.ok ? "" : " (*)");
    out += x.clave.c + marca + "\t" + x.cant + "\t" + linPrecio(x) + "\t" + x.nombre + "\n";
  });
  if (sinClave.length){
    out += "\nSIN CLAVE (asignar en la app o buscar por descripcion):\n";
    sinClave.forEach(x => { out += "-\t" + x.cant + " " + x.unidad + "\t" + linPrecio(x) + "\t" + x.nombre + "\n"; });
  }
  out += "\nSUBTOTAL (sin IVA): $" + sub.toFixed(2) + " MXN\n";
  if (cfgIVA.on){
    out += "IVA " + cfgIVA.tasa + "%: $" + (sub * cfgIVA.tasa / 100).toFixed(2) + " MXN\n";
    out += "TOTAL: $" + (sub * (1 + cfgIVA.tasa / 100)).toFixed(2) + " MXN\n";
  }
  if (sinPrecio) out += "(" + sinPrecio + " partidas sin precio capturado no suman al costo)\n";
  out += "(*) clave deducida del patron: confirmar en syscom.mx\n";
  return out;
}
function textoResumen(){
  const d = agrupar();
  let out = "LISTA DE MATERIAL - INSTALACION ELECTRICA\n";
  const obra = $("obra").value.trim();
  if (obra) out += "Obra: " + obra + "\n";
  out += "Fecha: " + new Date().toLocaleDateString("es-MX") + "\n\n";
  partidasCotizacion(d).forEach(x => {
    out += "  " + x.nombre +
      (x.clave ? " [" + x.clave.c + (x.clave.ok || x.clave.custom ? "" : "*") + "]" : "") +
      ": " + x.cant + " " + x.unidad + "\n";
  });
  out += "\nSOPORTERIA POR AREA\n";
  [...d.areas.keys()].sort().forEach(area => {
    const sp = d.areas.get(area);
    out += "· " + area + "\n";
    sp.abr.forEach((n, ak) => {
      const parts = ak.split("|");
      out += "    " + ABR_NOMBRE[parts[0]][parts[1]] + " " + parts[2] + ": " + n + "\n";
    });
    sp.colg.forEach((n, diam) => out += "    Colgador pera " + diam + ": " + n + "\n");
    sp.uni.forEach((m, medida) => out += "    " + UNI_NOMBRE[medida] + ": " + r2(m) + " m\n");
    sp.esp.forEach((e, dm) => out += "    Esparragos " + dm + ": " + e.pzas + " pzas (" + r2(e.m) + " m)\n");
    if (sp.anclasMuro) out += "    Anclas a muro: " + sp.anclasMuro + "\n";
    if (sp.pijas) out += "    Pijas: " + sp.pijas + " | Taquetes: " + sp.taquetes + "\n";
    if (sp.clemas) out += "    Kits clema: " + sp.clemas + " | Uniones: " + sp.unionesCh + "\n";
  });
  let sub = 0, sinPrecio = 0;
  partidasCotizacion(d).forEach(x => {
    const pu = getPrecio(x.key);
    if (pu == null) sinPrecio++; else sub += pu * x.cant;
  });
  if (sub > 0 || sinPrecio){
    out += "\nCOSTO ESTIMADO (sin IVA): $" + sub.toFixed(2) + " MXN";
    if (cfgIVA.on) out += " | Con IVA " + cfgIVA.tasa + "%: $" + (sub * (1 + cfgIVA.tasa / 100)).toFixed(2) + " MXN";
    if (sinPrecio) out += " | " + sinPrecio + " partidas sin precio";
    out += "\n";
  }
  return out;
}
function descargarCSV(){
  const d = agrupar();
  const filas = [["Partida","Clave Syscom","Estado clave","Unidad","Cantidad","P.U. MXN sin IVA","Importe MXN"]];
  let sub = 0, sinPrecio = 0;
  partidasCotizacion(d).forEach(x => {
    const pu = getPrecio(x.key);
    if (pu == null) sinPrecio++; else sub += pu * x.cant;
    filas.push([x.nombre, x.clave ? x.clave.c : "",
      x.clave ? (x.clave.custom ? "Manual" : (x.clave.ok ? "Verificada" : "Por confirmar"))
              : "Sin clave", x.unidad, x.cant,
      pu == null ? "" : pu.toFixed(2), pu == null ? "" : (pu * x.cant).toFixed(2)]);
  });
  filas.push(["SUBTOTAL (sin IVA)","","","","","", sub.toFixed(2)]);
  if (cfgIVA.on){
    filas.push(["IVA " + cfgIVA.tasa + "%","","","","","", (sub * cfgIVA.tasa / 100).toFixed(2)]);
    filas.push(["TOTAL","","","","","", (sub * (1 + cfgIVA.tasa / 100)).toFixed(2)]);
  }
  if (sinPrecio) filas.push(["Partidas sin precio (no suman)","","","","", sinPrecio, ""]);
  filas.push([]);
  filas.push(["SOPORTERIA POR AREA","","","",""]);
  [...d.areas.keys()].sort().forEach(area => {
    const sp = d.areas.get(area);
    sp.abr.forEach((n, ak) => {
      const parts = ak.split("|");
      filas.push([area, ABR_NOMBRE[parts[0]][parts[1]] + " " + parts[2], "", "pza", n]);
    });
    sp.colg.forEach((n, diam) => filas.push([area, "Colgador pera " + diam, "", "pza", n]));
    sp.uni.forEach((m, medida) => filas.push([area, UNI_NOMBRE[medida], "", "m", r2(m)]));
    sp.esp.forEach((e, dm) => filas.push([area, "Esparragos " + dm, "", "pza", e.pzas]));
    if (sp.anclasMuro) filas.push([area, "Anclas a muro", "", "pza", sp.anclasMuro]);
    if (sp.pijas){ filas.push([area, "Pijas", "", "pza", sp.pijas]);
      filas.push([area, "Taquetes plasticos", "", "pza", sp.taquetes]); }
    if (sp.clemas){ filas.push([area, "Kits de clema", "", "pza", sp.clemas]);
      filas.push([area, "Uniones rapidas", "", "pza", sp.unionesCh]); }
  });
  const csv = "\uFEFF" + filas.map(f => f.map(v =>
    '"' + String(v ?? "").replace(/"/g,'""') + '"').join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv;charset=utf-8" }));
  a.download = "cotizacion-syscom.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

/* =============== Eventos =============== */
$("tabC").addEventListener("click", () => setSistema("C"));
$("tabCH").addEventListener("click", () => setSistema("CH"));
$("tSujecion").addEventListener("change", refrescarCamposC);
$("cMontaje").addEventListener("change", refrescarCamposCH);
$("btnAdd").addEventListener("click", agregarTramo);
["tMetros","tSalidas","tCodos","cMetros"].forEach(id =>
  $(id).addEventListener("keydown", e => { if (e.key === "Enter") agregarTramo(); }));
["pDesp","pLargo","pSep","pEspC","pLargoCh","pSepCh","pUni","pClemas",
 "pEspCh","pLargoUni","pLargoVar","obra"].forEach(id =>
  $(id).addEventListener("input", renderTicket));
$("ticketBody").addEventListener("click", e => {
  const cb = e.target.closest("[data-copy]");
  if (cb){
    navigator.clipboard.writeText(cb.dataset.copy).then(() => {
      cb.textContent = "✓";
      setTimeout(() => { cb.textContent = "⧉"; }, 1200);
    });
    return;
  }
  const p = e.target.closest("[data-pkey]");
  if (p){ editarPrecio(p.dataset.pkey, p.dataset.nombre); return; }
  const el = e.target.closest("[data-key]");
  if (el) editarClave(el.dataset.key, el.dataset.nombre);
});
$("ticketBody").addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const p = e.target.closest("[data-pkey]");
  if (p){ e.preventDefault(); editarPrecio(p.dataset.pkey, p.dataset.nombre); return; }
  const el = e.target.closest("[data-key]");
  if (el){ e.preventDefault(); editarClave(el.dataset.key, el.dataset.nombre); }
});
$("ticketBody").addEventListener("change", e => {
  if (e.target.id === "ivaChk"){ cfgIVA.on = e.target.checked; renderTicket(); }
  else if (e.target.id === "ivaTasa"){
    cfgIVA.tasa = Math.min(Math.max(parseFloat(e.target.value) || 0, 0), 50);
    renderTicket();
  }
});
$("btnCopiar").addEventListener("click", () => {
  navigator.clipboard.writeText(textoResumen()).then(() => {
    $("btnCopiar").textContent = "¡Copiada!";
    setTimeout(() => $("btnCopiar").textContent = "Copiar lista", 1500);
  });
});
$("btnCotizar").addEventListener("click", () => {
  navigator.clipboard.writeText(textoCotizacion()).then(() => {
    $("btnCotizar").textContent = "¡Copiada!";
    setTimeout(() => $("btnCotizar").textContent = "Copiar p/ cotizar", 1500);
  });
});
$("btnCSV").addEventListener("click", descargarCSV);
$("btnPrint").addEventListener("click", () => window.print());
$("btnLimpiar").addEventListener("click", () => {
  if (tramos.length && confirm("¿Borrar todos los tramos capturados?")){
    tramos = []; render();
  }
});
$("btnExpCat").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(
    [JSON.stringify({ claves: OVR, precios: PRECIOS }, null, 2)],
    { type:"application/json" }));
  a.download = "catalogo-syscom.json";
  a.click();
  URL.revokeObjectURL(a.href);
});
$("btnImpCat").addEventListener("click", () => $("fileCat").click());
$("fileCat").addEventListener("change", e => {
  const f = e.target.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = async () => {
    try{
      const data = JSON.parse(rd.result);
      if (data && typeof data === "object" && !Array.isArray(data)){
        if (data.claves || data.precios){
          if (data.claves && typeof data.claves === "object") Object.assign(OVR, data.claves);
          if (data.precios && typeof data.precios === "object"){
            Object.keys(data.precios).forEach(k => {
              const v = parseFloat(data.precios[k]);
              if (v > 0) PRECIOS[k] = Math.round(v * 100) / 100;
            });
          }
        } else {
          Object.assign(OVR, data); // formato viejo: solo claves
        }
        await store.save("calc_claves_syscom_v1", OVR);
        await store.save("calc_precios_syscom_v1", PRECIOS);
        $("catStatus").textContent = "Catálogo importado: " + Object.keys(OVR).length +
          " claves y " + Object.keys(PRECIOS).length + " precios personalizados.";
        render();
      }
    }catch(err){ $("catStatus").textContent = "El archivo no es un JSON de catálogo válido."; }
  };
  rd.readAsText(f);
  e.target.value = "";
});
$("btnResetCat").addEventListener("click", async () => {
  if ((Object.keys(OVR).length || Object.keys(PRECIOS).length) &&
      confirm("¿Borrar todas las claves y precios personalizados y volver a los originales?")){
    OVR = {}; PRECIOS = {};
    await store.save("calc_claves_syscom_v1", OVR);
    await store.save("calc_precios_syscom_v1", PRECIOS);
    $("catStatus").textContent = "Catálogo restaurado (sin claves ni precios personalizados).";
    render();
  }
});

/* =============== Inicio =============== */
function nuevaFilaAcc(){
  const row = document.createElement("div");
  row.className = "acc-row";
  const sel = document.createElement("select");
  const op = (v, txt, dest) => {
    const o = document.createElement("option");
    o.value = v; o.textContent = txt; (dest || sel).appendChild(o);
  };
  op("", "— Elegir registro, tapa o condulet —");
  const g1 = document.createElement("optgroup");
  g1.label = "Registros / cajas";
  Object.keys(REGISTROS).forEach(id => op("reg:" + id, REGISTROS[id], g1));
  sel.appendChild(g1);
  const gT = document.createElement("optgroup");
  gT.label = "Tapas y sobretapas";
  Object.keys(TAPAS).forEach(id => op("reg:" + id, TAPAS[id], gT));
  sel.appendChild(gT);
  const g2 = document.createElement("optgroup");
  g2.label = "Condulets (del Ø del tramo)";
  Object.keys(CONDULETS).forEach(id => op("cond:" + id, CONDULETS[id], g2));
  sel.appendChild(g2);
  const cant = document.createElement("input");
  cant.type = "number"; cant.min = "1"; cant.step = "1";
  cant.placeholder = "Cant."; cant.inputMode = "numeric";
  const del = document.createElement("button");
  del.type = "button"; del.className = "btn-danger";
  del.setAttribute("aria-label", "Quitar renglón");
  del.textContent = "✕";
  del.addEventListener("click", () => row.remove());
  row.appendChild(sel); row.appendChild(cant); row.appendChild(del);
  $("accList").appendChild(row);
  sel.focus();
}
$("btnAddAcc").addEventListener("click", nuevaFilaAcc);
refrescarCamposC();
refrescarCamposCH();
render();
(async () => {
  OVR = await store.load("calc_claves_syscom_v1") || {};
  PRECIOS = await store.load("calc_precios_syscom_v1") || {};
  const n = Object.keys(OVR).length, m = Object.keys(PRECIOS).length;
  if (n || m) $("catStatus").textContent =
    "Catálogo cargado: " + n + " claves y " + m + " precios personalizados.";
  render();
})();

/* =============== PWA: registro del service worker =============== */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

})();
