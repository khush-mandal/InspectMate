import { BaseRepository } from './BaseRepository';
import { AuditLog, IAuditLog } from '../models/AuditLog';

export class AuditLogRepository extends BaseRepository<IAuditLog> {
  constructor() {
    super(AuditLog);
  }
}

export const auditLogRepository = new AuditLogRepository();
