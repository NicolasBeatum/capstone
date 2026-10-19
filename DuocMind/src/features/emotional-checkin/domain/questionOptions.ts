import type { ScaleOption, TestQuestion } from './types';

export function getQuestionOptions(question: TestQuestion, fallback: ScaleOption[]): ScaleOption[] {
  return question.options ?? fallback;
}
