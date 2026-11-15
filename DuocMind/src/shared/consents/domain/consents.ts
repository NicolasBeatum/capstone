export interface ConsentChoices {
  /** Entregar datos de forma anónima a Bienestar (código `analitica_anonima`). */
  shareAnonymousData: boolean;
  /** Ser contactado con los datos registrados en caso de emergencia. */
  allowEmergencyContact: boolean;
}

export type ConsentKey = keyof ConsentChoices;

/** Versión del texto de consentimiento que acepta la persona; se guarda con cada cambio. */
export const CONSENT_TEXT_VERSION = 'v1';

/** Código de cada consentimiento en el catálogo `consentimiento`; el id nunca se escribe a mano. */
export const CONSENT_CODES: Record<ConsentKey, string> = {
  shareAnonymousData: 'analitica_anonima',
  allowEmergencyContact: 'contacto',
};

export const NO_CONSENTS: ConsentChoices = { shareAnonymousData: false, allowEmergencyContact: false };

/** Texto breve de cada consentimiento, compartido por el registro y Mi perfil; el detalle está en el documento de consentimientos. */
export const CONSENT_TEXT: Record<ConsentKey, string> = {
  shareAnonymousData: 'Aceptar compartir datos anónimos',
  allowEmergencyContact: 'Aceptar que se le contacte en caso de emergencia',
};

/**
 * Los check-in, sus motivos y los resultados del test solo salen del dispositivo con al
 * menos un consentimiento activo: ambos los necesitan en el servidor (estadísticas
 * agrupadas o revisión para ofrecer acompañamiento). Sin ninguno se quedan en el teléfono.
 * El servidor aplica la misma regla con RLS (migración 20261115120000).
 */
export function allowsEmotionalUpload(choices: ConsentChoices): boolean {
  return choices.shareAnonymousData || choices.allowEmergencyContact;
}

export interface ConsentDetailSection {
  heading: string;
  items: string[];
}

/** Explicación breve de cada consentimiento; resume el documento, no lo reemplaza. */
export interface ConsentDetail {
  title: string;
  summary: string;
  sections: ConsentDetailSection[];
}

/** Se aplica a los dos consentimientos y se muestra al final de cada explicación. */
export const CONSENT_UPLOAD_NOTE =
  'Sin ninguno de los dos activo, lo que registres se guarda solo en este dispositivo y no se envía nunca, aunque después actives uno. Lo que ya enviaste se conserva en tu cuenta; puedes pedir que se borre desde Mi perfil.';

export const CONSENT_DETAILS: Record<ConsentKey, ConsentDetail> = {
  shareAnonymousData: {
    title: 'Compartir datos anónimos',
    summary: 'Tus registros se suman a estadísticas para el equipo de Bienestar Estudiantil.',
    sections: [
      {
        heading: 'Qué se comparte',
        items: [
          'Las emociones que registras y sus motivos.',
          'Los resultados del test de estrés.',
          'Tu carrera, para agrupar los resultados.',
        ],
      },
      {
        heading: 'Qué no se comparte',
        items: [
          'Nada que diga que esos registros son tuyos: Bienestar nunca ve tu nombre, RUT, correo ni teléfono junto a tus emociones o tus tests.',
          'Tus asignaturas y tu horario, que quedan solo en este teléfono.',
        ],
      },
      {
        heading: 'Quién lo ve',
        items: [
          'Bienestar Estudiantil, solo como totales de grupos de al menos 5 estudiantes, por ejemplo «el ánimo promedio de tu carrera en los últimos 30 días».',
          'Nadie puede saber qué registró una persona en particular.',
        ],
      },
      {
        heading: 'Ten en cuenta',
        items: [
          'En el servidor tus registros quedan unidos a tu cuenta, para que puedas verlos en tu historial y pedir que se borren. Esa unión nunca se muestra a Bienestar.',
          'Si además activas el contacto de emergencia, Bienestar sí puede saber que eres tú; lo explica ese permiso.',
        ],
      },
      {
        heading: 'Si lo desactivas',
        items: [
          'Tus registros dejan de contarse en las estadísticas desde ese momento.',
          'Lo que ya enviaste sigue guardado; puedes pedir que se borre desde Mi perfil.',
        ],
      },
    ],
  },
  allowEmergencyContact: {
    title: 'Contacto en caso de emergencia',
    summary:
      'Si tus registros muestran señales de que podrías necesitar apoyo, una persona de Bienestar puede contactarte.',
    sections: [
      {
        heading: 'Qué se comparte',
        items: [
          'Tu nombre, teléfono y correo, para poder contactarte.',
          'Un resumen de tus emociones registradas y de los resultados del test.',
        ],
      },
      {
        heading: 'Quién lo ve',
        items: ['Una persona capacitada de Bienestar Estudiantil, solo para ofrecerte acompañamiento.'],
      },
      {
        heading: 'Ten en cuenta',
        items: [
          'Puedes rechazar el contacto sin ninguna consecuencia.',
          'No es un servicio de emergencia ni de monitoreo en tiempo real. Si necesitas ayuda urgente, llama al 4141.',
        ],
      },
      {
        heading: 'Si lo desactivas',
        items: [
          'Bienestar deja de ver tus datos de contacto desde ese momento.',
          'Lo que ya enviaste sigue guardado; puedes pedir que se borre desde Mi perfil.',
        ],
      },
    ],
  },
};

/** Valida lo guardado en el dispositivo: cualquier dato inválido equivale a «desactivado». */
export function parseConsentChoices(raw: string | null): ConsentChoices {
  if (!raw) return NO_CONSENTS;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return NO_CONSENTS;
    const { shareAnonymousData, allowEmergencyContact } = value as Record<string, unknown>;
    return {
      shareAnonymousData: shareAnonymousData === true,
      allowEmergencyContact: allowEmergencyContact === true,
    };
  } catch {
    return NO_CONSENTS;
  }
}

/** Estado remoto vigente: solo las claves con fila; sin fila significa no otorgado. */
export type RemoteConsents = Partial<Record<ConsentKey, boolean>>;

/**
 * Valida las filas de `estudiante_consentimiento_actual` y las cruza con el catálogo por id,
 * porque la vista de producción no expone `codigo`. Ignora lo que no reconoce.
 */
export function parseRemoteConsents(rows: unknown, catalog: unknown): RemoteConsents {
  if (!Array.isArray(rows) || !Array.isArray(catalog)) {
    throw new Error('Respuesta de consentimientos no válida.');
  }
  const codes = new Map<unknown, unknown>();
  for (const entry of catalog) {
    if (!entry || typeof entry !== 'object') continue;
    const { id_consentimiento, codigo } = entry as Record<string, unknown>;
    codes.set(id_consentimiento, codigo);
  }
  const result: RemoteConsents = {};
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const { consentimiento_id_consentimiento, otorgado } = row as Record<string, unknown>;
    if (typeof otorgado !== 'boolean') continue;
    const codigo = codes.get(consentimiento_id_consentimiento);
    for (const key of Object.keys(CONSENT_CODES) as ConsentKey[]) {
      if (CONSENT_CODES[key] === codigo) result[key] = otorgado;
    }
  }
  return result;
}
