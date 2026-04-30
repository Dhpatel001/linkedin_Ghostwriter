# P0 Implementation Spec - Security, Validation, Guardrails

## Scope
- Add backend middleware for request validation, rate limiting, and subscription enforcement.
- Wire middleware into sensitive `auth`, `posts`, `voice`, and `billing` routes with safe defaults.
- Harden LinkedIn OAuth `state` handling and improve billing webhook guardrails.
- Standardize API error responses where reasonable in middleware and core handlers.
- Complete first-pass frontend production-readiness trust/legal/contact improvements.

## Non-goals (this pass)
- Large controller refactors or broad response-shape rewrites across every endpoint.
- Provider migrations or billing architecture changes.
- Unrelated UI redesigns.

## Backend Acceptance Criteria
- Validation middleware blocks malformed params/query/body with `400` and `code: "VALIDATION_ERROR"`.
- Rate limiting exists for high-risk endpoints (OAuth entry/callback, post generation, voice generation/analyze, billing subscription actions, webhook).
- Subscription middleware blocks paid-feature access for users with non-active/non-trial status, returning `403` and `code: "SUBSCRIPTION_REQUIRED"`.
- OAuth state is signed and verified (tamper-resistant), not just base64-decoded.
- Webhook handler fails closed for invalid signature/body/config and does not crash on malformed payloads.
- Core auth/error middleware responses use consistent `{ success: false, error, code }`.

## Frontend Acceptance Criteria
- Public trust/legal pages (`privacy`, `terms`, `contact`) exist and are reachable.
- Error and not-found pages provide clear recovery paths.
- First-pass legal/trust links are present in key unauthenticated flows.

## Endpoint and Page Checklist

### Backend Routes
- `GET /api/auth/linkedin`
  - [ ] Validate query (`intent`, `tier`, `next`) shape.
  - [ ] Apply route rate limit.
  - [ ] Generate signed state.
- `GET /api/auth/linkedin/callback`
  - [ ] Apply route rate limit.
  - [ ] Verify signed state before using `intent/tier/next`.
- `GET/PATCH /api/auth/me`
  - [ ] Keep auth required.
  - [ ] Add patch payload validation.
- `POST /api/posts/*` and `PATCH /api/posts/*` sensitive mutations
  - [ ] Require auth + active/trial subscription for generation/mutations.
  - [ ] Apply focused generation/mutation rate limits.
  - [ ] Validate key payloads and ids.
- `POST/PATCH /api/voice/*` sensitive mutations
  - [ ] Require auth + active/trial subscription.
  - [ ] Apply focused generation/analyze rate limits.
  - [ ] Validate key payloads.
- `POST /api/billing/webhook`
  - [ ] Guard missing secret/signature/body.
  - [ ] Verify signature against raw body.
  - [ ] Handle malformed JSON safely.
  - [ ] Apply conservative webhook rate limit.
- Billing authenticated endpoints
  - [ ] Validate tier and payload shapes.
  - [ ] Apply moderate rate limits for create/cancel actions.

### Frontend Pages
- `/privacy` - [x] Present
- `/terms` - [x] Present
- `/contact` - [x] Present
- `/error` - [x] Present recovery UI
- `/not-found` - [x] Present recovery UI
- Auth/landing legal links - [x] Present in current first pass

## Rollout Notes
- Keep middleware reusable and composable at route level.
- Prefer permissive but safe defaults to reduce accidental user lockouts.
- Log detailed errors server-side; return sanitized error messages to clients.
