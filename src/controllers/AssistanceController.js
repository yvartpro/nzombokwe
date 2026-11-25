import AssistanceService from '../services/AssistanceService.js';
export default class AssistanceController {
  constructor(service = AssistanceService) { this.service = service; }
  list = async (req,res,next) => { try { res.json({success:true,data:await this.service.list()}); } catch(error){next(error);} };
  create = async (req,res,next) => { try { res.status(201).json({success:true,data:await this.service.create(req.body,req.session.user)}); } catch(error){next(error);} };
  transition = async (req,res,next) => { try { res.json({success:true,data:await this.service.transition(req.params.id,req.body.status,req.session.user)}); } catch(error){next(error);} };
}
