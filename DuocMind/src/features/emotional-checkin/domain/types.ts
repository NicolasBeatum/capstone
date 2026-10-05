export interface TestQuestion {
  id: number;
  title: string;
  helper?: string;
  isCritica?: boolean;
  options?: ScaleOption[];
}

export interface ScaleOption {
  label: string;
  value: number;
}

export interface TestResult {
  score: number;
  maxScore: number;
  percentage?: number;
  /** Clave estable de la categoría, ej. 'leve' | 'moderado' | 'bajo' */
  category: string;
  /** Etiqueta legible para mostrar al usuario */
  categoryLabel: string;
}

export interface Instrument {
  id: string;
  /** id_test y version en test_bienestar; necesarios para guardar en aplicacion_test */
  testId?: number;
  testVersion?: number;
  /** Subtítulo del header, ej. 'Escala de Estrés Percibido (PSS-10)' */
  name: string;
  /** Etiqueta de progreso sobre la barra, ej. 'TEST DE BIENESTAR' */
  eyebrow: string;
  questions: TestQuestion[];
  options: ScaleOption[];
  /** Texto descriptivo por categoría, indexado por TestResult.category */
  interpretation: Record<string, string>;
  score: (answers: Record<number, number>) => TestResult;
}
