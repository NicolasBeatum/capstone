import { platformSecureKeyValueStorage } from '@/shared/backend/infrastructure/platformSecureStorage';
import { createLocalDeletionSchedule } from '../application/localDeletionSchedule';

export const localDeletionSchedule = createLocalDeletionSchedule(platformSecureKeyValueStorage);
