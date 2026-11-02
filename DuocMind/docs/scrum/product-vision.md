# Product Vision — DuocMind

| Campo | Valor |
| --- | --- |
| Versión | 1.0.0 |
| Fecha | 2026-11-01 |
| Responsable del producto | Gustavo Roldán (Product Owner, según la definición de la Fase 1) |
| Fuentes | Definición del proyecto APT (Fase 1), `docs/constitution.md`, `specs/001` a `specs/012` |

> Este documento resume la visión del producto a partir de lo ya definido en la Fase 1 y en la constitución. No introduce requisitos nuevos.

## Declaración de visión

**Para** estudiantes de Duoc UC, sede Puerto Montt, que enfrentan estrés por la carga académica y no tienen una herramienta que una su organización con su bienestar,
**DuocMind** es una aplicación móvil Android de agenda estudiantil con apoyo a la salud mental
**que** permite organizar evaluaciones, tareas y eventos, registrar cómo se sienten cada día, responder un test de estrés y acceder a recursos de bienestar, incluso sin conexión.
**A diferencia de** una agenda genérica o de una app clínica, DuocMind une ambas cosas con un enfoque **no clínico**: no diagnostica, no reemplaza la atención profesional y no contacta a terceros de forma automática. La persona conserva siempre el control de lo que registra.

## Problema que resuelve

- El estrés académico, la ansiedad y la sobrecarga afectan el rendimiento y aumentan el riesgo de deserción (Universidad de Chile, 2019: un tercio de quienes ingresan a la educación superior tiene antecedentes de problemas de salud mental).
- Los estudiantes de primer y segundo año de Duoc UC Puerto Montt sufren más la adaptación a la vida académica.
- El área de Bienestar y Salud no tiene un medio propio para publicar eventos, consejos y cuestionarios sin depender de herramientas técnicas.

## Usuarios

| Usuario | Necesidad principal |
| --- | --- |
| Estudiante de Duoc UC | Organizar su carga académica, reflexionar sobre su ánimo y saber dónde buscar ayuda. |
| Funcionario de Bienestar y Salud | Administrar alumnos, cuestionarios, eventos y consejos sin usar el panel técnico de Supabase. |
| Equipo de desarrollo | Un entorno reproducible, con pruebas y entregas verificables. |

## Objetivo del producto

Desarrollar una aplicación de agenda estudiantil con un módulo de apoyo a la salud mental que permita gestionar la carga académica y realizar un seguimiento del bienestar emocional del estudiante (objetivo general de la Fase 1).

## Propuesta de valor

1. **Todo en un lugar:** agenda, eventos institucionales, check-in emocional y recursos de bienestar.
2. **Privacidad por diseño:** los datos emocionales son sensibles; hay aislamiento por usuario (RLS), cifrado local y eliminación de cuenta.
3. **Funciona sin conexión** en Android para agenda y emociones.
4. **Orientación prudente:** consejos y alertas privados y formulados en español claro y empático.
5. **Canal institucional:** un panel web para que Bienestar y Salud publique contenidos.

## Fuera de la visión (no objetivos)

- Diagnóstico o tratamiento clínico.
- Envío automático de información a terceros.
- Importar el horario real desde sistemas institucionales.
- Publicación en tiendas de aplicaciones y versión iOS (en este alcance).

## Criterios de éxito

| Criterio | Estado al 2026-11-01 |
| --- | --- |
| Versión funcional (producto mínimo viable) de la app Android | Lograda; cada merge a `dev` genera un APK firmado |
| Módulos de agenda, registro emocional y recursos de bienestar | Implementados |
| Datos emocionales aislados por usuario | Verificado con RLS en 24 de 24 tablas y pruebas con cuentas sintéticas |
| Panel de administración operativo | Implementado (alumnos, tests, eventos, tips) |
| Validación en dispositivos Android y con estudiantes | Pendiente |

## Principios que gobiernan el producto

Ver [`docs/constitution.md`](../constitution.md): bienestar no clínico, privacidad y seguridad, desarrollo guiado por especificaciones, arquitectura offline, calidad y accesibilidad, entregas reproducibles.
