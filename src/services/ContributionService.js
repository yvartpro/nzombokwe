import { Op } from 'sequelize';
import { randomBytes } from 'node:crypto';
import sequelize from '../config/database.js';
import { ContributionPayment, PaymentAllocation, Obligation, TreasuryTransaction, Enrollment, ContributionRate } from '../models/index.js';
import { cents, money } from '../utils/money.js';
import { badRequest, notFound } from '../utils/errors.js';
import AuditService from './AuditService.js';
import TreasuryService from './TreasuryService.js';
export default class ContributionService {
 static async record({member_id,fund_id,payment_date,amount,receipt_number,notes,allocations=[]},actor){
  if(cents(amount)<=0n)throw badRequest('Payment amount must be positive');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(payment_date||''))||Number.isNaN(Date.parse(`${payment_date}T00:00:00Z`)))throw badRequest('A valid payment date is required');
  if(receipt_number!==undefined&&receipt_number!==null&&String(receipt_number).trim()==='')receipt_number=null;
  if(receipt_number&&typeof receipt_number!=='string')throw badRequest('Receipt number must be text');
  if(!Array.isArray(allocations))throw badRequest('Allocations must be a list');
  const tx=await sequelize.transaction();try{
   const enrollment=await Enrollment.findOne({where:{member_id,fund_id,effective_start_date:{[Op.lte]:payment_date},[Op.or]:[{effective_end_date:null},{effective_end_date:{[Op.gte]:payment_date}}]},transaction:tx,lock:tx.LOCK.UPDATE});
   if(!enrollment)throw badRequest('Member must be enrolled in this fund on the payment date');
   let remaining=cents(amount);
   if(!allocations.length){
    const [payYear,payMonth]=payment_date.slice(0,7).split('-').map(Number);
    const [startYear,startMonth]=enrollment.effective_start_date.slice(0,7).split('-').map(Number);
    // Ensure every eligible month since this enrollment began has a dues obligation.
    let dueYear=startYear,dueMonth=startMonth;
    for(let count=0;count<600&&(dueYear<payYear||dueYear===payYear&&dueMonth<=payMonth);count++){
     const periodStart=`${dueYear}-${String(dueMonth).padStart(2,'0')}-01`;
     const exists=await Obligation.findOne({where:{enrollment_id:enrollment.id,obligation_type:'MONTHLY',period_year:dueYear,period_month:dueMonth},transaction:tx,lock:tx.LOCK.UPDATE});
     if(!exists){const rate=await ContributionRate.findOne({where:{fund_id,effective_from:{[Op.lte]:periodStart},[Op.or]:[{effective_until:null},{effective_until:{[Op.gte]:periodStart}}]},order:[['effective_from','DESC']],transaction:tx});if(!rate)throw badRequest(`No monthly contribution rate is configured for ${dueYear}-${String(dueMonth).padStart(2,'0')}; payment was not recorded`);const dueDate=new Date(Date.UTC(dueYear,dueMonth,0)).toISOString().slice(0,10);await Obligation.create({enrollment_id:enrollment.id,member_id,fund_id,obligation_type:'MONTHLY',period_year:dueYear,period_month:dueMonth,expected_amount:rate.amount,due_date:dueDate},{transaction:tx});}
     dueMonth++;if(dueMonth===13){dueMonth=1;dueYear++;}
    }
    const open=await Obligation.findAll({where:{member_id,fund_id,obligation_type:'MONTHLY',[Op.or]:[{period_year:{[Op.lt]:payYear}},{period_year:payYear,period_month:{[Op.lte]:payMonth}}]},include:[PaymentAllocation],order:[['period_year','ASC'],['period_month','ASC'],['id','ASC']],transaction:tx,lock:tx.LOCK.UPDATE});
    const allocateOpen=async obligation=>{const already=obligation.PaymentAllocations.reduce((sum,a)=>sum+cents(a.allocated_amount),0n);const planned=allocations.filter(a=>Number(a.obligation_id)===Number(obligation.id)).reduce((sum,a)=>sum+cents(a.amount),0n);const due=cents(obligation.expected_amount)-already-planned;if(due<=0n)return;const take=remaining<due?remaining:due;if(take>0n){allocations.push({obligation_id:obligation.id,amount:money(take)});remaining-=take;}};
    for(const obligation of open){await allocateOpen(obligation);if(remaining===0n)break;}
    // After arrears and this month's dues, create the next monthly obligations as needed.
    let year=payYear,month=payMonth;
    for(let count=0;remaining>0n&&count<600;count++){
     let obligation=await Obligation.findOne({where:{enrollment_id:enrollment.id,obligation_type:'MONTHLY',period_year:year,period_month:month},include:[PaymentAllocation],transaction:tx,lock:tx.LOCK.UPDATE});
     if(!obligation){
      const periodStart=`${year}-${String(month).padStart(2,'0')}-01`;
      const rate=await ContributionRate.findOne({where:{fund_id,effective_from:{[Op.lte]:periodStart},[Op.or]:[{effective_until:null},{effective_until:{[Op.gte]:periodStart}}]},order:[['effective_from','DESC']],transaction:tx});
      if(!rate)throw badRequest(`No monthly contribution rate is configured for ${year}-${String(month).padStart(2,'0')}; payment was not recorded`);
      const dueDate=new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);
      obligation=await Obligation.create({enrollment_id:enrollment.id,member_id,fund_id,obligation_type:'MONTHLY',period_year:year,period_month:month,expected_amount:rate.amount,due_date:dueDate},{transaction:tx});obligation.PaymentAllocations=[];
     }
     await allocateOpen(obligation);
     if(remaining===0n)break;
     month++;if(month===13){month=1;year++;}
    }
    if(remaining>0n)throw badRequest('Could not assign the full payment to monthly dues; check contribution rates');
   }
   const obligations=allocations.length?await Obligation.findAll({where:{id:allocations.map(a=>a.obligation_id)},transaction:tx,lock:tx.LOCK.UPDATE,include:[PaymentAllocation]}):[];
   if(allocations.length!==obligations.length)throw notFound('One or more obligations were not found');
   let allocated=0n;
   for(const item of allocations){const o=obligations.find(x=>x.id===Number(item.obligation_id));if(o.member_id!==Number(member_id)||o.fund_id!==Number(fund_id))throw badRequest('Payment and obligation must belong to the same member and fund');const amt=cents(item.amount);if(amt<=0n)throw badRequest('Allocation amounts must be positive');const already=o.PaymentAllocations.reduce((sum,a)=>sum+cents(a.allocated_amount),0n);if(amt>cents(o.expected_amount)-already)throw badRequest('Allocation exceeds the obligation balance');allocated+=amt;}
   if(allocated!==cents(amount))throw badRequest('The full contribution amount must be assigned to monthly dues');
   await TreasuryService.assertOpenPeriod(payment_date,tx);
   const receipt=receipt_number?.trim()||`RCPT-${payment_date.replaceAll('-','')}-${randomBytes(4).toString('hex').toUpperCase()}`;
   const journal=await TreasuryTransaction.create({fund_id,transaction_date:payment_date,transaction_type:'ENTRY',amount:money(amount),description:`Contribution received · Receipt ${receipt}`,reference_number:receipt,source_type:'CONTRIBUTION'}, {transaction:tx});
   const payment=await ContributionPayment.create({member_id,fund_id,payment_date,amount:money(amount),receipt_number:receipt,treasury_transaction_id:journal.id,recorded_by:actor?.id,notes},{transaction:tx});journal.source_id=payment.id;await journal.save({transaction:tx});
   for(const item of allocations)await PaymentAllocation.create({payment_id:payment.id,obligation_id:item.obligation_id,allocated_amount:money(item.amount)},{transaction:tx});
   await AuditService.record({userId:actor?.id,action:'PAYMENT_RECORDED',entityType:'ContributionPayment',entityId:payment.id,details:{fund_id,amount:money(amount),allocations}},tx);await tx.commit();return payment;
  }catch(e){await tx.rollback();throw e;}
 }
 static async list({fund_id,member_id}={}) {return ContributionPayment.findAll({where:{...(fund_id?{fund_id}:{}),...(member_id?{member_id}:{})},include:['Member','Fund','TreasuryTransaction',{model:PaymentAllocation,include:[Obligation]}],order:[['payment_date','DESC'],['id','DESC']],limit:500});}
}
