import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import type { Instrument, ScaleOption, TestQuestion, TestResult } from '../domain/types';
import { getStudentId } from './supabaseCheckinGateway';

interface OpcionRespuestaRow {
  id_opcion: number;
  texto_opcion: string;
  puntaje: number;
}

interface PreguntaTestRow {
  id_pregunta: number;
  orden: number;
  texto_pregunta: string;
  is_critica: boolean;
  opcion_respuesta: OpcionRespuestaRow[];
}

interface ResultadoNivelRow {
  nivel_resultado: string;
  puntaje_minimo: number;
  puntaje_maximo: number;
  label: string;
}

interface TestBienestarRow {
  id_test: number;
  version: number;
  nombre_test: string;
  tipo_test: string;
  descripcion: string | null;
  puntaje_minimo: number;
  puntaje_maximo: number;
  is_active: boolean;
  pregunta_test: PreguntaTestRow[];
  test_resultado_nivel: ResultadoNivelRow[];
}

const PSS10_TEST_NAME = 'Escala de Estrés Percibido (PSS-10)';

export const PSS10_RANGES = {
  LEVE_MAX: 13,
  MODERADO_MAX: 26,
} as const;

export async function fetchStressTestInstrument(): Promise<Instrument> {
  const { data, error } = await getSupabaseClient()
    .from('test_bienestar')
    .select(`
      id_test,
      version,
      nombre_test,
      tipo_test,
      descripcion,
      puntaje_minimo,
      puntaje_maximo,
      is_active,
      test_resultado_nivel (
        nivel_resultado,
        puntaje_minimo,
        puntaje_maximo,
        label
      ),
      pregunta_test (
        id_pregunta,
        orden,
        texto_pregunta,
        is_critica,
        opcion_respuesta (
          id_opcion,
          texto_opcion,
          puntaje
        )
      )
    `)
    .eq('nombre_test', PSS10_TEST_NAME)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se encontró el test de estrés en la base de datos.');
  }

  const testRow = data as unknown as TestBienestarRow;

  const sortedPreguntas = [...(testRow.pregunta_test ?? [])].sort(
    (a, b) => a.orden - b.orden,
  );

  const questions: TestQuestion[] = sortedPreguntas.map((preg) => {
    const sortedOpciones = [...(preg.opcion_respuesta ?? [])].sort(
      (a, b) => a.id_opcion - b.id_opcion,
    );

    const options: ScaleOption[] = sortedOpciones.map((op) => ({
      label: op.texto_opcion,
      value: op.puntaje,
    }));

    return {
      id: preg.id_pregunta,
      title: preg.texto_pregunta,
      helper: testRow.descripcion ?? undefined,
      isCritica: preg.is_critica,
      options,
    };
  });

  const defaultOptions: ScaleOption[] = questions[0]?.options ?? [];
  const minScore = testRow.puntaje_minimo ?? 0;
  const maxScore = testRow.puntaje_maximo ?? 40;

  const scoreCalculator = (answers: Record<number, number>): TestResult => {
    const raw = questions.reduce((total, q) => total + (answers[q.id] ?? 0), 0);
    const range = maxScore - minScore;
    const percentage = range > 0 ? Math.round(((raw - minScore) / range) * 100) : 0;

    let category = 'leve';
    let categoryLabel = 'Estrés leve';

    // Los niveles de la BDD son la fuente de verdad: aplicacion_test solo acepta esos.
    const level = (testRow.test_resultado_nivel ?? []).find(
      (nivel) => raw >= nivel.puntaje_minimo && raw <= nivel.puntaje_maximo,
    );

    if (level) {
      category = level.nivel_resultado;
      categoryLabel = level.label || categoryLabel;
    } else if (raw > PSS10_RANGES.MODERADO_MAX) {
      category = 'severo';
      categoryLabel = 'Estrés severo';
    } else if (raw > PSS10_RANGES.LEVE_MAX) {
      category = 'moderado';
      categoryLabel = 'Estrés moderado';
    }

    return {
      score: raw,
      maxScore,
      percentage,
      category,
      categoryLabel,
    };
  };

  return {
    id: 'pss10',
    testId: testRow.id_test,
    testVersion: testRow.version,
    name: testRow.nombre_test,
    eyebrow: 'TEST ESTRÉS PERCIBIDO (PSS-10)',
    questions,
    options: defaultOptions,
    interpretation: {
      leve: 'Tus respuestas indican un nivel de estrés leve dentro de los rangos normales y esperables.',
      moderado: 'Tus respuestas indican un nivel de estrés moderado. Podría ser de ayuda revisar tus horarios y momentos de descanso.',
      severo: 'Tus respuestas indican un nivel de estrés elevado. Te sugerimos conversar con el equipo de bienestar estudiantil.',
    },
    score: scoreCalculator,
  };
}

export interface StressTestApplication {
  testId: number;
  testVersion: number;
  result: TestResult;
  criticalItemDetected: boolean;
}

export interface LastStressTestApplication {
  appliedAt: string;
  /** nivel_resultado guardado, ej. 'leve' | 'moderado' | 'severo' */
  level: string;
}

/** Última aplicación del PSS-10 (cualquier versión) por el estudiante actual, o null. */
export async function fetchLastStressTest(): Promise<LastStressTestApplication | null> {
  const studentId = await getStudentId();
  const { data, error } = await getSupabaseClient()
    .from('aplicacion_test')
    .select('fecha_hora, nivel_resultado, test_bienestar!inner(nombre_test)')
    .eq('estudiante_id_estudiante', studentId)
    .eq('test_bienestar.nombre_test', PSS10_TEST_NAME)
    .order('fecha_hora', { ascending: false })
    .limit(1)
    .maybeSingle<{ fecha_hora: string; nivel_resultado: string }>();
  if (error) throw error;
  return data ? { appliedAt: data.fecha_hora, level: data.nivel_resultado } : null;
}

/** Guarda solo el puntaje total y el nivel; las respuestas individuales no se persisten. */
export async function saveStressTestApplication(application: StressTestApplication): Promise<void> {
  const studentId = await getStudentId();
  const { error } = await getSupabaseClient().from('aplicacion_test').insert({
    puntaje_total: application.result.score,
    test_id: application.testId,
    test_version: application.testVersion,
    nivel_resultado: application.result.category,
    item_critico_detectado: application.criticalItemDetected,
    estudiante_id_estudiante: studentId,
  });
  if (error) throw error;
}
