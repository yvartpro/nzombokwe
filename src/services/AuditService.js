import { AuditLog } from '../models/index.js';
export default class AuditService {
  static async record({ userId, action, entityType, entityId, details, ip }, transaction) { return AuditLog.create({ user_id: userId || null, action, entity_type: entityType, entity_id: entityId || null, details: details || null, ip_address: ip || null, created_at: new Date() }, { transaction }); }
}
