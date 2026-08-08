# OPROX Ecosystem — Security Policy

## Supported Products

| Product | Repository |
|---|---|
| OPROX OS | oprox-os |
| OPROX Code | oprox-code |
| OPROX Studio | oprox-studio |
| OPROX Real Estate | OPROX-Real-Estate |
| OPROX Academy | oprox-academy |
| OPROX Official Website | oprox-official-website |

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

Please report security vulnerabilities by emailing: **security@oprox.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested remediation

You will receive acknowledgment within 48 hours and a status update within 7 days.

## Security Configuration Requirements

### JWT Secret
All server applications (`oprox-os`, `oprox-academy`) require a cryptographically strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

The server will **refuse to start** if `JWT_SECRET` is not set. There is no fallback.

### Stripe Keys
Never commit Stripe live keys. Use environment variables only:
- `STRIPE_SECRET_KEY` — server-side only, never expose to clients
- `STRIPE_PUBLISHABLE_KEY` — safe for frontend
- `STRIPE_WEBHOOK_SECRET` — required for webhook signature verification

### Database
- Always use SSL (`?sslmode=require`) in production PostgreSQL connections
- Never expose `DATABASE_URL` to frontend code

### AI Provider Keys
- `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` — server-side only
- Rotate keys quarterly or after any suspected exposure

## Known Security Limitations (Pre-Production)

- `oprox-studio`: Authentication is not yet implemented (in-memory demo auth). Do not expose to the public internet without adding real auth middleware.
- `oprox-code`: All API endpoints are currently unauthenticated. Do not expose to the public internet without adding auth middleware.
- Token blacklist in `oprox-os`/`oprox-academy` is process-local (in-memory). Tokens are not globally revoked on logout across multiple instances. Use Redis-backed blacklist for multi-instance deployments.
