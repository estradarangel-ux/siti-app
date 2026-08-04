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

  function activateTab(name){
    tabs.forEach(function(t){ t.classList.toggle('active', t.getAttribute('data-tab')===name); });
    panels.forEach(function(p){ p.classList.toggle('active', p.getAttribute('data-panel')===name); });
  }

  tabs.forEach(function(t){
    t.addEventListener('click', function(){ activateTab(t.getAttribute('data-tab')); });
  });

  function applyAuthState(user){
    if(user){
      tabbar.hidden = false;
    } else {
      tabbar.hidden = true;
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
