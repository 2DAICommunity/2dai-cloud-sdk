# Changelog

## 2.0.1

### Added
- `Creation.source` — origin of a creation (`'web'` studio, `'sdk'`,
  `'mcp'`, `'api'` raw REST). Mirrors the dashboard's SDK / MCP cloud
  collections; stamped server-side from the request User-Agent.

## 2.0.0

Complete rewrite for the 2DAI v2 platform. **Breaking** — v2 is a new API and
a new client; v1.x code and `2dai_pk_…` keys do not carry over. Create a
`2dai_sk_…` key in your dashboard (**Integrations → API keys**) to get started.

### Added
- `Client` with typed namespaces: `generate` (image / image-with-refs / video,
  auto-polling by default), `creations` (list/get + move, trash, restore,
  delete, publish, unpublish), `folders` (list/create/update/delete),
  `uploads` (path / bytes / Blob / base64), `queue` (get / waitFor), and
  `cdn` (authenticated url / fetch / download / toBlob / toDataUrl).
- Typed error classes (`InsufficientCreditError`, `SpendLimitError`,
  `ScopeError`, `NsfwRejectedError`, `TierError`, `QueueLimitError`,
  `NotFoundError`, `RateLimitError`, `ValidationError`,
  `GenerationFailedError`, `TimeoutError` — all extending `ApiError`).
- Scoped API keys (`read` / `generate` / `manage` / `publish`) with optional
  per-key spend caps.
- Auto-minted idempotency tokens on generation submits; idempotent GETs retry
  on 429/5xx honouring `Retry-After`; submits never auto-retry.
- Request timeouts that also govern response-body reads; `AbortSignal`
  support end to end.
- Dual ESM + CJS build, TypeScript declarations, zero runtime dependencies,
  Node ≥ 18 and modern browsers.

### Removed
- The entire gen6-era 1.x surface.
