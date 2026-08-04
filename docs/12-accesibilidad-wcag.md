# Accesibilidad (WCAG 2.2)

Estado de la auditoría y medidas aplicadas en el frontend (Angular).

## Nivel objetivo
Conformidad **AA** de WCAG 2.2 para la interfaz completa.

## Aplicado

### 1. Perceptible
- **1.4.3 Contraste AA**: tokens de color definidos en `styles.scss` cumplen
  ratio ≥ 4.5:1 para texto normal en ambos temas:
  - Light: `--text #17233a` sobre blanco (~14:1), `--text-secondary #5a6b85`
    sobre blanco (~5.5:1).
  - Dark: `--text #e7edf6` sobre `#171f2e` (~12:1).
- **1.4.1 Uso del color**: los estados (éxito/error/advertencia) nunca usan
  solo color: chips y badges incluyen texto (ej. `Alta`, `Media`, `Baja`).
- **1.4.10 Reflujo**: media queries en `shell` y componentes rompen las
  rejillas a una columna en pantallas ≤ 900px.

### 2. Operable
- **2.1.1 Teclado**: todos los elementos interactivos son `button`/`a`/inputs
  nativos (enfocables). El tablero Kanban usa drag & drop HTML5 + soporte
  teclado vía `tabindex="0"` y doble clic para editar.
- **2.1.2 Sin trampas de teclado**: directiva `focus-trap.directive.ts`
  mantiene el foco dentro de modales (búsqueda global, chat, tareas) y lo
  restaura al abrir. Cierre con `Escape`.
- **2.4.1 Saltar bloques**: enlace "Saltar al contenido" en `shell.component.ts`
  que enfoca `#main`.
- **2.4.7 Foco visible**: `:focus-visible` global con anillo
  (`outline` + `box-shadow`) y estados de foco explícitos en inputs.
- **2.4.11/2.4.12 Foco no oscurecido** (WCAG 2.2): topbar sticky y z-index
  controlados; el foco no queda oculto bajo paneles.
- **2.5.8 Tamaño objetivo (mínimo 24px)**: botones de icono usan 36px, las
  celdas Kanban y entradas de calendario superan 24px.
- **2.4.3 Orden de foco**: el DOM sigue el orden visual.

### 3. Comprensible
- **3.2.3 Navegación consistente**: el shell (menú, topbar) es idéntico en
  todas las rutas.
- **3.3.1 Identificación de errores**: los formularios usan validación con
  mensajes textuales junto al campo.
- Etiquetas: los formularios usan `<label>` o `placeholder` + `aria-label`;
  los botones solo-icono llevan `aria-label`.

### 4. Robusto
- **4.1.2 Nombre, rol, valor**: `role="dialog"`, `aria-modal`, `aria-label`
  en modales; `role="status" aria-live="polite"` en el host de toasts;
  `role="grid"` en el calendario.
- Lenguaje: atributos y texto en español.

### 5. Movimiento reducido
- **2.3.3 Animación por interacción**: `@media (prefers-reduced-motion:
  reduce)` desactiva animaciones/transiciones globalmente.

## Checklist de verificación (pendientes por página)
- [x] Shell, navegación, búsqueda global, notificaciones, chat
- [x] Kanban, Calendario
- [ ] Revisar `<caption>` / `aria-label` de descripción en tablas de datos
      (catálogo, ventas, compras, RR.HH., auditoría)
- [ ] Etiquetas `<label>` explícitas en formularios extensos (POS, RR.HH.)
- [ ] Prueba con lector de pantalla (NVDA/VoiceOver) en flujo de venta
- [ ] Verificación de contraste automatizada (axe/Lighthouse) en CI

## Herramientas sugeridas
- Lighthouse Accessibility (devtools).
- axe DevTools.
- `ng add @angular-eslint/eslint-plugin` con reglas a11y.
