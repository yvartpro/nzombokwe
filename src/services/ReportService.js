import { Op } from 'sequelize';
import { Member, Fund, TreasuryTransaction, Enrollment, Obligation, PaymentAllocation, ContributionPayment, SocialAssistance, AssistanceType } from '../models/index.js';
import TreasuryService from './TreasuryService.js';
import { cents, money } from '../utils/money.js';

export default class ReportService {
  static async dashboard() {
    const [members, funds, recent, obligations, payments] = await Promise.all([
      Member.count(), Fund.findAll({ where: { active: true } }),
      TreasuryTransaction.findAll({ include: [Fund], order: [['transaction_date', 'DESC'], ['id', 'DESC']], limit: 8 }),
      Obligation.findAll({ include: [PaymentAllocation] }), ContributionPayment.count()
    ]);
    const balances = {}, contributors = {};
    const today = new Date().toISOString().slice(0, 10);
    for (const fund of funds) {
      balances[fund.code] = await TreasuryService.balance(fund.id);
      contributors[fund.code] = await Enrollment.count({
        where: { fund_id: fund.id, [Op.or]: [{ effective_end_date: null }, { effective_end_date: { [Op.gte]: today } }] },
        distinct: true, col: 'member_id'
      });
    }
    let outstanding = 0n;
    for (const obligation of obligations) {
      const paid = obligation.PaymentAllocations.reduce((sum, allocation) => sum + cents(allocation.allocated_amount), 0n);
      const due = cents(obligation.expected_amount) - paid;
      if (due > 0n) outstanding += due;
    }
    const now = new Date(), start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10), end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
    const monthlyCollections = {};
    for (const fund of funds) {
      const rows = await ContributionPayment.findAll({ where: { fund_id: fund.id, payment_date: { [Op.between]: [start, end] } }, attributes: ['amount'] });
      monthlyCollections[fund.code] = money(rows.reduce((sum, row) => sum + cents(row.amount), 0n));
    }
    return { members, contributors, balances, recent, outstanding: money(outstanding), payment_count: payments, monthlyCollections };
  }

  static async summary({ from, to } = {}) {
    const dateWhere = from || to ? { transaction_date: { ...(from ? { [Op.gte]: from } : {}), ...(to ? { [Op.lte]: to } : {}) } } : {};
    const funds = await Fund.findAll({ where: { active: true } });
    const data = [];
    for (const fund of funds) {
      const rows = await TreasuryTransaction.findAll({ where: { fund_id: fund.id, ...dateWhere } });
      let entries = 0n, exits = 0n;
      for (const row of rows) {
        if (['ENTRY', 'OPENING_BALANCE', 'ADJUSTMENT'].includes(row.transaction_type)) entries += cents(row.amount);
        else exits += cents(row.amount);
      }
      data.push({ fund: fund.code, entries: money(entries), exits: money(exits), balance: await TreasuryService.balance(fund.id) });
    }
    return data;
  }

  static async contributionReport({ from, to, fundId } = {}) {
    const dateWhere = from || to ? { due_date: { ...(from ? { [Op.gte]: from } : {}), ...(to ? { [Op.lte]: to } : {}) } } : {};
    const obligations = await Obligation.findAll({ where: { ...dateWhere, ...(fundId ? { fund_id: fundId } : {}) }, include: [Member, Fund, PaymentAllocation], order: [['due_date', 'ASC']] });
    const groups = new Map();
    for (const obligation of obligations) {
      const key = `${obligation.member_id}:${obligation.fund_id}`;
      if (!groups.has(key)) groups.set(key, { member_id: obligation.member_id, member: `${obligation.Member.first_name} ${obligation.Member.last_name}`, fund_id: obligation.fund_id, fund: obligation.Fund.code, expected: 0n, paid: 0n, overdue: 0n, partial: 0, unpaid: 0 });
      const group = groups.get(key), paid = obligation.PaymentAllocations.reduce((sum, allocation) => sum + cents(allocation.allocated_amount), 0n), expected = cents(obligation.expected_amount), balance = expected - paid;
      group.expected += expected; group.paid += paid;
      if (balance > 0n) { if (obligation.due_date < new Date().toISOString().slice(0, 10)) group.overdue += balance; if (paid > 0n) group.partial++; else group.unpaid++; }
    }
    return [...groups.values()].map(group => ({ ...group, expected: money(group.expected), paid: money(group.paid), outstanding: money(group.expected - group.paid), overdue: money(group.overdue), status: group.overdue > 0n ? 'IN ARREARS' : group.partial ? 'PARTIALLY PAID' : group.unpaid ? 'PENDING' : 'UP TO DATE' }));
  }

  static async assistanceReport() {
    const records = await SocialAssistance.findAll({ include: [AssistanceType], order: [['request_date', 'DESC']] });
    const summary = new Map();
    for (const record of records) {
      const key = record.AssistanceType.name;
      const row = summary.get(key) || { type: key, requested: 0, approved: 0, disbursed: 0n, count: 0 };
      row.count++;
      if (record.status === 'REQUESTED') row.requested++;
      if (record.status === 'APPROVED') row.approved++;
      if (record.status === 'DISBURSED') row.disbursed += cents(record.amount_snapshot);
      summary.set(key, row);
    }
    return { records, byType: [...summary.values()].map(row => ({ ...row, disbursed: money(row.disbursed) })), totalDisbursed: money(records.filter(r => r.status === 'DISBURSED').reduce((sum, r) => sum + cents(r.amount_snapshot), 0n)) };
  }
}
