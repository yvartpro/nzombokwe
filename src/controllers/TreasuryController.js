import TreasuryService from '../services/TreasuryService.js';
export default class TreasuryController {
  constructor(service = TreasuryService) { this.service = service; }
  journal = async (req,res,next) => { try { res.json({success:true,data:await this.service.journal({fund_id:req.query.fund_id,from:req.query.from,to:req.query.to})}); } catch(error){next(error);} };
  create = async (req,res,next) => { try { res.status(201).json({success:true,data:await this.service.create(req.body,req.session.user)}); } catch(error){next(error);} };
  reverse = async (req,res,next) => { try { res.status(201).json({success:true,data:await this.service.reverseManualTransaction(req.params.id,req.session.user)}); } catch(error){next(error);} };
}
