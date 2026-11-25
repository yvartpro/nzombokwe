export function requireAuth(req,res,next){if(!req.session?.user)return res.status(401).json({success:false,error:'Authentication required'});next();}
export function requireRole(...roles){return (req,res,next)=>{if(!roles.includes(req.session?.user?.role))return res.status(403).json({success:false,error:'Insufficient permissions'});next();};}
