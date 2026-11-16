/** Explicación de un gráfico: qué muestra, cómo leerlo y cómo se calcula. */
export type ChartInfo = { what: string; read: string; how: string };

const BASE =
  "Solo cuentan los check-ins de estudiantes con «Compartir datos anónimos» activo, hechos después de activarlo y sin una solicitud de borrado pendiente.";
const TESTS =
  "Se usa el último PSS-10 (Escala de Estrés Percibido) de cada estudiante con «Compartir datos anónimos» activo. Estrés alto es el nivel máximo del test (27 a 40 puntos).";

/** Explicación del botón «i» de cada gráfico del dashboard de bienestar, por id de tarjeta. */
export const CHART_INFO = {
  "wb-trend": {
    what: "Cómo cambia el ánimo general semana a semana.",
    read: "Cada punto es una semana; más arriba es mejor ánimo (1 Muy mal, 3 Neutro, 5 Muy bien). Fíjate en la dirección de la línea más que en un punto aislado.",
    how: `Promedio de las emociones registradas en la semana. ${BASE} Una semana con menos de 5 estudiantes queda rayada.`,
  },
  "wb-stack": {
    what: "Qué proporción de los check-ins de cada semana fue de cada emoción.",
    read: "Cada barra suma 100 %. Si crecen los tramos rojos (Mal y Muy mal), hay más días difíciles aunque el promedio cambie poco.",
    how: `Check-ins de cada emoción divididos por el total de la semana. ${BASE} Si alguna emoción tiene de 1 a 4 estudiantes, se oculta la semana completa para que no se pueda despejar.`,
  },
  "wb-weekday": {
    what: "Si hay días de la semana con peor o mejor ánimo.",
    read: "Las columnas salen desde «Neutro» (3): hacia arriba, mejor que neutro; hacia abajo, peor. Sirve para planificar en qué días reforzar el acompañamiento.",
    how: `Promedio de las emociones registradas cada día de la semana en todo el periodo. ${BASE} Un día con menos de 5 estudiantes no se muestra.`,
  },
  "wb-top": {
    what: "Los motivos que más acompañan los check-ins del periodo.",
    read: "El porcentaje es la parte de los check-ins que mencionan ese motivo. Un check-in puede tener varios motivos, así que no suman 100 %.",
    how: `Check-ins con el motivo divididos por el total de check-ins. ${BASE} Solo aparecen motivos mencionados por 5 o más estudiantes.`,
  },
  "wb-ranking": {
    what: "Todos los motivos ordenados por cuántas veces se mencionan.",
    read: "Una barra más larga significa un motivo más frecuente. No dice si el motivo es bueno o malo; para eso mira «Ánimo promedio según el motivo».",
    how: `Check-ins con el motivo divididos por el total de check-ins; un check-in puede tener varios. ${BASE} Los motivos con menos de 5 estudiantes se juntan en «Otros motivos».`,
  },
  "wb-diverging": {
    what: "Qué motivos aparecen en días buenos y cuáles en días malos.",
    read: "El centro es «Neutro». Las barras hacia la izquierda son motivos de días peores que neutro; hacia la derecha, de días mejores.",
    how: `Promedio de las emociones de los check-ins que mencionan cada motivo. ${BASE} Solo motivos con 5 o más estudiantes.`,
  },
  "wb-matrix": {
    what: "Cómo se reparten las emociones dentro de cada motivo.",
    read: "Cada fila suma 100 %. Un azul más intenso indica una proporción mayor. Por ejemplo, si en «Académico» domina Mal, ese motivo se asocia a días difíciles.",
    how: `Check-ins de cada emoción con ese motivo divididos por el total del motivo. ${BASE} Si alguna emoción de la fila tiene de 1 a 4 estudiantes, la fila completa queda rayada para proteger a ese grupo.`,
  },
  "wb-reason-trend": {
    what: "Cómo evolucionan semana a semana los motivos más mencionados.",
    read: "Cada línea es un motivo. Una línea que sube indica que ese motivo aparece cada vez más; por ejemplo, «Académico» suele subir hacia los exámenes.",
    how: `Check-ins de la semana que mencionan el motivo divididos por el total de la semana. ${BASE} Las semanas con menos de 5 estudiantes no se muestran.`,
  },
  "wb-levels": {
    what: "Cuántos estudiantes están en cada nivel de estrés.",
    read: "Cada barra es un nivel del PSS-10 (leve, moderado, severo), con la cantidad de estudiantes y su porcentaje.",
    how: `${TESTS} Si algún nivel tiene de 1 a 4 estudiantes, se ocultan todos los niveles.`,
  },
  "wb-stress-weekly": {
    what: "Cómo cambia la proporción de estudiantes con estrés alto a lo largo del periodo.",
    read: "Una línea que sube indica más estudiantes con estrés alto. Como el test se hace cada cierto tiempo, cada semana refleja solo a quienes lo hicieron esa semana.",
    how: `Estudiantes con estrés alto divididos por los que hicieron el test esa semana. ${TESTS} Las semanas con menos de 5 tests quedan rayadas.`,
  },
  "wb-stress-careers": {
    what: "La proporción de estudiantes con estrés alto en cada carrera, con su puntaje promedio.",
    read: "Están en orden alfabético para no sugerir un ranking entre carreras. Compara cada carrera con el total de la pestaña, no entre ellas.",
    how: `${TESTS} Las carreras con menos de 5 estudiantes se juntan en «Otras carreras»; si quedara un grupo de 1 a 4, se le suma la carrera visible más pequeña.`,
  },
  "wb-funnel": {
    what: "Cuántos estudiantes pasan de registrarse en la app a compartir datos y a participar.",
    read: "Cada paso es parte del anterior. Una caída grande entre dos pasos muestra dónde se pierde participación.",
    how: "Registrados: estudiantes con cuenta. Con datos anónimos: los que tienen ese consentimiento activo. Activos: los que hicieron al menos un check-in que cuenta en el periodo. Solo totales; nunca se lista quién participa.",
  },
  "wb-active": {
    what: "Cuántos estudiantes distintos participan cada semana.",
    read: "Una columna más alta es una semana con más participación. Una baja sostenida puede indicar que conviene recordar la app.",
    how: `Estudiantes distintos con al menos un check-in que cuenta en la semana. ${BASE} Las semanas con menos de 5 estudiantes no se muestran.`,
  },
  "wb-careers": {
    what: "Un resumen por carrera: participantes, ánimo, días difíciles, estrés alto y motivo principal.",
    read: "Está en orden alfabético; no es un ranking. Úsala para ver si una carrera se aleja del promedio general.",
    how: `Días difíciles son los check-ins Mal o Muy mal. ${BASE} Las carreras con menos de 5 participantes, y quienes no tienen carrera registrada, se juntan en «Otras carreras». Si un dato de la fila tiene de 1 a 4 estudiantes, se oculta.`,
  },
} satisfies Record<string, ChartInfo>;

export type ChartInfoId = keyof typeof CHART_INFO;
