# Refinamiento visual del panel — 2026-10-04

Refinamiento autorizado de T013–T019/T021. Conserva contratos, permisos y el
alcance funcional aprobado; no incorpora compartición emocional ni integración
Android.

## Referencias

- [Ant Design · Data List](https://ant.design/docs/spec/data-list/): listados
  fáciles de recorrer, búsqueda junto a los datos y creación/edición separadas.
- [Ant Design · Drawer](https://ant.design/components/drawer/): editar
  conservando el contexto del listado. Se aplica mediante ventana modal nativa;
  no se instala Ant Design.
- [Carbon · Data table](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines):
  jerarquía de encabezados, herramientas del listado y acciones por registro.
- Paleta de `DuocMind/src/shared/theme.ts`: marino y amarillo como identidad.

## Decisiones

- Navegación lateral oscura en escritorio; fila desplazable en móvil. Ruta
  actual indicada en el encabezado y enlace para saltar al contenido.
- Superficies opacas, fondo neutro, bordes discretos y espaciado consistente.
  Encabezados de página con descripción y acción principal.
- Tips y eventos priorizan el listado: búsqueda, filtros, estados con texto y
  acciones por fila. El contenido completo se consulta en el editor.
- Crear/editar abre una ventana con título, cierre visible y scroll propio.
  Escape y Tab respetan la modalidad; cerrar restaura el foco al botón de
  origen.
- Si hay cambios, se elige seguir editando o descartarlos. Durante una escritura
  o mientras su respuesta no esté confirmada no se permite cerrar; se conserva
  el reintento idempotente. Los errores aparecen dentro del editor.
- Tests agrupan versiones en tablas por catálogo, distinguiendo publicación,
  activación y revisión. Se mantienen los editores guiados y la inmutabilidad.
- Dashboard muestra solamente métricas reales del registro; la compartición
  voluntaria mantiene su estado pendiente y no se inventan indicadores.

## Verificación

Supabase local, cuentas sintéticas y capturas ignoradas. Se verifican recorridos
administrativos, apertura desde una fila, conservación/descarte de cambios, foco
al abrir/cerrar, ciclo de Tab, Escape, conflicto, respuesta perdida, reintento y
ausencia de desbordamiento horizontal a 390 px. La evidencia de ejecuciones se
registra en `verification.md`.
