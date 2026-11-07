import { PlannerService } from '../application/plannerService';
import { plannerAccountGateway, plannerSessionGateway } from './plannerSessionGateway';
import { getPlannerStore } from './plannerStorage';
export const plannerService = new PlannerService({
  session: plannerSessionGateway,
  account: plannerAccountGateway,
  store: getPlannerStore,
});
