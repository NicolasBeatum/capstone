import * as Crypto from 'expo-crypto';
import { PlannerService } from '../application/plannerService';
import { legacyGateway } from './legacyStorage';
import { plannerSessionGateway, supabaseScheduleGateway } from './plannerSessionGateway';
import { getPlannerStore } from './plannerStorage';
export const plannerService = new PlannerService({
  session: plannerSessionGateway,
  remote: supabaseScheduleGateway,
  store: getPlannerStore,
  newId: () => Crypto.randomUUID(),
  legacy: legacyGateway,
});
