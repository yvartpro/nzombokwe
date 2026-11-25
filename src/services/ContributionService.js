import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { ContributionPayment, PaymentAllocation, Obligation, TreasuryTransaction } from '../models/index.js';
import { cents, money } from '../utils/money.js';
import { badRequest, notFound } from '../utils/errors.js';
import AuditService from './AuditService.js';
import TreasuryService from './TreasuryService.js';
export default class ContributionService {
 static async record({member_id,fund_id,payment_date,amount,receipt_number,notes,allocations=[]},actor){
  if(cents(amount)<=0n)throw badRequest('Payment amount must be positive'); if(!/^\d{4}-\d{2}-\d{2}$/.test(String(payment_date||''))||Number.isNaN(Date.parse(`${payment_date}T00:00:00Z`)))throw badRequest('A valid payment date is required');if(typeof receipt_number!=='string'||!receipt_number.trim())throw badRequest('A receipt number is required');if(!Array.isArray(allocations))throw badRequest('Allocations must be a list');
  const tx=await sequelize.transaction();try{
   if(!allocations.length){const open=await Obligation.findAll({where:{member_id,fund_id,due_date:{[Op.lte]:payment_date}},include:[PaymentAllocation],order:[['due_date','ASC'],['id','ASC']],transaction:tx,lock:tx.LOCK.UPDATE});let remaining=cents(amount);for(const obligation of open){const already=obligation.PaymentAllocations.reduce((s,a)=>s+cents(a.allocated_amount),0n);const due=cents(obligation.expected_amount)-already;if(due<=0n)continue;const take=remaining<due?remaining:due;if(take>0n){allocations.push({obligation_id:obligation.id,amount:money(take)});remaining-=take;}if(remaining===0n)break;}}
   const obligations=allocations.length?await Obligation.findAll({where:{id:allocations.map(a=>a.obligation_id)},transaction:tx,lock:tx.LOCK.UPDATE,include:[PaymentAllocation]}):[];
   if(allocations.length!==obligations.length)throw notFound('One or more obligations were not found');
   let allocated=0n;
   for(const item of allocations){const o=obligations.find(x=>x.id===Number(item.obligation_id));if(o.member_id!==Number(member_id)||o.fund_id!==Number(fund_id))throw badRequest('Payment and obligation must belong to the same member and fund');const amt=cents(item.amount);if(amt<=0n)throw badRequest('Allocation amounts must be positive');const already=o.PaymentAllocations.reduce((s,a)=>s+cents(a.allocated_amount),0n);if(amt>cents(o.expected_amount)-already)throw badRequest('Allocation exceeds the obligation balance');allocated+=amt;}
   if(allocated>cents(amount))throw badRequest('Allocations cannot exceed the payment amount');
   await TreasuryService.assertOpenPeriod(payment_date,tx);
   const journal=await TreasuryTransaction.create({fund_id,transaction_date:payment_date,transaction_type:'ENTRY',amount:money(amount),description:`Contribution received${receipt_number?` · Receipt ${receipt_number}`:''}`,reference_number:receipt_number,source_type:'CONTRIBUTION'}, {transaction:tx});
   const payment=await ContributionPayment.create({member_id,fund_id,payment_date,amount:money(amount),receipt_number,treasury_transaction_id:journal.id,recorded_by:actor?.id,notes},{transaction:tx});journal.source_id=payment.id;await journal.save({transaction:tx});
   for(const item of allocations)await PaymentAllocation.create({payment_id:payment.id,obligation_id:item.obligation_id,allocated_amount:money(item.amount)},{transaction:tx});
   await AuditService.record({userId:actor?.id,action:'PAYMENT_RECORDED',entityType:'ContributionPayment',entityId:payment.id,details:{fund_id,amount:money(amount),allocations}},tx);await tx.commit();return payment;
  }catch(e){await tx.rollback();throw e;}
 }
 static async list({fund_id,member_id}={}) {return ContributionPayment.findAll({where:{...(fund_id?{fund_id}:{}),...(member_id?{member_id}:{})},include:['Member','Fund','TreasuryTransaction'],order:[['payment_date','DESC'],['id','DESC']],limit:500});}
}
