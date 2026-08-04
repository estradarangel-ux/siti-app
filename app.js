/* =========================================================================
   SITI · Comunicaciones — Shell de la app
   Controla las pestañas (Levantamiento / Calculadora / Costos) y muestra
   u oculta la barra de pestañas según la sesión que administra
   levantamiento.js (un solo login Firebase para las 3 herramientas).
   ========================================================================= */
(function(){
  var tabbar = document.getElementById('app-tabbar');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.app-tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.app-tab-panel'));

  // Herramientas restringidas por nivel. La Calculadora de material solo la
  // puede usar el nivel Administrador; Levantamiento y Costos los usa
  // cualquier persona con sesión iniciada (nivel Usuario).
  var ADMIN_ONLY_TABS = ['calculadora'];
  var isAdmin = false;

  function canUseTab(name){
    return ADMIN_ONLY_TABS.indexOf(name) === -1 || isAdmin;
  }

  function activateTab(name){
    // Nunca abrir una herramienta que el nivel actual no puede usar.
    if(!canUseTab(name)) name = 'levantamiento';
    tabs.forEach(function(t){ t.classList.toggle('active', t.getAttribute('data-tab')===name); });
    panels.forEach(function(p){ p.classList.toggle('active', p.getAttribute('data-panel')===name); });
  }

  tabs.forEach(function(t){
    t.addEventListener('click', function(){ activateTab(t.getAttribute('data-tab')); });
  });

  // Muestra u oculta las pestañas según el nivel del usuario y evita que una
  // herramienta restringida quede activa si cambia la sesión.
  function applyTabVisibility(){
    tabs.forEach(function(t){
      var name = t.getAttribute('data-tab');
      t.hidden = !canUseTab(name);
    });
    var active = tabs.filter(function(t){ return t.classList.contains('active'); })[0];
    if(!active || !canUseTab(active.getAttribute('data-tab'))){
      activateTab('levantamiento');
    }
  }

  var storageNote = document.getElementById('siti-storage-note');

  function applyAuthState(user){
    isAdmin = !!(user && user.role === 'admin');
    if(storageNote) storageNote.hidden = !user;
    if(user){
      tabbar.hidden = false;
      applyTabVisibility();
    } else {
      isAdmin = false;
      tabbar.hidden = true;
      applyTabVisibility();
      activateTab('levantamiento');
    }
  }

  // Caso normal (Firebase real): el login tarda unos instantes, así que el
  // evento llega después de que este script ya está escuchando.
  window.addEventListener('siti:auth', function(e){
    applyAuthState(e.detail && e.detail.user);
  });

  // Caso vista previa / modo local: levantamiento.js puede resolver la sesión
  // de forma síncrona, antes de que este script termine de cargar. Por eso
  // también revisamos el estado ya disponible en window.SITI al arrancar.
  if(window.SITI && window.SITI.currentUser){
    applyAuthState(window.SITI.currentUser);
  }
})();
