# SITI · App unificada — notas de arquitectura

Este archivo existe para que cualquier sesión futura (tuya o de Claude) entienda
el porqué de las decisiones sin tener que releer todo el código. Si haces un
cambio de fondo, actualiza esta nota también.

## Qué es esto

Antes había 3 herramientas separadas, cada una en su propio repo/subdominio:
Levantamiento en Sitio, Calculadora de material eléctrico y Costos de Mano de
Obra. Se fusionaron en una sola app (`index.html`) con pestañas, para que se
sienta como una sola aplicación y no tres.

## Estructura de archivos

```
index.html          ← shell: topbar, pestañas, pantalla de login, contenedor de las 3 herramientas
styles.css           ← tokens de diseño compartidos (paleta verde SITI) + chrome del shell
levantamiento.css    ← estilos de Levantamiento, escopados bajo #siti-app
calculadora.css      ← estilos de Calculadora, escopados bajo #calc-app
costos.css           ← estilos de Costos, escopados bajo #costos-app
levantamiento.js      ← lógica de Levantamiento (incluye Firebase Auth — ver abajo)
calculadora.js         ← lógica de Calculadora
costos.js              ← lógica de Costos
app.js                  ← shell: cambio de pestañas + reacciona a la sesión
manifest.json / sw.js   ← una sola PWA para las 3 herramientas
icons/                  ← íconos únicos de la PWA (recortados del isotipo SITI)
```

**Por qué archivos separados y no todo en un solo HTML gigante:** para que un
cambio en una herramienta no obligue a tocar (ni arriesgue romper) las otras
dos. Si algún día una herramienta crece mucho, se puede seguir tocando su
archivo sin abrir los demás.

## Autenticación: un solo login para las 3 pestañas

- El login vive en `levantamiento.js` (usa el proyecto de Firebase
  `visita-clientes-f7de4`, el mismo de siempre — no se creó nada nuevo).
- Mientras no hay sesión, el shell mantiene oculta la barra de pestañas y solo
  se ve el panel de Levantamiento con su pantalla de login.
- En cuanto el login resuelve (con éxito o con logout), `levantamiento.js`
  llama a `broadcastAuth()`, que:
  1. Guarda el usuario en `window.SITI.currentUser` (con su `role`: `tecnico`
     o `admin`, igual que antes).
  2. Dispara un evento `window.dispatchEvent(new CustomEvent('siti:auth', ...))`.
- `app.js` escucha ese evento para mostrar/ocultar la barra de pestañas.
- `costos.js` también lo escucha para mostrar/ocultar su botón de
  "Modo administrador" (ver siguiente sección).
- **Importante:** como el evento se puede disparar antes de que otro script
  termine de cargar, cualquier script que dependa de la sesión debe **tanto**
  escuchar el evento **como** revisar `window.SITI.currentUser` directamente
  al arrancar (por si ya se disparó). Los tres scripts ya lo hacen así — si
  agregas un cuarto módulo que dependa de la sesión, sigue el mismo patrón.

## Costos ya no usa PIN

El PIN de administrador (antes `1234` por defecto) se quitó por completo.
Ahora el botón "Modo administrador" de Costos solo funciona si
`window.SITI.currentUser.role === 'admin'` — el mismo rol que ya manejas
desde el panel de administración de Levantamiento (Firestore, colección
`users`, campo `role`). No hay que dar de alta nada aparte: si alguien es
admin en Levantamiento, también lo es en Costos.

## Paleta y diseño homologado

- La paleta base es la verde de Levantamiento (`--green:#58AD50`, negro casi
  puro para texto/botones primarios, esquinas cuadradas, tipografía Inter +
  Space Grotesk). Los tokens compartidos viven en `styles.css` a nivel `:root`.
- Calculadora y Costos traían su propia paleta azul/navy; se re-temáticos para
  usar los mismos tokens visuales, pero **conservando su estructura HTML/JS
  original** (misma lógica, solo cambió el CSS). Si algo se ve "raro" al
  comparar con como se veían antes por separado, es intencional — es parte de
  la homologación.
- Cada herramienta sigue escopada bajo su propio contenedor (`#siti-app`,
  `#calc-app`, `#costos-app`) para que sus reglas CSS no se filtren entre sí.

## Modo oscuro — limitación conocida

El botón de modo oscuro (arriba a la derecha) controla **toda la app**
(antes solo controlaba el panel de Levantamiento). Pero Calculadora y Costos
nunca tuvieron paleta oscura propia, así que en modo oscuro esas dos pestañas
se siguen viendo con fondo claro. No es un bug — si se quiere modo oscuro
completo en las 3, hay que diseñar tokens oscuros para `calculadora.css` y
`costos.css` (no existen todavía).

## Almacenamiento (claves para no pisarse entre herramientas)

- Levantamiento: Firestore (modo Firebase) o `localStorage` con prefijo
  `siti_...` (modo sin Firebase / vista previa).
- Calculadora: `calc_claves_syscom_v1`, `calc_precios_syscom_v1`.
- Costos: `costos_mo_precios_v2`, `costos_mo_margenes_v1`,
  `costos_mo_gastos_fijos_v1`, `costos_mo_capacidad_v1`, `costos_mo_tiempos_v1`.

Si agregas una clave de storage nueva en cualquier herramienta, dale un
prefijo (`calc_`, `costos_`, etc.) para evitar colisiones futuras.

## IDs renombrados por colisión

Calculadora y Costos ambos tenían botones `btnCSV` y `btnLimpiar`. Los de
Costos se renombraron a `btnCSVCostos` y `btnLimpiarCostos` (en el HTML y en
`costos.js`). Si copias/pegas bloques de una herramienta a otra en el futuro,
revisa que no reintroduzcas un `id` duplicado — con 3 herramientas en la
misma página, cualquier `id` repetido rompe silenciosamente el
`getElementById` de la otra herramienta.

## Cómo probar localmente

El *service worker* (`sw.js`) no funciona abriendo `index.html` con doble
clic (protocolo `file://`). Hay que levantar un servidor local:

```
python3 -m http.server 8000
```

y abrir `http://localhost:8000`.

## Despliegue

Un solo dominio para las 3 herramientas (antes eran 3 subdominios). Ver el
paso a paso de GitHub Pages + CNAME + `.nojekyll` en la conversación de
configuración original — el patrón no cambió, solo que ahora hay un solo
repo/dominio en vez de tres.
