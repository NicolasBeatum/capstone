import { useCallback, useRef, useState } from 'react';
import { pickTimetableFile } from '../infrastructure/timetableFile';
import { DuocTimetableError, type DuocTimetable, parseDuocTimetable } from '../domain/duocTimetable';

export type ScheduleImportState =
  | { status: 'idle' }
  | { status: 'reading' }
  | { status: 'ready'; parsed: DuocTimetable }
  | { status: 'error'; message: string };

const GENERIC_ERROR = 'No pudimos abrir el archivo. Inténtalo de nuevo.';

/** Elige y lee el boletín en el dispositivo. Los errores nunca muestran el contenido del archivo. */
export function useScheduleImport() {
  const [state, setState] = useState<ScheduleImportState>({ status: 'idle' });
  const reading = useRef(false);
  const pick = useCallback(async () => {
    if (reading.current) return;
    reading.current = true;
    setState({ status: 'reading' });
    try {
      const picked = await pickTimetableFile();
      if (picked.kind === 'cancelled') {
        setState({ status: 'idle' });
        return;
      }
      setState({ status: 'ready', parsed: parseDuocTimetable(picked.bytes) });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof DuocTimetableError ? error.message : GENERIC_ERROR,
      });
    } finally {
      reading.current = false;
    }
  }, []);
  const reset = useCallback(() => setState({ status: 'idle' }), []);
  return { state, pick, reset };
}
