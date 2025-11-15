import type {
  ChatRequest,
  ChatResponse,
  ChatChunk,
  OpenRouterConfig,
  OpenRouterOptions,
  OpenRouterPayload,
  ChatMessage,
  ModelParameters,
} from "@/lib/types"
import {
  OpenRouterConfigurationError,
  OpenRouterValidationError,
  OpenRouterNetworkError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterServerError,
  OpenRouterSafetyError,
  OpenRouterSchemaError,
  OpenRouterUnexpectedResponseError,
} from "./errors"
import { MessageComposer } from "./message-composer"
import { SchemaValidator } from "./schema-validator"

/**
 * Service for communicating with OpenRouter API.
 * Encapsulates request composition, HTTP transport, structured response parsing,
 * and observability for OpenRouter API usage.
 */
export class OpenRouterService {
  public static readonly DEFAULT_TIMEOUT_MS = 30000
  public static readonly MAX_RETRIES = 3
  public static readonly INITIAL_RETRY_DELAY_MS = 1000
  public static readonly MAX_RETRY_DELAY_MS = 10000
  public static readonly SUPPORTED_PARAMETERS = new Set([
    "temperature",
    "top_p",
    "max_tokens",
    "frequency_penalty",
    "presence_penalty",
    "stop",
  ])

  private readonly _config: Readonly<OpenRouterConfig>
  private readonly _fetchImpl: typeof fetch
  private readonly _logger?: OpenRouterOptions["logger"]
  private readonly _metricsClient?: OpenRouterOptions["metricsClient"]

  /**
   * Constructs an OpenRouterService instance.
   * @param config Required immutable settings (apiKey, baseUrl, defaultModel, etc.)
   * @param options Optional custom fetch, logger, and metrics client
   * @throws {OpenRouterConfigurationError} If apiKey or baseUrl is missing
   */
  constructor(config: OpenRouterConfig, options?: OpenRouterOptions) {
    // Validate required configuration
    if (!config.apiKey) {
      throw new OpenRouterConfigurationError(
        "OpenRouter API key is required",
        { configKeys: Object.keys(config) }
      )
    }

    if (!config.baseUrl) {
      throw new OpenRouterConfigurationError(
        "OpenRouter base URL is required",
        { configKeys: Object.keys(config) }
      )
    }

    // Freeze config for immutability and thread safety
    this._config = Object.freeze({
      ...config,
      timeoutMs: config.timeoutMs ?? OpenRouterService.DEFAULT_TIMEOUT_MS,
      defaultParams: config.defaultParams ? Object.freeze({ ...config.defaultParams }) : undefined,
    })

    // Set optional dependencies
    this._fetchImpl = options?.fetchImpl ?? fetch
    this._logger = options?.logger
    this._metricsClient = options?.metricsClient

    this._logger?.info("OpenRouterService initialized", {
      baseUrl: this._config.baseUrl,
      defaultModel: this._config.defaultModel,
      timeoutMs: this._config.timeoutMs,
    })
  }

  /**
   * Sends a chat completion request to OpenRouter.
   * @param input Chat request with messages, model, parameters, and optional response format
   * @returns Promise resolving to chat response with choices and usage info
   * @throws {OpenRouterValidationError} If request validation fails
   * @throws {OpenRouterNetworkError} If network request fails or times out
   * @throws {OpenRouterAuthError} On authentication failures (401/403)
   * @throws {OpenRouterRateLimitError} When rate limit is exceeded (429)
   * @throws {OpenRouterServerError} On server errors (>= 500)
   * @throws {OpenRouterSafetyError} When content filter triggers
   * @throws {OpenRouterSchemaError} When response doesn't match expected schema
   * @throws {OpenRouterUnexpectedResponseError} When response format is unexpected
   */
  async sendChat(input: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now()

    try {
      // Build and validate payload
      const payload = this._buildPayload(input)

      // Execute fetch with retries
      const response = await this._executeFetch(payload, input.signal)

      // Parse and return response
      const chatResponse = await this._parseResponse(response)

      // Emit success metrics
      const latency = Date.now() - startTime
      this._emitMetric("chat_completion_success", {
        model: chatResponse.model,
        latency,
        promptTokens: chatResponse.usage?.prompt_tokens ?? 0,
        completionTokens: chatResponse.usage?.completion_tokens ?? 0,
      })

      return chatResponse
    } catch (error) {
      // Emit failure metrics
      const latency = Date.now() - startTime
      this._emitMetric("chat_completion_failure", {
        error: error instanceof Error ? error.name : "UnknownError",
        latency,
      })

      throw error
    }
  }

  /**
   * Sends a streaming chat completion request to OpenRouter.
   * @param input Chat request with streaming enabled
   * @returns Promise resolving to readable stream of chat chunks
   * @throws Similar errors as sendChat
   */
  async streamChat(input: ChatRequest): Promise<ReadableStream<ChatChunk>> {
    const payload = this._buildPayload(input)
    payload.stream = true

    const response = await this._executeFetch(payload, input.signal)
    return this._handleStream(response)
  }

  /**
   * Returns read-only snapshot of configuration for diagnostics.
   */
  getDefaultConfig(): Readonly<OpenRouterConfig> {
    return this._config
  }

  /**
   * Builds request headers with authorization and metadata.
   * @private
   */
  private _buildHeaders(extra?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this._config.apiKey}`,
    }

    // Add OpenRouter-specific headers
    if (this._config.appUrl) {
      headers["HTTP-Referer"] = this._config.appUrl
    }

    if (this._config.appTitle) {
      headers["X-Title"] = this._config.appTitle
    }

    // Merge with extra headers
    if (extra) {
      Object.assign(headers, extra)
    }

    return headers
  }

  /**
   * Builds request payload from chat input.
   * @private
   */
  private _buildPayload(input: ChatRequest): OpenRouterPayload {
    // Normalize and validate messages
    const messages = MessageComposer.normalizeMessages(input.messages)

    // Determine model
    const model = input.model ?? this._config.defaultModel

    // Merge parameters with defaults
    const parameters = this._mergeParameters(
      this._config.defaultParams ?? {},
      input.parameters ?? {}
    )

    // Validate parameters
    for (const key of Object.keys(parameters)) {
      if (!OpenRouterService.SUPPORTED_PARAMETERS.has(key)) {
        throw new OpenRouterValidationError(`Unsupported parameter: ${key}`, {
          parameter: key,
          supportedParameters: Array.from(OpenRouterService.SUPPORTED_PARAMETERS),
        })
      }
    }

    // Validate response format if specified
    if (input.responseFormat) {
      SchemaValidator.validateResponseFormat(input.responseFormat)
    }

    // Build payload
    const payload: OpenRouterPayload = {
      model,
      messages,
      ...parameters,
    }

    // Add response format if specified
    if (input.responseFormat) {
      payload.response_format = input.responseFormat
    }

    return payload
  }

  /**
   * Merges default and request-specific parameters.
   * @private
   */
  private _mergeParameters(
    defaults: ModelParameters,
    overrides: ModelParameters
  ): ModelParameters {
    return { ...defaults, ...overrides }
  }

  /**
   * Executes fetch request with timeout and retry logic.
   * @private
   */
  private async _executeFetch(
    payload: OpenRouterPayload,
    signal?: AbortSignal
  ): Promise<Response> {
    let lastError: Error | undefined
    
    for (let attempt = 0; attempt <= OpenRouterService.MAX_RETRIES; attempt++) {
      try {
        const response = await this._executeSingleFetch(payload, signal)
        
        // Handle HTTP errors with retry logic
        if (!response.ok) {
          // Check if error is retryable
          if (response.status === 429 || response.status >= 500) {
            if (attempt < OpenRouterService.MAX_RETRIES) {
              const retryAfter = response.headers.get("retry-after")
              const delayMs = retryAfter 
                ? parseInt(retryAfter, 10) * 1000 
                : this._calculateRetryDelay(attempt)
              
              this._logger?.warn("Retrying after error", {
                status: response.status,
                attempt: attempt + 1,
                delayMs,
              })
              
              await this._sleep(delayMs)
              continue
            }
          }
          
          await this._handleHttpError(response)
        }

        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Check if error is retryable
        const isRetryable = error instanceof OpenRouterNetworkError && error.retryable
        
        if (isRetryable && attempt < OpenRouterService.MAX_RETRIES) {
          const delayMs = this._calculateRetryDelay(attempt)
          
          this._logger?.warn("Retrying after network error", {
            attempt: attempt + 1,
            delayMs,
            error: lastError.message,
          })
          
          await this._sleep(delayMs)
          continue
        }
        
        throw error
      }
    }
    
    throw lastError ?? new OpenRouterNetworkError("Max retries exceeded")
  }

  /**
   * Executes a single fetch attempt.
   * @private
   */
  private async _executeSingleFetch(
    payload: OpenRouterPayload,
    signal?: AbortSignal
  ): Promise<Response> {
    // Create timeout controller
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      this._config.timeoutMs
    )

    // Combine signals if provided
    const combinedSignal = signal
      ? this._combineAbortSignals([signal, controller.signal])
      : controller.signal

    try {
      const url = `${this._config.baseUrl}/chat/completions`
      
      this._logger?.info("Sending request to OpenRouter", {
        url,
        model: payload.model,
        messagesCount: payload.messages.length,
      })

      const response = await this._fetchImpl(url, {
        method: "POST",
        headers: this._buildHeaders(),
        body: JSON.stringify(payload),
        signal: combinedSignal,
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)

      // Handle abort/timeout
      if (error instanceof Error && error.name === "AbortError") {
        this._logger?.error("Request timed out", { timeoutMs: this._config.timeoutMs })
        throw new OpenRouterNetworkError(
          "Request timed out. Please try again.",
          true,
          { timeoutMs: this._config.timeoutMs }
        )
      }

      // Handle network errors
      this._logger?.error("Network error", { error })
      throw new OpenRouterNetworkError(
        "Network request failed. Please check your connection.",
        true,
        { originalError: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  /**
   * Calculates retry delay with exponential backoff and jitter.
   * @private
   */
  private _calculateRetryDelay(attempt: number): number {
    const exponentialDelay = OpenRouterService.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt)
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    const delay = Math.min(exponentialDelay + jitter, OpenRouterService.MAX_RETRY_DELAY_MS)
    return Math.floor(delay)
  }

  /**
   * Sleeps for specified milliseconds.
   * @private
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Combines multiple AbortSignals into one.
   * @private
   */
  private _combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController()

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort()
        break
      }

      signal.addEventListener("abort", () => controller.abort(), { once: true })
    }

    return controller.signal
  }

  /**
   * Handles HTTP error responses.
   * @private
   */
  private async _handleHttpError(response: Response): Promise<never> {
    const status = response.status
    let errorBody: any

    // Clone response before reading body to avoid "Body already read" error
    const clonedResponse = response.clone()

    try {
      errorBody = await response.json()
    } catch {
      try {
        errorBody = { message: await clonedResponse.text() }
      } catch {
        errorBody = { message: "Failed to read error response" }
      }
    }

    const errorMessage = errorBody?.error?.message ?? errorBody?.message ?? "Unknown error"

    this._logger?.error("HTTP error from OpenRouter", {
      status,
      errorMessage,
      errorBody,
    })

    // Map status codes to specific errors
    if (status === 401 || status === 403) {
      throw new OpenRouterAuthError(
        `Authentication failed: ${errorMessage}`,
        { status, errorBody }
      )
    }

    if (status === 429) {
      const retryAfter = response.headers.get("retry-after")
      throw new OpenRouterRateLimitError(
        `Rate limit exceeded: ${errorMessage}`,
        retryAfter ? parseInt(retryAfter, 10) : undefined,
        { status, errorBody }
      )
    }

    if (status >= 500) {
      throw new OpenRouterServerError(
        `Server error: ${errorMessage}`,
        { status, errorBody }
      )
    }

    throw new OpenRouterUnexpectedResponseError(
      `Request failed with status ${status}: ${errorMessage}`,
      { status, errorBody }
    )
  }

  /**
   * Parses response into ChatResponse.
   * @private
   */
  private async _parseResponse(response: Response): Promise<ChatResponse> {
    let data: any

    try {
      data = await response.json()
    } catch (error) {
      this._logger?.error("Failed to parse response JSON", { error })
      throw new OpenRouterUnexpectedResponseError(
        "Failed to parse response as JSON",
        { originalError: error instanceof Error ? error.message : String(error) }
      )
    }

    // Validate response structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      this._logger?.error("Response missing choices", { data })
      throw new OpenRouterUnexpectedResponseError(
        "Response is missing choices array",
        { responseData: data }
      )
    }

    // Check for content filter
    const firstChoice = data.choices[0]
    if (firstChoice.finish_reason === "content_filter") {
      throw new OpenRouterSafetyError(
        "Content was filtered due to safety policies",
        { finishReason: firstChoice.finish_reason }
      )
    }

    // Construct response
    const chatResponse: ChatResponse = {
      id: data.id ?? "unknown",
      model: data.model ?? this._config.defaultModel,
      choices: data.choices,
      usage: data.usage
        ? {
            prompt_tokens: data.usage.prompt_tokens ?? 0,
            completion_tokens: data.usage.completion_tokens ?? 0,
            total_tokens: data.usage.total_tokens ?? 0,
          }
        : undefined,
      created: data.created,
    }

    return chatResponse
  }

  /**
   * Handles streaming response.
   * @private
   */
  private _handleStream(response: Response): ReadableStream<ChatChunk> {
    if (!response.body) {
      throw new OpenRouterUnexpectedResponseError("Response body is null for streaming request")
    }

    // For now, return a basic implementation
    // Full streaming support would require SSE parsing
    return response.body as unknown as ReadableStream<ChatChunk>
  }

  /**
   * Emits metrics if client is available.
   * @private
   */
  private _emitMetric(event: string, meta: any): void {
    if (!this._metricsClient) {
      return
    }

    try {
      this._metricsClient.recordMetric(event, meta)
    } catch (error) {
      this._logger?.warn("Failed to emit metric", { event, error })
    }
  }
}

