/** Resultado de elegir el boletín: los bytes del PDF o la cancelación del selector. */
export type PickedTimetable = { kind: 'cancelled' } | { kind: 'file'; bytes: Uint8Array };

/** Abre el selector de archivos; lanza `DuocTimetableError('too_large')` antes de leer. */
export type PickTimetableFile = () => Promise<PickedTimetable>;
