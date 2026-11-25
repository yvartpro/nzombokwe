import { Member } from '../models/index.js';
import { notFound } from '../utils/errors.js';
export default class GenealogyService {
 static async descendants(id) { const root=await Member.findByPk(id); if(!root) throw notFound('Member not found'); const rows=await Member.findAll({order:[['birth_order','ASC'],['first_name','ASC']]}); const byParent=new Map(); for(const m of rows) for(const p of [m.father_id,m.mother_id].filter(Boolean)){if(!byParent.has(p))byParent.set(p,[]);byParent.get(p).push(m);} const result=[]; const queue=[{m:root,depth:0}]; const visited=new Set([root.id]); while(queue.length){const {m,depth}=queue.shift();for(const child of byParent.get(m.id)||[]){if(visited.has(child.id))continue;visited.add(child.id);result.push({...child.toJSON(),generation:depth+1});queue.push({m:child,depth:depth+1});}} return {root,descendants:result}; }
}
