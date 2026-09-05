export function isAllowedOrigin(requestOrigin: string|null, allowedOrigin: string): boolean { if(!requestOrigin) return false; if(requestOrigin===allowedOrigin) return true; return allowedOrigin==='http://localhost:5173' && /^http:\/\/localhost(?::\d+)?$/.test(requestOrigin); }
export function rateLimitKey(request: Request): string { return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'; }
export type RateLimitRecord={window_start:number;request_count:number};
export function rateLimitAllowed(record: RateLimitRecord|null, now=Date.now(), max=60, windowMs=60_000): boolean { return !record || now-record.window_start>=windowMs || record.request_count<max; }
