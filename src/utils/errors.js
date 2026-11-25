export class HttpError extends Error { constructor(status, message, details) { super(message); this.status = status; this.details = details; } }
export const badRequest = (m) => new HttpError(400, m);
export const notFound = (m = 'Record not found') => new HttpError(404, m);
export const conflict = (m) => new HttpError(409, m);
