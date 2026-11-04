import type { CheckinMood } from '../application/localCheckinStore';

/**
 * Mensaje de cierre tras registrar el ánimo, uno por estado. Tono de cuidado: valida lo que la
 * persona siente, no culpa ni exige mejorar, y con ánimo bajo recuerda que Bienestar está a mano.
 */
export const THANKS_MESSAGES: Record<CheckinMood, string> = {
  'Muy mal':
    'Hoy pesa, y está bien decirlo. Registrarlo ya es una forma de cuidarte. Un día difícil no define lo que viene. Si lo necesitas, en Bienestar encuentras apoyo.',
  Mal: 'Los días grises también pasan, y no tienes que resolverlo todo hoy. Gracias por contarlo.',
  Neutro: 'Un día tranquilo también cuenta. Gracias por tomarte un momento para ti.',
  Bien: '¡Qué bueno! Disfruta lo que te hizo sentir así y llévalo contigo.',
  'Muy bien':
    '¡Sigue con ese ánimo! Guarda este momento: puede acompañarte en los días más pesados.',
};

export function thanksMessage(mood: CheckinMood): string {
  return THANKS_MESSAGES[mood];
}
