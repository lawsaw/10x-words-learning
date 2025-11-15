import { DomainError, ErrorCode } from "@/lib/errors"

/**
 * Base class for all OpenRouter-specific errors.
 */
export class OpenRouterError extends DomainError {
  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    public readonly context?: Record<string, any>
  ) {
    super(code, message, statusCode)
    this.name = "OpenRouterError"
  }
}

/**
 * Thrown when OpenRouter configuration is missing or invalid.
 */
export class OpenRouterConfigurationError extends OpenRouterError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.ExternalServiceError, message, 500, context)
    this.name = "OpenRouterConfigurationError"
  }
}

/**
 * Thrown when request payload validation fails.
 */
export class OpenRouterValidationError extends OpenRouterError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.ValidationError, message, 400, context)
    this.name = "OpenRouterValidationError"
  }
}

/**
 * Thrown when network request fails or times out.
 */
export class OpenRouterNetworkError extends OpenRouterError {
  constructor(
    message: string,
    public readonly retryable: boolean = true,
    context?: Record<string, any>
  ) {
    super(ErrorCode.ExternalServiceError, message, 503, context)
    this.name = "OpenRouterNetworkError"
  }
}

/**
 * Thrown on authentication failures (401/403).
 */
export class OpenRouterAuthError extends OpenRouterError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.Unauthorized, message, 401, context)
    this.name = "OpenRouterAuthError"
  }
}

/**
 * Thrown when rate limit is exceeded (429).
 */
export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(ErrorCode.RateLimited, message, 429, context)
    this.name = "OpenRouterRateLimitError"
  }
}

/**
 * Thrown on server errors from OpenRouter (>= 500).
 */
export class OpenRouterServerError extends OpenRouterError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.ExternalServiceError, message, 502, context)
    this.name = "OpenRouterServerError"
  }
}

/**
 * Thrown when model refuses request or content filter triggers.
 */
export class OpenRouterSafetyError extends OpenRouterError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.InvalidAIResponse, message, 422, context)
    this.name = "OpenRouterSafetyError"
  }
}

/**
 * Thrown when response doesn't match expected schema.
 */
export class OpenRouterSchemaError extends OpenRouterError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.InvalidAIResponse, message, 422, context)
    this.name = "OpenRouterSchemaError"
  }
}

/**
 * Thrown when streaming is interrupted.
 */
export class OpenRouterStreamError extends OpenRouterError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.ExternalServiceError, message, 500, context)
    this.name = "OpenRouterStreamError"
  }
}

/**
 * Thrown when response format is unexpected.
 */
export class OpenRouterUnexpectedResponseError extends OpenRouterError {
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.InvalidAIResponse, message, 502, context)
    this.name = "OpenRouterUnexpectedResponseError"
  }
}

