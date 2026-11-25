import { Op } from 'sequelize';
import { randomBytes } from 'node:crypto';
import sequelize from '../config/database.js';
import { Member, Enrollment, Fund, ContributionPayment, Obligation, PaymentAllocation, SocialAssistance, AssistanceType } from '../models/index.js';
import AuditService from './AuditService.js';
import GenealogyService from './GenealogyService.js';
import { badRequest, notFound } from '../utils/errors.js';
export default class MemberService {
  static async validateParents(memberId, parentIds, transaction) {
    for (const parentId of parentIds.filter(Boolean)) {
      if (Number(parentId) === Number(memberId)) throw badRequest('A member cannot be their own parent');
      const queue = [Number(parentId)], visited = new Set();
      while (queue.length) {
        const id = queue.shift();
        if (Number(id) === Number(memberId)) throw badRequest('This parent relationship would create a family-tree cycle');
        if (visited.has(id)) continue;
        visited.add(id);
        const current = await Member.findByPk(id, { transaction });
        if (!current) throw badRequest('Selected parent does not exist');
        queue.push(...[current.father_id, current.mother_id].filter(Boolean).map(Number));
      }
    }
  }
  static async list(search = '') {
    const where = search ? { [Op.or]: [{ first_name: { [Op.like]: `%${search}%` } }, { last_name: { [Op.like]: `%${search}%` } }, { member_number: { [Op.like]: `%${search}%` } }] } : {};
    return Member.findAll({ where, include: [{ model: Enrollment, include: [Fund] }], order: [['last_name','ASC'],['first_name','ASC']], limit: 500 });
  }
  static async create(data, actor) {
    if (typeof data.first_name !== 'string' || typeof data.last_name !== 'string' || !data.first_name.trim() || !data.last_name.trim()) throw badRequest('First name and last name are required');
    const tx = await sequelize.transaction();
    try {
      await this.validateParents(null, [data.father_id, data.mother_id], tx);
      const member = await Member.create({
        member_number: data.member_number?.trim() || `NZ-${randomBytes(4).toString('hex').toUpperCase()}`,
        first_name: data.first_name.trim(), last_name: data.last_name.trim(), gender: data.gender || 'UNSPECIFIED',
        date_of_birth: data.date_of_birth || null, phone: data.phone || null, email: data.email || null,
        father_id: data.father_id || null, mother_id: data.mother_id || null, birth_order: data.birth_order || null, notes: data.notes || null
      }, { transaction: tx });
      if (Number(member.father_id) === member.id || Number(member.mother_id) === member.id) throw badRequest('A member cannot be their own parent');
      await AuditService.record({ userId: actor?.id, action: 'MEMBER_CREATED', entityType: 'Member', entityId: member.id, details: { member_number: member.member_number } }, tx);
      await tx.commit(); return member;
    } catch (e) { await tx.rollback(); throw e; }
  }
  static async update(id, data, actor) {
    const member = await Member.findByPk(id); if (!member) throw notFound('Member not found');
    await this.validateParents(id, [data.father_id, data.mother_id], null);
    const allowed = ['first_name','last_name','gender','date_of_birth','phone','email','father_id','mother_id','birth_order','notes'];
    const changes = Object.fromEntries(allowed.filter(key => Object.hasOwn(data, key)).map(key => [key, data[key] === '' ? null : data[key]]));
    if (changes.first_name === null || changes.first_name === '' || changes.last_name === null || changes.last_name === '') throw badRequest('First name and last name cannot be blank');
    if (typeof changes.first_name === 'string') changes.first_name = changes.first_name.trim();
    if (typeof changes.last_name === 'string') changes.last_name = changes.last_name.trim();
    const before = member.toJSON(); await member.update(changes);
    await AuditService.record({ userId: actor?.id, action: 'MEMBER_UPDATED', entityType: 'Member', entityId: member.id, details: { before, after: member.toJSON() } }); return member;
  }
  static async profile(id) {
    const member = await Member.findByPk(id, { include: [{ model: Enrollment, include: [Fund] }, { model: Member, as: 'father' }, { model: Member, as: 'mother' }] });
    if (!member) throw notFound('Member not found');
    const [childrenF, childrenM, siblings] = await Promise.all([
      Member.findAll({ where: { father_id: id } }), Member.findAll({ where: { mother_id: id } }),
      Member.findAll({ where: { [Op.or]: [{ father_id: member.father_id || -1 }, { mother_id: member.mother_id || -1 }], id: { [Op.ne]: id } } })
    ]);
    const balances = await Promise.all(['SOCIAL','AUTO_DEVELOPMENT'].map(async code => {
      const fund = await Fund.findOne({ where: { code } });
      const enrolled = member.Enrollments?.some(e => e.fund_id === fund?.id && (!e.effective_end_date || e.effective_end_date >= new Date().toISOString().slice(0,10)));
      if (!enrolled) return { fund: code, expected: '0.00', paid: '0.00', outstanding: '0.00', status: 'NOT A CONTRIBUTOR' };
      const obligations = await Obligation.findAll({ where: { member_id: id, fund_id: fund.id }, include: [PaymentAllocation] });
      let expected=0n, paid=0n, overdue=false, partial=false, pending=false;
      for (const o of obligations) { const exp=BigInt(String(o.expected_amount).replace('.','')); let alloc=0n; for(const a of o.PaymentAllocations||[]) alloc += BigInt(String(a.allocated_amount).replace('.','')); expected+=exp; paid+=alloc; if (alloc < exp) { if(o.due_date < new Date().toISOString().slice(0,10)) overdue=true; else pending=true; if(alloc>0n) partial=true; } }
      const left=expected>paid?expected-paid:0n; const fmt=n=>`${n/100n}.${String(n%100n).padStart(2,'0')}`;
      return { fund: code, expected: fmt(expected), paid: fmt(paid), outstanding: fmt(left), status: overdue ? 'IN ARREARS' : partial ? 'PARTIALLY PAID' : pending ? 'PENDING' : 'UP TO DATE' };
    }));
    const [obligations, payments, assistance] = await Promise.all([
      Obligation.findAll({ where: { member_id: id }, include: [Fund, PaymentAllocation], order: [['due_date', 'ASC']] }),
      ContributionPayment.findAll({ where: { member_id: id }, include: [Fund, { model: PaymentAllocation, include: [Obligation] }], order: [['payment_date', 'DESC']] }),
      SocialAssistance.findAll({ where: { beneficiary_member_id: id }, include: [AssistanceType], order: [['request_date', 'DESC']] })
    ]);
    const genealogy = await GenealogyService.descendants(id);
    return { member, children: [...childrenF, ...childrenM].filter((m,i,a)=>a.findIndex(x=>x.id===m.id)===i), siblings, descendants: genealogy.descendants.length, balances, statement: { obligations, payments, assistance } };
  }
}
