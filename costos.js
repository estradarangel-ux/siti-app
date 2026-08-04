(function(){
  'use strict';

  var STORAGE_KEY_PRECIOS   = 'costos_mo_precios_v2';
  var STORAGE_KEY_MARGENES  = 'costos_mo_margenes_v1';
  var STORAGE_KEY_GASTOS    = 'costos_mo_gastos_fijos_v1';
  var STORAGE_KEY_CAPACIDAD = 'costos_mo_capacidad_v1';
  var STORAGE_KEY_TIEMPOS   = 'costos_mo_tiempos_v1';

  var ITEMS = [
    {id:'remate_nodo',        nombre:'Rematado de nodo',              unidad:'Punto', precio:350.00},
    {id:'nodo_cat6',          nombre:'Nodo Cat. 6',                   unidad:'Punto', precio:650.00},
    {id:'nodo_cat6a',         nombre:'Nodo Cat. 6A',                  unidad:'Punto', precio:850.00},
    {id:'nodo_cat6a_blindado',nombre:'Nodo Cat. 6A Blindado',         unidad:'Punto', precio:1050.00},
    {id:'remate_fibra',       nombre:'Rematado de fibra',             unidad:'Punto', precio:297.00},
    {id:'fibra_metro',        nombre:'Fibra',                         unidad:'ML',    precio:55.00},
    {id:'tubo_pd_canaleta',   nombre:'Tubo P.D. / Canaleta',          unidad:'ML',    precio:35.00},
    {id:'tubo_pg',            nombre:'Tubo P.G.',                     unidad:'ML',    precio:65.00},
    {id:'canaleta',           nombre:'Canaleta',                      unidad:'ML',    precio:35.00},
    {id:'charola',            nombre:'Charola (Charofil)',            unidad:'ML',    precio:55.00},
    {id:'rack',               nombre:'Rack',                          unidad:'Pieza', precio:2200.00},
    {id:'gabinete',           nombre:'Gabinete',                      unidad:'Pieza', precio:2750.00},
    {id:'montado_desmontado', nombre:'Montado/Desmontado de equipos', unidad:'Pieza', precio:350.00},
    {id:'configuraciones',    nombre:'Configuraciones',               unidad:'Hora',  precio:850.00},
    {id:'ranurado',           nombre:'Ranurado',                      unidad:'ML',    precio:450.00}
  ];

  var TIER_LABELS = {publico:'Precio público', vendedor:'Vendedor', revendedor:'Revendedor'};

  var GASTOS_DEFAULT = [
    {nombre:'Nómina técnicos',                      monto:0},
    {nombre:'Nómina administrativa',                monto:0},
    {nombre:'Renta y servicios',                    monto:0},
    {nombre:'Seguros',                              monto:0},
    {nombre:'Vehículos (gasolina y mantenimiento)', monto:0},
    {nombre:'Depreciación de herramienta',          monto:0},
    {nombre:'Otros gastos fijos',                   monto:0}
  ];
  var gastoCounter = 0;
  function nuevoGastoId(){ gastoCounter++; return 'g'+gastoCounter; }

  var STATE = {
    precios:{}, cantidades:{}, tipoCliente:'publico',
    margenes:{vendedorPct:20, revendedorPct:15},
    isAdmin:false, generado:false,
    lastRows:[], lastTotal:0,
    gastos:[], capacidad:{tecnicos:1, horasDia:8, diasMes:22, utilizacion:70}, tiempos:{},
    costoHora:0
  };
  ITEMS.forEach(function(it){ STATE.precios[it.id]=it.precio; STATE.cantidades[it.id]=0; STATE.tiempos[it.id]={h:0,m:0}; });
  GASTOS_DEFAULT.forEach(function(g){ STATE.gastos.push({id:nuevoGastoId(), nombre:g.nombre, monto:g.monto}); });

  // ---------- storage abstraction ----------
  function hasClaudeStorage(){
    return (typeof window.storage !== 'undefined') && window.storage && typeof window.storage.get === 'function';
  }
  function storageGet(key){
    return new Promise(function(resolve){
      try{
        if(hasClaudeStorage()){
          window.storage.get(key,false).then(function(r){ resolve(r ? r.value : null); }).catch(function(){ resolve(null); });
        } else {
          resolve(window.localStorage.getItem(key));
        }
      }catch(e){ resolve(null); }
    });
  }
  function storageSet(key,value){
    return new Promise(function(resolve){
      try{
        if(hasClaudeStorage()){
          window.storage.set(key,value,false).then(function(){ resolve(true); }).catch(function(){ resolve(false); });
        } else {
          window.localStorage.setItem(key,value); resolve(true);
        }
      }catch(e){ resolve(false); }
    });
  }

  // ---------- helpers ----------
  function money(n){
    n = isFinite(n) ? n : 0;
    return '$' + n.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function clampNum(v){ var n=parseFloat(v); if(isNaN(n)||n<0) return 0; return n; }
  function todayISO(){
    var d=new Date();
    var m=('0'+(d.getMonth()+1)).slice(-2);
    var day=('0'+d.getDate()).slice(-2);
    return d.getFullYear()+'-'+m+'-'+day;
  }
  function showToast(msg){
    var t=document.getElementById('toast');
    t.textContent=msg; t.classList.add('show');
    setTimeout(function(){ t.classList.remove('show'); },1800);
  }
  function tierPrice(publico, tier){
    if(tier==='vendedor'){
      var f = 1 - (STATE.margenes.vendedorPct/100);
      if(f<=0) f = 0.01;
      return publico / f;
    }
    if(tier==='revendedor'){
      return publico * (1 - (STATE.margenes.revendedorPct/100));
    }
    return publico;
  }

  // ---------- modal confirmación genérica ----------
  var pendingConfirm=null;
  function showConfirm(message,onConfirm){
    document.getElementById('modalMsg').textContent=message;
    pendingConfirm=onConfirm;
    document.getElementById('modalOverlay').hidden=false;
  }
  function hideConfirm(){ document.getElementById('modalOverlay').hidden=true; pendingConfirm=null; }

  // ---------- render partidas (operador) ----------
  function renderPartidasOperador(){
    var tbody=document.getElementById('tbodyPartidas');
    tbody.innerHTML='';
    ITEMS.forEach(function(it){
      var tr=document.createElement('tr');

      var tdN=document.createElement('td'); tdN.className='nombre'; tdN.textContent=it.nombre; tr.appendChild(tdN);
      var tdU=document.createElement('td'); tdU.className='unidad'; tdU.textContent=it.unidad; tr.appendChild(tdU);

      var tdC=document.createElement('td'); tdC.className='num cant-cell';
      var inp=document.createElement('input');
      inp.type='number'; inp.min='0'; inp.step='0.01'; inp.className='inp-cant';
      inp.value=STATE.cantidades[it.id]||0;
      inp.addEventListener('input',function(){
        STATE.cantidades[it.id]=clampNum(inp.value);
        invalidarResultado();
      });
      tdC.appendChild(inp); tr.appendChild(tdC);

      tbody.appendChild(tr);
    });
  }

  // ---------- render admin ----------
  function renderAdmin(){
    document.getElementById('fMargenVendedor').value=STATE.margenes.vendedorPct;
    document.getElementById('fDescRevendedor').value=STATE.margenes.revendedorPct;

    var tbody=document.getElementById('tbodyAdmin');
    tbody.innerHTML='';
    ITEMS.forEach(function(it){
      var tr=document.createElement('tr');

      var tdN=document.createElement('td'); tdN.className='nombre'; tdN.textContent=it.nombre; tr.appendChild(tdN);
      var tdU=document.createElement('td'); tdU.className='unidad'; tdU.textContent=it.unidad; tr.appendChild(tdU);

      var tdP=document.createElement('td'); tdP.className='num precio-cell';
      var inp=document.createElement('input');
      inp.type='number'; inp.min='0'; inp.step='0.01'; inp.className='inp-precio';
      inp.value=STATE.precios[it.id];
      inp.addEventListener('input',function(){
        STATE.precios[it.id]=clampNum(inp.value);
        refrescarCalculados();
        invalidarResultado();
      });
      inp.addEventListener('change',function(){ persistPrecios(); });
      tdP.appendChild(inp); tr.appendChild(tdP);

      var tdV=document.createElement('td'); tdV.className='readonly-precio'; tdV.setAttribute('data-label','Vendedor');
      tdV.id='adminVend_'+it.id; tr.appendChild(tdV);

      var tdR=document.createElement('td'); tdR.className='readonly-precio'; tdR.setAttribute('data-label','Revendedor');
      tdR.id='adminRev_'+it.id; tr.appendChild(tdR);

      var tdT=document.createElement('td'); tdT.className='num'; tdT.setAttribute('data-label','Tiempo estimado');
      var wrap=document.createElement('div'); wrap.className='tiempo-inputs';

      var t=STATE.tiempos[it.id]||{h:0,m:0};

      var inpH=document.createElement('input');
      inpH.type='number'; inpH.min='0'; inpH.step='1'; inpH.className='inp-tiempo'; inpH.setAttribute('aria-label','Horas');
      inpH.value=t.h||0;
      inpH.addEventListener('input',function(){
        STATE.tiempos[it.id].h=clampNum(inpH.value);
        actualizarFilaCosteo(it.id);
      });
      inpH.addEventListener('change',persistTiempos);

      var spanH=document.createElement('span'); spanH.className='tiempo-suffix'; spanH.textContent='h';

      var inpM=document.createElement('input');
      inpM.type='number'; inpM.min='0'; inpM.step='1'; inpM.className='inp-tiempo'; inpM.setAttribute('aria-label','Minutos');
      inpM.value=t.m||0;
      inpM.addEventListener('input',function(){
        STATE.tiempos[it.id].m=clampNum(inpM.value);
        actualizarFilaCosteo(it.id);
      });
      inpM.addEventListener('change',persistTiempos);

      var spanM=document.createElement('span'); spanM.className='tiempo-suffix'; spanM.textContent='min';

      wrap.appendChild(inpH); wrap.appendChild(spanH); wrap.appendChild(inpM); wrap.appendChild(spanM);
      tdT.appendChild(wrap); tr.appendChild(tdT);

      var tdCosto=document.createElement('td'); tdCosto.className='num'; tdCosto.style.fontFamily='var(--mono)'; tdCosto.setAttribute('data-label','Costo real');
      tdCosto.id='costoReal_'+it.id;
      tr.appendChild(tdCosto);

      var tdMargen=document.createElement('td'); tdMargen.className='num'; tdMargen.setAttribute('data-label','Margen');
      tdMargen.id='margen_'+it.id;
      tr.appendChild(tdMargen);

      tbody.appendChild(tr);
    });
    refrescarCalculados();
  }

  function refrescarCalculados(){
    ITEMS.forEach(function(it){
      var v=document.getElementById('adminVend_'+it.id);
      var r=document.getElementById('adminRev_'+it.id);
      if(v) v.textContent=money(tierPrice(STATE.precios[it.id],'vendedor'));
      if(r) r.textContent=money(tierPrice(STATE.precios[it.id],'revendedor'));
      actualizarFilaCosteo(it.id);
    });
  }

  // ---------- costeo interno ----------
  function renderGastos(){
    var tbody=document.getElementById('tbodyGastos');
    tbody.innerHTML='';
    STATE.gastos.forEach(function(g){
      var tr=document.createElement('tr');

      var tdN=document.createElement('td');
      var inpN=document.createElement('input');
      inpN.type='text'; inpN.className='inp-gasto-nombre'; inpN.value=g.nombre; inpN.placeholder='Concepto';
      inpN.addEventListener('input',function(){ g.nombre=inpN.value; });
      inpN.addEventListener('change',persistGastos);
      tdN.appendChild(inpN); tr.appendChild(tdN);

      var tdM=document.createElement('td'); tdM.className='num precio-cell';
      var inpM=document.createElement('input');
      inpM.type='number'; inpM.min='0'; inpM.step='0.01'; inpM.className='inp-precio';
      inpM.value=g.monto;
      inpM.addEventListener('input',function(){ g.monto=clampNum(inpM.value); calcularCostoHora(); });
      inpM.addEventListener('change',persistGastos);
      tdM.appendChild(inpM); tr.appendChild(tdM);

      var tdD=document.createElement('td'); tdD.style.textAlign='right';
      var btnDel=document.createElement('button');
      btnDel.type='button'; btnDel.className='btn-del'; btnDel.textContent='🗑'; btnDel.title='Eliminar';
      btnDel.addEventListener('click',function(){ eliminarGasto(g.id); });
      tdD.appendChild(btnDel); tr.appendChild(tdD);

      tbody.appendChild(tr);
    });
  }

  function agregarGasto(){
    STATE.gastos.push({id:nuevoGastoId(), nombre:'', monto:0});
    renderGastos();
    persistGastos();
  }
  function eliminarGasto(id){
    showConfirm('¿Eliminar este gasto fijo de la lista?', function(){
      STATE.gastos = STATE.gastos.filter(function(g){ return g.id!==id; });
      renderGastos();
      calcularCostoHora();
      persistGastos();
      showToast('Gasto eliminado');
    });
  }

  function renderCapacidad(){
    document.getElementById('fTecnicos').value=STATE.capacidad.tecnicos;
    document.getElementById('fHorasDia').value=STATE.capacidad.horasDia;
    document.getElementById('fDiasMes').value=STATE.capacidad.diasMes;
    document.getElementById('fUtilizacion').value=STATE.capacidad.utilizacion;
  }

  function calcularCostoHora(){
    var totalGastos=0;
    STATE.gastos.forEach(function(g){ totalGastos += (g.monto||0); });

    var c=STATE.capacidad;
    var horasDisponibles = (c.tecnicos||0) * (c.horasDia||0) * (c.diasMes||0);
    var horasFacturables = horasDisponibles * ((c.utilizacion||0)/100);

    var costoHora = horasFacturables>0 ? (totalGastos/horasFacturables) : 0;
    STATE.costoHora = costoHora;
    document.getElementById('costoHoraHombre').textContent = money(costoHora);
    ITEMS.forEach(function(it){ actualizarFilaCosteo(it.id); });
  }

  function totalMinutos(id){
    var t=STATE.tiempos[id]||{h:0,m:0};
    return (t.h||0)*60 + (t.m||0);
  }

  function actualizarFilaCosteo(id){
    var tiempoMin = totalMinutos(id);
    var precioPublico = STATE.precios[id]||0;
    var elCosto=document.getElementById('costoReal_'+id);
    var elMargen=document.getElementById('margen_'+id);
    if(!elCosto) return;

    if(tiempoMin<=0){
      elCosto.textContent='—';
      elMargen.textContent='—';
      elMargen.className='num margen-na';
      return;
    }

    var costoReal = (tiempoMin/60) * STATE.costoHora;
    var margenAbs = precioPublico - costoReal;
    var margenPct = precioPublico>0 ? (margenAbs/precioPublico*100) : 0;

    elCosto.textContent=money(costoReal);
    elMargen.textContent=money(margenAbs)+' ('+margenPct.toFixed(0)+'%)';

    if(margenPct<0) elMargen.className='num margen-neg';
    else if(margenPct<20) elMargen.className='num margen-baja';
    else elMargen.className='num margen-pos';
  }

  function persistGastos(){ storageSet(STORAGE_KEY_GASTOS, JSON.stringify(STATE.gastos)); }
  function persistCapacidad(){ storageSet(STORAGE_KEY_CAPACIDAD, JSON.stringify(STATE.capacidad)); }
  function persistTiempos(){ storageSet(STORAGE_KEY_TIEMPOS, JSON.stringify(STATE.tiempos)); }

  function loadGastos(){
    return storageGet(STORAGE_KEY_GASTOS).then(function(raw){
      if(raw){
        try{
          var saved=JSON.parse(raw);
          if(Array.isArray(saved) && saved.length){
            STATE.gastos = saved.map(function(g){
              if(!g.id) g.id=nuevoGastoId();
              return g;
            });
          }
        }catch(e){}
      }
    });
  }
  function loadCapacidad(){
    return storageGet(STORAGE_KEY_CAPACIDAD).then(function(raw){
      if(raw){
        try{
          var saved=JSON.parse(raw);
          ['tecnicos','horasDia','diasMes','utilizacion'].forEach(function(k){
            if(typeof saved[k]==='number') STATE.capacidad[k]=saved[k];
          });
        }catch(e){}
      }
    });
  }
  function loadTiempos(){
    return storageGet(STORAGE_KEY_TIEMPOS).then(function(raw){
      if(raw){
        try{
          var saved=JSON.parse(raw);
          ITEMS.forEach(function(it){
            var v=saved[it.id];
            if(typeof v==='number'){
              // compatibilidad con formato anterior (minutos totales)
              STATE.tiempos[it.id]={h:Math.floor(v/60), m:v%60};
            } else if(v && typeof v==='object'){
              STATE.tiempos[it.id]={h:v.h||0, m:v.m||0};
            }
          });
        }catch(e){}
      }
    });
  }

  // ---------- resultado ----------
  function invalidarResultado(){
    STATE.generado=false;
    document.getElementById('panelResultado').hidden=true;
    document.getElementById('panelTotal').hidden=true;
  }

  function generarCotizacion(){
    var rows=[], total=0;
    ITEMS.forEach(function(it){
      var cant=STATE.cantidades[it.id]||0;
      if(cant>0){
        var pu=tierPrice(STATE.precios[it.id],STATE.tipoCliente);
        var imp=pu*cant;
        total+=imp;
        rows.push({nombre:it.nombre,unidad:it.unidad,precioUnit:pu,cantidad:cant,importe:imp});
      }
    });
    if(rows.length===0){ showToast('Captura al menos una cantidad'); return; }

    STATE.lastRows=rows; STATE.lastTotal=total; STATE.generado=true;

    var tbody=document.getElementById('tbodyResultado');
    tbody.innerHTML='';
    rows.forEach(function(r){
      var tr=document.createElement('tr');
      var tdN=document.createElement('td'); tdN.className='nombre'; tdN.textContent=r.nombre; tr.appendChild(tdN);
      var tdU=document.createElement('td'); tdU.className='unidad'; tdU.textContent=r.unidad; tr.appendChild(tdU);
      var tdP=document.createElement('td'); tdP.className='num'; tdP.style.fontFamily='var(--mono)'; tdP.textContent=money(r.precioUnit); tr.appendChild(tdP);
      var tdC=document.createElement('td'); tdC.className='num'; tdC.textContent=r.cantidad; tr.appendChild(tdC);
      var tdI=document.createElement('td'); tdI.className='importe'; tdI.textContent=money(r.importe); tr.appendChild(tdI);
      tbody.appendChild(tr);
    });

    document.getElementById('tipoTag').textContent=TIER_LABELS[STATE.tipoCliente];
    document.getElementById('totalGeneral').textContent=money(total);
    document.getElementById('panelResultado').hidden=false;
    document.getElementById('panelTotal').hidden=false;
  }

  // ---------- persistencia ----------
  function persistPrecios(){ storageSet(STORAGE_KEY_PRECIOS, JSON.stringify(STATE.precios)); }
  function persistMargenes(){ storageSet(STORAGE_KEY_MARGENES, JSON.stringify(STATE.margenes)); }

  function loadPrecios(){
    return storageGet(STORAGE_KEY_PRECIOS).then(function(raw){
      if(raw){
        try{
          var saved=JSON.parse(raw);
          ITEMS.forEach(function(it){ if(typeof saved[it.id]==='number') STATE.precios[it.id]=saved[it.id]; });
        }catch(e){}
      }
    });
  }
  function loadMargenes(){
    return storageGet(STORAGE_KEY_MARGENES).then(function(raw){
      if(raw){
        try{
          var saved=JSON.parse(raw);
          if(typeof saved.vendedorPct==='number') STATE.margenes.vendedorPct=saved.vendedorPct;
          if(typeof saved.revendedorPct==='number') STATE.margenes.revendedorPct=saved.revendedorPct;
        }catch(e){}
      }
    });
  }

  // ---------- acciones ----------
  function resetPrecios(){
    showConfirm('¿Restablecer todos los precios públicos a los valores originales? Esto no afecta márgenes ni cantidades capturadas.', function(){
      ITEMS.forEach(function(it){ STATE.precios[it.id]=it.precio; });
      persistPrecios();
      renderAdmin();
      invalidarResultado();
      showToast('Precios restablecidos');
    });
  }

  function limpiarCotizacion(){
    showConfirm('¿Limpiar esta cotización? Se borrarán las cantidades capturadas y los datos del cliente/proyecto.', function(){
      ITEMS.forEach(function(it){ STATE.cantidades[it.id]=0; });
      document.getElementById('fCliente').value='';
      document.getElementById('fProyecto').value='';
      document.getElementById('fElaboro').value='';
      document.getElementById('fFecha').value=todayISO();
      document.getElementById('tcPublico').checked=true;
      STATE.tipoCliente='publico';
      renderPartidasOperador();
      invalidarResultado();
      showToast('Cotización limpiada');
    });
  }

  function csvEscape(s){
    s=String(s);
    if(s.indexOf(',')!==-1||s.indexOf('"')!==-1||s.indexOf('\n')!==-1) return '"'+s.replace(/"/g,'""')+'"';
    return s;
  }

  function exportCSV(){
    if(!STATE.generado){ showToast('Genera la cotización primero'); return; }
    var lines=[];
    lines.push(['Costos de Mano de Obra - SITI Comunicaciones'].join(','));
    lines.push(['Cliente', csvEscape(document.getElementById('fCliente').value)].join(','));
    lines.push(['Proyecto/Obra', csvEscape(document.getElementById('fProyecto').value)].join(','));
    lines.push(['Fecha', csvEscape(document.getElementById('fFecha').value)].join(','));
    lines.push(['Elaboró', csvEscape(document.getElementById('fElaboro').value)].join(','));
    lines.push(['Lista de precios', csvEscape(TIER_LABELS[STATE.tipoCliente])].join(','));
    lines.push('');
    lines.push(['Partida','Unidad','Precio unitario','Cantidad','Importe'].join(','));
    STATE.lastRows.forEach(function(r){
      lines.push([csvEscape(r.nombre), csvEscape(r.unidad), r.precioUnit.toFixed(2), r.cantidad, r.importe.toFixed(2)].join(','));
    });
    lines.push('');
    lines.push(['','','','Total', STATE.lastTotal.toFixed(2)].join(','));

    var csvContent='\uFEFF'+lines.join('\r\n');
    var blob=new Blob([csvContent],{type:'text/csv;charset=utf-8;'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    var fecha=document.getElementById('fFecha').value||todayISO();
    a.href=url; a.download='cotizacion-mano-de-obra-'+fecha+'.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); },500);
  }

  function copiarTextoFallback(text){
    try{
      var ta=document.createElement('textarea');
      ta.value=text;
      ta.style.position='fixed';
      ta.style.left='-9999px';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Total copiado: '+text);
    }catch(e){
      showToast('No se pudo copiar');
    }
  }
  function copiarTotal(){
    var text=document.getElementById('totalGeneral').textContent;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){
        showToast('Total copiado: '+text);
      }).catch(function(){ copiarTextoFallback(text); });
    } else {
      copiarTextoFallback(text);
    }
  }

  function exportPDF(){
    if(!STATE.generado){ showToast('Genera la cotización primero'); return; }
    window.print();
  }

  // ---------- admin: acceso por rol (comparte sesión con Levantamiento) ----------
  function esAdminActual(){
    return !!(window.SITI && window.SITI.currentUser && window.SITI.currentUser.role==='admin');
  }

  function abrirAdmin(){
    if(!esAdminActual()){
      showToast('Esta función requiere permisos de administrador.');
      return;
    }
    STATE.isAdmin=true;
    document.getElementById('panelAdmin').hidden=false;
    var btn=document.getElementById('btnAdminToggle');
    btn.textContent='Cerrar administrador';
    btn.classList.add('activo');
    renderAdmin();
  }

  function cerrarAdmin(){
    STATE.isAdmin=false;
    document.getElementById('panelAdmin').hidden=true;
    var btn=document.getElementById('btnAdminToggle');
    btn.textContent='Modo administrador';
    btn.classList.remove('activo');
  }

  function actualizarVisibilidadAdmin(){
    var btn=document.getElementById('btnAdminToggle');
    if(!btn) return;
    if(esAdminActual()){
      btn.style.display='';
    } else {
      btn.style.display='none';
      if(STATE.isAdmin) cerrarAdmin();
    }
  }
  window.addEventListener('siti:auth', actualizarVisibilidadAdmin);

  // ---------- init ----------
  function init(){
    document.getElementById('fFecha').value=todayISO();
    actualizarVisibilidadAdmin();

    document.querySelectorAll('input[name="tipoCliente"]').forEach(function(r){
      r.addEventListener('change',function(){
        STATE.tipoCliente=r.value;
        invalidarResultado();
      });
    });

    document.getElementById('btnGenerar').addEventListener('click',generarCotizacion);
    document.getElementById('btnLimpiarCostos').addEventListener('click',limpiarCotizacion);
    document.getElementById('btnCSVCostos').addEventListener('click',exportCSV);
    document.getElementById('btnCopiarTotal').addEventListener('click',copiarTotal);
    document.getElementById('btnPDF').addEventListener('click',exportPDF);

    document.getElementById('modalCancel').addEventListener('click',hideConfirm);
    document.getElementById('modalOk').addEventListener('click',function(){
      var fn=pendingConfirm; hideConfirm(); if(fn) fn();
    });
    document.getElementById('modalOverlay').addEventListener('click',function(e){
      if(e.target===document.getElementById('modalOverlay')) hideConfirm();
    });

    document.getElementById('btnAdminToggle').addEventListener('click',function(){
      if(STATE.isAdmin) cerrarAdmin(); else abrirAdmin();
    });

    document.getElementById('btnCerrarAdmin').addEventListener('click',cerrarAdmin);
    document.getElementById('btnResetPrecios').addEventListener('click',resetPrecios);

    document.getElementById('fMargenVendedor').addEventListener('input',function(){
      STATE.margenes.vendedorPct=clampNum(this.value);
      refrescarCalculados(); invalidarResultado();
    });
    document.getElementById('fMargenVendedor').addEventListener('change',persistMargenes);
    document.getElementById('fDescRevendedor').addEventListener('input',function(){
      STATE.margenes.revendedorPct=clampNum(this.value);
      refrescarCalculados(); invalidarResultado();
    });
    document.getElementById('fDescRevendedor').addEventListener('change',persistMargenes);

    document.getElementById('btnAgregarGasto').addEventListener('click',agregarGasto);

    ['fTecnicos','fHorasDia','fDiasMes','fUtilizacion'].forEach(function(id){
      document.getElementById(id).addEventListener('input',function(){
        STATE.capacidad.tecnicos=clampNum(document.getElementById('fTecnicos').value);
        STATE.capacidad.horasDia=clampNum(document.getElementById('fHorasDia').value);
        STATE.capacidad.diasMes=clampNum(document.getElementById('fDiasMes').value);
        STATE.capacidad.utilizacion=clampNum(document.getElementById('fUtilizacion').value);
        calcularCostoHora();
      });
      document.getElementById(id).addEventListener('change',persistCapacidad);
    });

    Promise.all([loadPrecios(), loadMargenes(), loadGastos(), loadCapacidad(), loadTiempos()]).then(function(){
      renderPartidasOperador();
      renderGastos();
      renderCapacidad();
      calcularCostoHora();
    });
  }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); }
  else{ init(); }
})();
