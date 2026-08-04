# SITI · Comunicaciones — App de Android (APK)

La app de Android es un **TWA** (Trusted Web Activity): un contenedor Android
que muestra este mismo PWA (`https://app.siticomunicaciones.com`). Ventajas:

- **Un solo código.** La app usa el sitio web; cuando actualizamos la web, la app
  se actualiza sola. Solo hay que volver a generar el APK si cambian el nombre,
  el ícono o el identificador del paquete.
- **Funciona offline** (respeta el service worker) y **Firebase (login y datos)
  funciona sin cambios**.

Como no hay tienda de por medio, el APK se instala manualmente en los teléfonos.

---

## Paso 1 — Generar el APK en PWABuilder

1. Entra a **https://www.pwabuilder.com**
2. Escribe la URL: `https://app.siticomunicaciones.com` y pulsa **Start**.
3. Debe pasar las verificaciones (manifest, service worker, HTTPS). Pulsa
   **Package for stores → Android**.
4. En **Android package options** usa estos valores (importante que coincidan):
   - **Package ID:** `com.siticomunicaciones.app`
   - **App name:** `SITI Comunicaciones`
   - **Launcher name:** `SITI`
   - **Theme / Status bar color:** `#181c18`
   - **Display mode:** `Standalone`
   - **Signing key:** **Create new** (crear una nueva).
5. **Generate** y descarga el `.zip`.

> ⚠️ **GUARDA EL ZIP COMPLETO EN UN LUGAR SEGURO.** Contiene la **llave de firma**
> (`signing.keystore` + contraseñas en `signing-key-info.txt`). Si más adelante
> quieres actualizar el contenedor (nuevo ícono/nombre), **necesitas la MISMA
> llave**; si la pierdes, tendrás que reinstalar la app desde cero en todos los
> teléfonos. No la subas a GitHub.

El zip incluye:
- `app-release-signed.apk` → el APK para instalar.
- `assetlinks.json` → archivo de verificación (paso 2).
- `signing-key-info.txt` → contraseñas de la llave (guardar en privado).

---

## Paso 2 — Verificación del dominio (para que abra sin barra de navegador)

Para que la app abra a **pantalla completa** (sin la barra de URL de Chrome), el
dominio debe publicar el archivo de verificación con la huella de la llave.

1. Abre el `assetlinks.json` del zip (o copia su contenido).
2. Pásamelo (pégalo en el chat) y yo lo publico en el repo en
   `.well-known/assetlinks.json`. Al desplegarse en GitHub Pages, la app quedará
   verificada.

El contenido tiene esta forma (la huella `sha256_cert_fingerprints` la genera
PWABuilder):

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.siticomunicaciones.app",
    "sha256_cert_fingerprints": ["AA:BB:CC:...:99"]
  }
}]
```

> Haz el Paso 2 **antes** de instalar el APK en los teléfonos, para que la
> verificación ya esté publicada cuando la app se abra por primera vez.

---

## Paso 3 — Instalar el APK en un teléfono Android

1. Pasa `app-release-signed.apk` al teléfono (cable, correo, Drive, etc.).
2. Ábrelo. Android pedirá permitir **instalar apps de orígenes desconocidos**
   para esa app (Ajustes → Apps → Instalar apps desconocidas). Actívalo.
3. Instala. Aparecerá el ícono de **SITI**.
4. Requisitos del teléfono: Android 8+ y **Chrome** instalado (el TWA usa su motor).

---

## Actualizaciones

- **Cambios de la app (pantallas, campos, lógica):** se hacen en la web y se
  publican como siempre; la app los toma automáticamente. **No** hay que
  regenerar ni reinstalar el APK.
- **Cambios del contenedor (ícono, nombre, package id):** regenerar el APK en
  PWABuilder **con la misma llave de firma** del Paso 1 y reinstalar.
