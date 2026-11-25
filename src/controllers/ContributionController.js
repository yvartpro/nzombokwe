import ContributionService from '../services/ContributionService.js';
import ObligationService from '../services/ObligationService.js';
import { Obligation, PaymentAllocation } from '../models/index.js';
export default class ContributionController {
  constructor(service = ContributionService, obligations = ObligationService) { this.service = service; this.obligations = obligations; }
  listObligations = async (req,res,next) => { try { res.json({success:true,data:await Obligation.findAll({include:[PaymentAllocation,'Member','Fund'],order:[['due_date','DESC']],limit:1000})}); } catch(error){next(error);} };
  generate = async (req,res,next) => { try { res.status(201).json({success:true,data:await this.obligations.generate(req.body.year,req.body.month)}); } catch(error){next(error);} };
  recordPayment = async (req,res,next) => { try { res.status(201).json({success:true,data:await this.service.record(req.body,req.session.user)}); } catch(error){next(error);} };
  listPayments = async (req,res,next) => { try { res.json({success:true,data:await this.service.list({fund_id:req.query.fund_id,member_id:req.query.member_id})}); } catch(error){next(error);} };
}
