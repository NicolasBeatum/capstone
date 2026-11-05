import {
  parseEmail,
  parseNames,
  parsePhone,
  type Parsed,
  type StudentProfilePatch,
} from '../domain/studentProfileEdit.ts';

export interface StudentProfileEditor {
  /** Actualiza solo las columnas indicadas de la fila propia. Lanza si no se pudo guardar. */
  updateProfile(patch: StudentProfilePatch): Promise<void>;
  /** Pide el cambio del correo de acceso; el nuevo correo rige cuando la persona lo confirma. */
  requestEmailChange(email: string): Promise<void>;
}

export type EditResult = { ok: true; notice?: string } | { ok: false; error: string };

const SAVE_FAILED = 'No se pudo guardar el cambio. Inténtalo de nuevo.';

async function run<T>(parsed: Parsed<T>, save: (value: T) => Promise<EditResult>): Promise<EditResult> {
  if (!parsed.ok) return parsed;
  try {
    return await save(parsed.value);
  } catch {
    return { ok: false, error: SAVE_FAILED };
  }
}

/** Guardan un dato del perfil. Validan antes de llamar al backend y nunca lanzan. */
export function saveName(editor: StudentProfileEditor, names: string, surnames: string): Promise<EditResult> {
  return run(parseNames(names, surnames), async (patch) => {
    await editor.updateProfile(patch);
    return { ok: true };
  });
}

export function savePhone(editor: StudentProfileEditor, phone: string): Promise<EditResult> {
  return run(parsePhone(phone), async (value) => {
    await editor.updateProfile({ numero_telefonico: value });
    return { ok: true };
  });
}

export function saveEmail(editor: StudentProfileEditor, email: string): Promise<EditResult> {
  return run(parseEmail(email), async (value) => {
    await editor.requestEmailChange(value);
    return {
      ok: true,
      notice: `Te enviamos un enlace a ${value} para confirmar el cambio. Hasta entonces sigues entrando con tu correo actual.`,
    };
  });
}
