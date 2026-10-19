import { identifier, invalid, parseSchedule, record } from '../domain/schedule.ts';
import {
  PlannerAuthError,
  type PlannerSession,
  type RemoteSchedule,
  type ScheduleGateway,
} from '../application/plannerContracts.ts';
export type PlannerRpc = (
  name: string,
  args: Record<string, unknown>,
  session: PlannerSession,
) => Promise<{ data: unknown; error: { code?: string } | null }>;
export function parseRemoteSchedule(value: unknown): RemoteSchedule {
  const v = record(value, ['revision', 'document']);
  if (!Number.isSafeInteger(v.revision) || Number(v.revision) < 0) invalid();
  return { revision: Number(v.revision), document: parseSchedule(v.document) };
}
export function createScheduleGateway(rpc: PlannerRpc): ScheduleGateway {
  const call = async (name: string, args: Record<string, unknown>, session: PlannerSession) => {
    identifier(session.userId);
    const { data, error } = await rpc(name, args, session);
    if (error) {
      if (['P0401', '42501', 'PGRST301', 'PGRST303'].includes(error.code ?? '')) {
        throw new PlannerAuthError();
      }
      if (error.code === 'PGRST202' || error.code === '42883') {
        throw new Error(
          'El servidor necesita la actualización de horarios. Tus cambios siguen guardados aquí.',
        );
      }
      if (error.code === 'P0422' || error.code === 'P0409') {
        throw new Error(
          'El servidor rechazó el cambio. Revisa el horario; tus datos locales se conservan.',
        );
      }
      throw new Error(
        'No pudimos sincronizar el horario. Tus cambios siguen guardados en este dispositivo.',
      );
    }
    return data;
  };
  return {
    async load(session) {
      return parseRemoteSchedule(await call('load_personal_schedule', {}, session));
    },
    async save(session, submission) {
      const document = parseSchedule(submission.document),
        requestId = identifier(submission.requestId);
      if (!Number.isSafeInteger(submission.expectedRevision) || submission.expectedRevision < 0) {
        invalid();
      }
      const response = await call('save_personal_schedule', {
        p_expected_revision: submission.expectedRevision,
        p_request_id: requestId,
        p_document: document,
      }, session);
      if (!response || typeof response !== 'object' || !('status' in response)) invalid();
      if (response.status === 'conflict') {
        const v = record(response, ['status', 'remote']);
        return { status: 'conflict', remote: parseRemoteSchedule(v.remote) };
      }
      const v = record(response, ['status', 'revision', 'requestId']);
      if (
        v.status !== 'applied' || v.requestId !== requestId ||
        v.revision !== submission.expectedRevision + 1
      ) invalid();
      return { status: 'applied', revision: Number(v.revision), requestId };
    },
  };
}
