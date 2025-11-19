/**
 * OpenRouter module - Reusable service for OpenRouter API integration.
 * Provides structured communication with OpenRouter's LLM API.
 */

export { OpenRouterService } from './service'
export { MessageComposer } from './message-composer'
export { SchemaValidator } from './schema-validator'

export {
  OpenRouterError,
  OpenRouterConfigurationError,
  OpenRouterValidationError,
  OpenRouterNetworkError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterServerError,
  OpenRouterSafetyError,
  OpenRouterSchemaError,
  OpenRouterStreamError,
  OpenRouterUnexpectedResponseError,
} from './errors'
