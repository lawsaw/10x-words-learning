## Service Description

- Defines a reusable `OpenRouterService` within `lib/openrouter` to broker LLM chat requests for Next.js 16 + TypeScript 5 apps.
- Encapsulates request composition, HTTP transport, structured response parsing, and observability for OpenRouter API usage.
- Core components:
  1. **ConfigurationGateway**
     - Functionality: Reads API base URL, key, default model, and tuned parameters from environment (`process.env`) or encrypted storage, exposing immutable config snapshots.
     - Challenges:
       1. Ensuring runtime availability of secrets across Edge/server runtimes.
       2. Avoiding accidental logging of sensitive config.
     - Solutions:
       1. Inject config via Next.js runtime env (`NEXT_PUBLIC_` avoided) and optional Supabase key vault; validate during service construction.
       2. Centralize redaction helpers and scrub logs before emitting.
  2. **MessageComposer**
     - Functionality: Normalizes system/user/tool messages into OpenRouter-compatible arrays and enforces schema (role+content).
     - Challenges:
       1. Handling multilingual content and token limits.
       2. Maintaining deterministic message order when adding context (memory, system hints).
     - Solutions:
       1. Provide token estimation utilities and truncation guards; support UTF-8 validation before send.
       2. Compose via pure functions that accept ordered arrays and append deterministic metadata (timestamps, conversation IDs).
  3. **PayloadSerializer**
     - Functionality: Assembles request JSON with `model`, `messages`, `response_format`, `stream`, and tunable parameters (e.g., `temperature`, `top_p`).
     - Challenges:
       1. Validating `response_format` JSON schema before send.
       2. Supporting optional per-call overrides without mutating defaults.
     - Solutions:
       1. Integrate Zod schema to validate outbound payloads and surface granular errors.
       2. Use shallow merge strategy with `Object.freeze` defaults to prevent mutation.
  4. **HttpTransport**
     - Functionality: Executes fetch requests against OpenRouter with retries, timeout, and streaming support for Edge/runtime compatibility.
     - Challenges:
       1. Differing fetch implementations between Node.js and Next.js Edge.
       2. Respecting OpenRouter rate limits and backoff guidance.
     - Solutions:
       1. Accept a pluggable `fetch` (default global) and test both runtimes; polyfill AbortController where necessary.
       2. Implement exponential backoff with jitter; read `retry-after` headers to schedule retries.
  5. **ResponseInterpreter**
     - Functionality: Parses responses (streaming and non-streaming), extracts choices, usage metrics, and applies JSON schema validation for structured outputs.
     - Challenges:
       1. Handling partial JSON when streaming structured data.
       2. Differentiating between transport errors and model-level refusals.
     - Solutions:
       1. Buffer incremental chunks, detect schema completion, and validate once complete; add timeouts.
       2. Map OpenRouter error payloads into typed errors with categories (auth, quota, refusal, server).
  6. **ObservabilityAdapter**
     - Functionality: Emits metrics/logs to Supabase or preferred logging sink, including latency, token usage, and failure rates.
     - Challenges:
       1. Avoiding PII leakage in logs.
       2. Minimizing overhead in Edge runtime.
     - Solutions:
       1. Redact message content before logging; log metadata only (token counts, IDs).
       2. Batch metrics uploads and use asynchronous, fire-and-forget strategies where consistent.

## Constructor Description

- Signature: `constructor(config: OpenRouterConfig, options?: OpenRouterOptions)`
- Parameters:
  - `config`: Required immutable settings (apiKey, baseUrl, defaultModel, defaultParams, timeoutMs).
  - `options.fetchImpl`: Optional custom fetch for tests/Edge parity.
  - `options.logger`: Optional structured logger adhering to `{ info(), warn(), error() }`.
  - `options.metricsClient`: Optional interface for reporting usage.
- Responsibilities:
  - Validate presence of `apiKey` and `baseUrl`; throw early if missing.
  - Freeze config snapshot for thread safety.
  - Prebuild default headers (`Authorization: Bearer`, `HTTP-Referer`, `X-Title`) per OpenRouter docs.
  - Instantiate reusable helper instances (token estimator, schema validator).

## Public Methods and Fields

- `sendChat(input: ChatRequest): Promise<ChatResponse>`
  - Accepts `{ messages, model?, parameters?, responseFormat?, tags?, signal? }`.
  - Flow: compose messages → serialize payload → issue POST to `/v1/chat/completions` → parse response → return normalized payload with `{ id, model, choices, usage }`.
  - Examples:
    1. **System message**: `messages` begins with `{ role: 'system', content: 'You are a vocabulary tutor.' }`; method enforces presence or injects default when configured.
    2. **User message**: Append `{ role: 'user', content: 'Define "lexicon".' }`; composer ensures UTF-8 and optional metadata fields.
    3. **Structured response via response_format**:
       - `responseFormat` example:
         ```json
         {
           "type": "json_schema",
           "json_schema": {
             "name": "word_card",
             "strict": true,
             "schema": {
               "type": "object",
               "properties": {
                 "term": { "type": "string" },
                 "definition": { "type": "string" },
                 "examples": {
                   "type": "array",
                   "items": { "type": "string" }
                 }
               },
               "required": ["term", "definition"]
             }
           }
         }
         ```
       - Payload serializer injects this as `response_format` and validates before send.
    4. **Model name**: Provide `model: 'openrouter/anthropic/claude-3.5-sonnet'`; falls back to config default if omitted; validated against allowlist.
    5. **Model parameters**: `parameters: { temperature: 0.7, top_p: 0.9, max_tokens: 512 }`; merged with defaults; rejects unsupported keys.
- `streamChat(input: StreamChatRequest): Promise<ReadableStream<ChatChunk>>`
  - Enables SSE/streamed responses; wraps fetch body in Web Streams for Next.js app router; handles JSON schema completion before closing stream.
- `getDefaultConfig(): OpenRouterConfig`
  - Returns read-only snapshot for diagnostics.
- Public fields:
  - `static DEFAULT_TIMEOUT_MS`
  - `static SUPPORTED_PARAMETERS` (Set of accepted keys, e.g., `temperature`, `top_p`, `frequency_penalty`).

## Private Methods and Fields

- `_buildHeaders(extra?: Record<string, string>): HeadersInit`
  - Adds `Authorization`, JSON content-type, and optional telemetry headers.
- `_buildPayload(input: ChatRequest): OpenRouterPayload`
  - Calls message composer, merges parameters, injects model, response format, metadata tags.
- `_validateResponseSchema(data: unknown, schema?: JsonSchema)`
  - Runs Zod or Ajv validation when `response_format` is used; throws structured error on failure.
- `_executeFetch(payload: OpenRouterPayload, signal?: AbortSignal): Promise<Response>`
  - Applies timeout via `AbortController`, attaches retry logic, inspects HTTP status for error mapping.
- `_parseResponse(res: Response): Promise<ChatResponse>`
  - Distinguishes streaming vs JSON, extracts first choice, attaches usage stats.
- `_handleStream(res: Response): ReadableStream<ChatChunk>`
  - Parses event stream, buffers JSON for `response_format`, emits typed chunks.
- `_emitMetric(event: MetricEvent, meta: MetricMeta): void`
  - No-op if metrics client absent; ensures non-blocking behaviour.
- Private fields:
  - `_config`, `_fetchImpl`, `_logger`, `_metricsClient`, `_tokenEstimator`, `_zodSchema`.

## Error Handling

1. **Missing credentials**: Throw `OpenRouterConfigurationError` during construction if `apiKey` or `baseUrl` absent.
2. **Payload validation failure**: Reject request with `OpenRouterValidationError` containing field details (messages, response_format, parameters).
3. **Network timeout/abort**: Wrap fetch errors into `OpenRouterNetworkError` with retry hints.
4. **HTTP non-2xx**: Parse body; map `401/403` to `OpenRouterAuthError`, `429` to `OpenRouterRateLimitError`, `>=500` to `OpenRouterServerError`.
5. **Model refusal/content filter**: Detect `choices[].finish_reason === 'content_filter'` and raise `OpenRouterSafetyError`.
6. **Schema mismatch**: When response fails `_validateResponseSchema`, throw `OpenRouterSchemaError` with validation summary.
7. **Streaming interruption**: Surface as `OpenRouterStreamError` and close stream with diagnostic event.
8. **Unexpected format**: Use fallback handler to guard against missing `choices`, returning `OpenRouterUnexpectedResponseError`.

## Security Considerations

- Store API keys in server-only env variables (`OPENROUTER_API_KEY`); never expose via client bundles.
- Use Supabase Key Vault or environment secrets manager for production deployments.
- Redact sensitive headers and message content in logs; log message hashes or IDs instead.
- Enforce HTTPS base URL and validate TLS certificates (rely on fetch defaults).
- Limit request payload size and strip user-provided system messages unless explicitly allowed.
- Apply role-based access control before invoking the service to ensure only authorized users trigger LLM calls.
- Monitor and cap token usage per user/session to prevent abuse, storing metrics in Supabase.

## Step-by-Step Implementation Plan

1. **Define types**: Create `lib/types.ts` entries (`OpenRouterConfig`, `ChatMessage`, `ChatRequest`, `ChatResponse`, `ResponseFormatSchema`) using TypeScript 5 features (satisfies, const assertions).
2. **Set up configuration**: Add `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_DEFAULT_MODEL` to `.env`; expose server-only via `next.config.js` runtime config.
3. **Implement `OpenRouterService` class** in `lib/openrouter/service.ts`, following constructor contract and freezing config.
4. **Create MessageComposer utility**: Pure functions to normalize system/user messages, enforce ordering, and compute approximate token usage.
5. **Integrate schema validation**: Use Zod or Ajv in `_validateResponseSchema`; precompile schemas for performance.
6. **Build payload serializer**: Merge default parameters with request overrides, attach `response_format` using pattern `{ type: 'json_schema', json_schema: { name, strict: true, schema } }`.
7. **Develop HTTP transport**: Implement `_executeFetch` with retries, exponential backoff, and abort timeout using `AbortController`.
8. **Handle responses**: Parse JSON for `sendChat`; for `streamChat`, implement Web Stream reader converting chunks into `ChatChunk` events and final schema validation.
9. **Map errors**: centralize error factory functions, ensuring numbered scenarios map to distinct error classes; export error types for consumers.
10. **Add observability hooks**: Connect `_emitMetric` to Supabase or console logger, redacting sensitive data.
11. **Write tests**: Use `vitest` or Jest to cover payload building, schema validation, and error mapping; mock fetch for deterministic behaviour.
12. **Document usage**: Provide README snippets showing how to instantiate service inside Next.js route handlers or server actions, highlighting system/user message setup and optional `response_format`.
