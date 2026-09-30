import { getSupabaseClient } from '@/features/backend/infrastructure/supabaseClient';
import type { Instrument, ScaleOption, TestQuestion, TestResult } from '../data/types';

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

interface TestBienestarRow {
  id_test: number;
  nombre_test: string;
  tipo_test: string;
  descripcion: string | null;
  puntaje_minimo: number;
  puntaje_maximo: number;
  is_active: boolean;
  pregunta_test: PreguntaTestRow[];
}

export const PSS10_RANGES = {
  LEVE_MAX: 13,
  MODERADO_MAX: 26,
} as const;

export async function fetchStressTestInstrument(): Promise<Instrument> {
  const { data, error } = await getSupabaseClient()
    .from('test_bienestar')
    .select(`
      id_test,
      nombre_test,
      tipo_test,
      descripcion,
      puntaje_minimo,
      puntaje_maximo,
      is_active,
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
    .eq('nombre_test', 'Escala de Estrés Percibido (PSS-10)')
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

    if (raw > PSS10_RANGES.MODERADO_MAX) {
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
    name: testRow.nombre_test,
    eyebrow: 'TEST DE ESTRÉS (PSS-10)',
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
