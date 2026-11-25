import { randomBytes, timingSafeEqual } from 'node:crypto';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
function reject(res, message = 'Security token expired. Refresh and try again.') {
  return res.status(403).json({ success: false, error: message });
}
export function csrfProtection(req, res, next) {
  if (!req.session) return next(new Error('Session middleware must run before CSRF middleware'));
  if (!req.session.csrfToken) req.session.csrfToken = randomBytes(32).toString('base64url');
  req.csrfToken = () => req.session.csrfToken;
  if (!unsafeMethods.has(req.method)) return next();

  const fetchSite = req.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return reject(res, 'Cross-site request rejected.');
  const origin = req.get('origin');
  if (origin) {
    let expected;
    try { expected = new URL(process.env.APP_URL || `${req.protocol}://${req.get('host')}`).origin; }
    catch { return reject(res, 'Request origin could not be verified.'); }
    if (origin !== expected) return reject(res, 'Cross-origin request rejected.');
  }
  const supplied = req.get('x-csrf-token') || req.get('csrf-token') || '';
  const expected = req.session.csrfToken;
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) return reject(res);
  return next();
}
