# OpenRouter Service

A comprehensive TypeScript service for integrating with the OpenRouter API in Next.js applications. This service provides structured communication with OpenRouter's LLM API, including request composition, HTTP transport, response parsing, error handling, and retry logic.

## Features

- ✅ **Type-safe API client** with full TypeScript support
- ✅ **Automatic retries** with exponential backoff and jitter
- ✅ **Comprehensive error handling** with specialized error classes
- ✅ **Message composition utilities** for normalizing chat messages
- ✅ **Schema validation** using Zod for structured outputs
- ✅ **Timeout management** with configurable limits
- ✅ **Optional logging and metrics** for observability
- ✅ **Edge runtime compatible** with pluggable fetch

## Installation

The OpenRouter service is already integrated into this project. Dependencies:

```json
{
  "zod": "^4.1.12"
}
```

## Quick Start

### Basic Usage

```typescript
import { OpenRouterService } from '@/lib/openrouter'

// Configure the service
const config = {
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'openai/gpt-4o-mini',
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  appTitle: 'YourApp',
}

// Create service instance
const service = new OpenRouterService(config)

// Send a chat request
const response = await service.sendChat({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
})

console.log(response.choices[0].message.content)
```

### Using MessageComposer

```typescript
import { MessageComposer } from '@/lib/openrouter'

// Create messages with helpers
const messages = [
  MessageComposer.createSystemMessage('You are a vocabulary tutor.'),
  MessageComposer.createUserMessage("Define 'lexicon'"),
]

// Normalize and validate messages
const normalized = MessageComposer.normalizeMessages(messages)

// Estimate token count
const tokenCount = MessageComposer.estimateTokenCount(messages)
console.log(`Estimated tokens: ${tokenCount}`)
```

### Structured Outputs with JSON Schema

```typescript
const response = await service.sendChat({
  messages: [
    { role: 'system', content: 'Generate vocabulary words in JSON.' },
    { role: 'user', content: 'Generate 3 Spanish words' },
  ],
  responseFormat: {
    type: 'json_schema',
    json_schema: {
      name: 'vocabulary_words',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          words: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                term: { type: 'string' },
                translation: { type: 'string' },
              },
              required: ['term', 'translation'],
            },
          },
        },
        required: ['words'],
      },
    },
  },
})
```

### Custom Parameters

```typescript
const response = await service.sendChat({
  messages: [{ role: 'user', content: 'Tell me a creative story.' }],
  parameters: {
    temperature: 0.9,
    top_p: 0.95,
    max_tokens: 1000,
  },
})
```

## Configuration

### OpenRouterConfig

```typescript
type OpenRouterConfig = {
  apiKey: string // Required: OpenRouter API key
  baseUrl: string // Required: API base URL
  defaultModel: string // Required: Default model to use
  defaultParams?: ModelParameters // Optional: Default parameters
  timeoutMs?: number // Optional: Request timeout (default: 30000)
  appUrl?: string // Optional: Your app URL for OpenRouter headers
  appTitle?: string // Optional: Your app title for OpenRouter headers
}
```

### OpenRouterOptions

```typescript
type OpenRouterOptions = {
  fetchImpl?: typeof fetch // Optional: Custom fetch implementation
  logger?: {
    // Optional: Logging interface
    info: (message: string, meta?: any) => void
    warn: (message: string, meta?: any) => void
    error: (message: string, meta?: any) => void
  }
  metricsClient?: {
    // Optional: Metrics interface
    recordMetric: (event: string, meta: any) => void
  }
}
```

## Error Handling

The service throws specialized error classes for different failure scenarios:

```typescript
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
} from '@/lib/openrouter'

try {
  const response = await service.sendChat({ messages })
} catch (error) {
  if (error instanceof OpenRouterRateLimitError) {
    console.log(`Rate limited. Retry after: ${error.retryAfter}s`)
  } else if (error instanceof OpenRouterNetworkError) {
    console.log(`Network error. Retryable: ${error.retryable}`)
  } else if (error instanceof OpenRouterAuthError) {
    console.log('Authentication failed')
  }
  // ... handle other error types
}
```

### Error Types

| Error Class                         | When Thrown                      | HTTP Status |
| ----------------------------------- | -------------------------------- | ----------- |
| `OpenRouterConfigurationError`      | Missing/invalid configuration    | 500         |
| `OpenRouterValidationError`         | Request validation fails         | 400         |
| `OpenRouterNetworkError`            | Network failure or timeout       | 503         |
| `OpenRouterAuthError`               | Authentication failure (401/403) | 401         |
| `OpenRouterRateLimitError`          | Rate limit exceeded (429)        | 429         |
| `OpenRouterServerError`             | Server error (>= 500)            | 502         |
| `OpenRouterSafetyError`             | Content filter triggered         | 422         |
| `OpenRouterSchemaError`             | Response doesn't match schema    | 422         |
| `OpenRouterUnexpectedResponseError` | Unexpected response format       | 502         |

## Advanced Features

### Retry Logic

The service automatically retries failed requests with exponential backoff:

- **Max retries**: 3 attempts
- **Initial delay**: 1000ms
- **Max delay**: 10000ms
- **Jitter**: Random 0-1000ms added to prevent thundering herd

Retries are performed for:

- Network errors (timeout, connection failures)
- Rate limit errors (429)
- Server errors (>= 500)

### Request Timeout

Default timeout is 30 seconds, configurable via `timeoutMs`:

```typescript
const config = {
  // ... other config
  timeoutMs: 60000, // 60 seconds
}
```

### Logging

Provide a logger to track service operations:

```typescript
const service = new OpenRouterService(config, {
  logger: {
    info: (msg, meta) => console.log(`[INFO] ${msg}`, meta),
    warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta),
  },
})
```

### Metrics

Track usage metrics by providing a metrics client:

```typescript
const service = new OpenRouterService(config, {
  metricsClient: {
    recordMetric: (event, meta) => {
      // Send to your metrics service (e.g., Supabase, DataDog)
      console.log(`Metric: ${event}`, meta)
    },
  },
})
```

Emitted metrics:

- `chat_completion_success`: Successful completions
- `chat_completion_failure`: Failed completions

## Usage in Next.js

### Server-Side (API Route)

```typescript
// app/api/chat/route.ts
import { OpenRouterService } from '@/lib/openrouter'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    const config = {
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'openai/gpt-4o-mini',
    }

    const service = new OpenRouterService(config)
    const response = await service.sendChat({ messages })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}
```

### Server Action

```typescript
// app/actions/chat.ts
'use server'

import { OpenRouterService } from '@/lib/openrouter'

export async function chatAction(userMessage: string) {
  const config = {
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
  }

  const service = new OpenRouterService(config)

  const response = await service.sendChat({
    messages: [{ role: 'user', content: userMessage }],
  })

  return response.choices[0].message.content
}
```

## Integration Example: AI Generation Service

See `lib/services/ai-generation.service.ts` for a real-world example of using OpenRouterService to generate vocabulary words with structured outputs.

## API Reference

### OpenRouterService

#### Methods

##### `sendChat(input: ChatRequest): Promise<ChatResponse>`

Sends a chat completion request.

**Parameters:**

- `input.messages`: Array of chat messages
- `input.model?`: Model override
- `input.parameters?`: Model parameters (temperature, top_p, etc.)
- `input.responseFormat?`: Structured output format
- `input.signal?`: AbortSignal for cancellation

**Returns:** Promise resolving to ChatResponse

##### `streamChat(input: ChatRequest): Promise<ReadableStream<ChatChunk>>`

Sends a streaming chat completion request.

##### `getDefaultConfig(): Readonly<OpenRouterConfig>`

Returns read-only configuration snapshot.

### MessageComposer

#### Static Methods

- `normalizeMessages(messages: ChatMessage[]): ChatMessage[]`
- `composeWithSystem(userMessages: ChatMessage[], systemMessage?: string): ChatMessage[]`
- `estimateTokenCount(messages: ChatMessage[]): number`
- `truncateToTokenLimit(messages: ChatMessage[], maxTokens: number): ChatMessage[]`
- `createUserMessage(content: string): ChatMessage`
- `createSystemMessage(content: string): ChatMessage`
- `createAssistantMessage(content: string): ChatMessage`

### SchemaValidator

#### Static Methods

- `validateResponseFormat(responseFormat: ResponseFormatSchema): void`
- `validateJsonSchema(schema: JsonSchema): void`
- `validateDataAgainstSchema(data: unknown, jsonSchema: JsonSchema): void`
- `validateJsonResponse(content: string, jsonSchema?: JsonSchema): any`

## Security Considerations

1. **API Keys**: Store in server-only environment variables (`OPENROUTER_API_KEY`)
2. **Never expose** API keys in client bundles or logs
3. **Redact sensitive data** from logs and metrics
4. **Validate inputs** before sending to API
5. **Apply rate limiting** per user/session in your application
6. **Use HTTPS** for all requests (enforced by OpenRouter)

## Best Practices

1. **Reuse service instances** within request lifecycle
2. **Handle errors gracefully** and provide user-friendly messages
3. **Log errors** with context but redact sensitive data
4. **Monitor token usage** to control costs
5. **Use structured outputs** when you need consistent response formats
6. **Set appropriate timeouts** based on your use case
7. **Test with retry logic** to ensure resilience

## Troubleshooting

### Common Issues

**"OpenRouter API key is required"**

- Ensure `OPENROUTER_API_KEY` is set in your environment

**"Request timed out"**

- Increase `timeoutMs` in configuration
- Check network connectivity

**"Rate limit exceeded"**

- Implement request throttling in your application
- Use the `retryAfter` value from `OpenRouterRateLimitError`

**"Schema validation failed"**

- Verify your JSON schema is valid
- Check that the model supports structured outputs

## License

Part of the 10xWordsLearning project.
