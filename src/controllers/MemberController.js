import MemberService from '../services/MemberService.js';
import GenealogyService from '../services/GenealogyService.js';
export default class MemberController {
  constructor(service = MemberService, genealogy = GenealogyService) { this.service = service; this.genealogy = genealogy; }
  getAll = async (req, res, next) => { try { res.json({ success: true, data: await this.service.list(String(req.query.search || '')) }); } catch (error) { next(error); } };
  create = async (req, res, next) => { try { res.status(201).json({ success: true, data: await this.service.create(req.body, req.session.user) }); } catch (error) { next(error); } };
  getOne = async (req, res, next) => { try { res.json({ success: true, data: await this.service.profile(req.params.id) }); } catch (error) { next(error); } };
  update = async (req, res, next) => { try { res.json({ success: true, data: await this.service.update(req.params.id, req.body, req.session.user) }); } catch (error) { next(error); } };
  descendants = async (req, res, next) => { try { res.json({ success: true, data: await this.genealogy.descendants(req.params.id) }); } catch (error) { next(error); } };
}
