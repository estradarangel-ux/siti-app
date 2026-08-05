# Estados de WhatsApp — TIENDA en línea (shop.siticomunicaciones.com)

Plantillas para promocionar la tienda en línea de SITI (storefront de Syscom).

> **Nota:** este entorno no puede abrir `shop.siticomunicaciones.com` (bloqueado
> por la política de red), así que estas son **plantillas con huecos** para que
> tú pongas la foto y el precio del producto. Cuando me mandes capturas reales
> de la tienda —o habilites el dominio en la red del entorno— genero las
> versiones finales ya rellenadas.

## Contenido

- `preview-01-oferta-semana.png` — oferta con foto + precio antes/ahora
- `preview-02-producto-destacado.png` — producto destacado con 3 beneficios
- `preview-03-vendemos-e-instalamos.png` — diferenciador: *"No solo te lo vendemos, te lo instalamos"*
- `preview-04-categorias.png` — categorías de la tienda (CCTV, control de acceso, redes, energía, alarmas, radiocomunicación)
- `preview-05-cta-tienda.png` — cierre "compra en línea 24/7"
- `plantillas-tienda.html` — fuente editable y autónoma de las 5 plantillas

## Cómo rellenar una plantilla

**Rápido (recomendado):** toma la `preview-*.png` y, en Canva o en el editor de
WhatsApp, pega encima la foto del producto y escribe el nombre y el precio sobre
los huecos.

**Editando el HTML (control total):**
1. Abre `plantillas-tienda.html` en el navegador para ver las 5 tarjetas
   (ya miden 1080×1920).
2. Ábrelo con un editor de texto y reemplaza los huecos:
   - `[ Nombre del producto ]` → nombre real
   - `$0,000` → precio real (el tachado es el precio de lista, opcional)
   - el cuadro *"Pega aquí la foto del producto"* → cámbialo por
     `<img src="foto.jpg" style="flex:1;object-fit:contain">` (pon `foto.jpg`
     junto al HTML)
   - `55 0000 0000` → tu WhatsApp
3. Guarda, recarga y toma captura de la tarjeta.

## Idea de uso
Sube 1 **oferta** (plantilla 1 o 2) 2–3 veces por semana con un producto
distinto, y de vez en cuando la **plantilla 3** (vendemos + instalamos) y la
**5** (compra en línea). Sigue la estrategia completa en
`../GUIA-ESTADOS-WHATSAPP.md`.
