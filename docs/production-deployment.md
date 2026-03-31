# Production Deployment Notes

## Detail API hardening

- The `/api/details/[type]/[id]` route now relies on in-process singleton caches for static JSON datasets and cached monster/map derivations.
- This reduces per-request CPU cost, but it does not replace abuse protection at the platform edge.
- Production deployments should apply edge or gateway rate limiting to `/api/details/*` to prevent burst abuse from turning into avoidable origin load.

## Security headers

- The app ships with an enforced `Content-Security-Policy` header by default.
- An additional `Content-Security-Policy-Report-Only` header is only emitted when `ENABLE_CSP_REPORT_ONLY=true` is present at runtime.
- `allowedDevOrigins` is limited to development mode and is not included in the production config.
