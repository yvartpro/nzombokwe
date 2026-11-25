import sequelize from '../config/database.js';
import { SocialAssistance, AssistanceType, TreasuryTransaction, Fund, Member } from '../models/index.js';
import { cents, money } from '../utils/money.js';
import { badRequest, notFound, conflict } from '../utils/errors.js';
import AuditService from './AuditService.js';
import TreasuryService from './TreasuryService.js';

export default class AssistanceService {
  static async list() {
    return SocialAssistance.findAll({ include: [{ model: Member, as: 'beneficiary' }, AssistanceType], order: [['request_date', 'DESC']] });
  }

  static async create(data, actor) {
    const [type, member] = await Promise.all([AssistanceType.findByPk(data.assistance_type_id), Member.findByPk(data.beneficiary_member_id)]);
    if (!type) throw notFound('Assistance type not found');
    if (!member) throw notFound('Beneficiary member not found');
    const amount = data.amount ?? type.default_amount;
    if (cents(amount) <= 0n) throw badRequest('Assistance amount must be positive');
    const requestDate = data.request_date || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestDate) || Number.isNaN(Date.parse(`${requestDate}T00:00:00Z`))) throw badRequest('A valid request date is required');
    const tx = await sequelize.transaction();
    try {
      const row = await SocialAssistance.create({ beneficiary_member_id: member.id, assistance_type_id: type.id, amount_snapshot: money(amount), request_date: requestDate, description: data.description, status: 'REQUESTED', recorded_by: actor?.id }, { transaction: tx });
      await AuditService.record({ userId: actor?.id, action: 'ASSISTANCE_REQUESTED', entityType: 'SocialAssistance', entityId: row.id, details: { amount: row.amount_snapshot } }, tx);
      await tx.commit(); return row;
    } catch (error) { await tx.rollback(); throw error; }
  }

  static async transition(id, status, actor) {
    const tx = await sequelize.transaction();
    try {
      const row = await SocialAssistance.findByPk(id, { transaction: tx, lock: tx.LOCK.UPDATE });
      if (!row) throw notFound('Assistance record not found');
      if (status === 'APPROVED') {
        if (row.status !== 'REQUESTED') throw conflict('Only requested assistance can be approved');
        await row.update({ status, approval_date: new Date().toISOString().slice(0, 10) }, { transaction: tx });
      } else if (status === 'REJECTED') {
        if (!['REQUESTED', 'APPROVED'].includes(row.status)) throw conflict('This request cannot be rejected');
        await row.update({ status }, { transaction: tx });
      } else if (status === 'DISBURSED') {
        if (row.status !== 'APPROVED') throw conflict('Assistance must be approved before disbursement');
        const fund = await Fund.findOne({ where: { code: 'SOCIAL' }, transaction: tx });
        const date = new Date().toISOString().slice(0, 10);
        await TreasuryService.assertOpenPeriod(date, tx);
        const journal = await TreasuryTransaction.create({ fund_id: fund.id, transaction_date: date, transaction_type: 'EXIT', amount: row.amount_snapshot, description: `Social assistance disbursement · record ${row.id}`, source_type: 'SOCIAL_ASSISTANCE', recorded_by: actor?.id }, { transaction: tx });
        await row.update({ status, disbursement_date: date, treasury_transaction_id: journal.id }, { transaction: tx });
        journal.source_id = row.id; await journal.save({ transaction: tx });
      } else throw badRequest('Unsupported assistance status');
      await AuditService.record({ userId: actor?.id, action: `ASSISTANCE_${status}`, entityType: 'SocialAssistance', entityId: row.id, details: { status } }, tx);
      await tx.commit(); return row;
    } catch (error) { await tx.rollback(); throw error; }
  }
}
