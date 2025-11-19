import type { ChatMessage } from '@/lib/types'
import { OpenRouterValidationError } from './errors'

/**
 * Utility for composing and normalizing chat messages.
 */
export class MessageComposer {
  /**
   * Normalizes messages array, ensuring proper structure and UTF-8 encoding.
   * @param messages Raw messages to normalize
   * @returns Normalized messages
   * @throws {OpenRouterValidationError} If messages are invalid
   */
  static normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
    if (!messages || messages.length === 0) {
      throw new OpenRouterValidationError('Messages array cannot be empty')
    }

    return messages.map((msg, index) => {
      // Validate required fields
      if (!msg.role) {
        throw new OpenRouterValidationError(`Message at index ${index} is missing role`, {
          index,
          message: msg,
        })
      }

      if (!msg.content) {
        throw new OpenRouterValidationError(`Message at index ${index} is missing content`, {
          index,
          message: msg,
        })
      }

      // Validate UTF-8 encoding
      const content = this.validateAndNormalizeUtf8(msg.content, index)

      return {
        role: msg.role,
        content,
        ...(msg.name && { name: msg.name }),
      }
    })
  }

  /**
   * Validates and normalizes UTF-8 content.
   * @private
   */
  private static validateAndNormalizeUtf8(content: string, index: number): string {
    try {
      // Attempt to encode/decode to validate UTF-8
      const encoder = new TextEncoder()
      const decoder = new TextDecoder('utf-8', { fatal: true })
      const encoded = encoder.encode(content)
      return decoder.decode(encoded)
    } catch (error) {
      throw new OpenRouterValidationError(`Message at index ${index} contains invalid UTF-8`, {
        index,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Composes messages with optional system message prepended.
   * @param userMessages User and assistant messages
   * @param systemMessage Optional system message to prepend
   * @returns Composed messages with system message first if provided
   */
  static composeWithSystem(userMessages: ChatMessage[], systemMessage?: string): ChatMessage[] {
    const messages: ChatMessage[] = []

    if (systemMessage) {
      messages.push({
        role: 'system',
        content: systemMessage,
      })
    }

    messages.push(...userMessages)

    return this.normalizeMessages(messages)
  }

  /**
   * Estimates token count for messages (rough approximation).
   * Uses simple heuristic: ~4 characters per token for English text.
   * @param messages Messages to estimate tokens for
   * @returns Estimated token count
   */
  static estimateTokenCount(messages: ChatMessage[]): number {
    let totalChars = 0

    for (const message of messages) {
      // Count characters in content
      totalChars += message.content.length

      // Add overhead for role and structure (~10 tokens per message)
      totalChars += 40
    }

    // Rough estimation: 4 characters per token
    return Math.ceil(totalChars / 4)
  }

  /**
   * Truncates messages to fit within token limit.
   * Removes oldest user/assistant messages first, keeps system message.
   * @param messages Messages to truncate
   * @param maxTokens Maximum token count
   * @returns Truncated messages
   */
  static truncateToTokenLimit(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
    const systemMessages = messages.filter(m => m.role === 'system')
    const otherMessages = messages.filter(m => m.role !== 'system')

    // Always keep system messages
    const result = [...systemMessages]
    let currentTokens = this.estimateTokenCount(systemMessages)

    // Add other messages from end (most recent first)
    for (let i = otherMessages.length - 1; i >= 0; i--) {
      const message = otherMessages[i]
      const messageTokens = this.estimateTokenCount([message])

      if (currentTokens + messageTokens <= maxTokens) {
        result.push(message)
        currentTokens += messageTokens
      } else {
        break
      }
    }

    // Restore original order (system first, then chronological)
    return [...systemMessages, ...result.slice(systemMessages.length).reverse()]
  }

  /**
   * Creates a user message.
   */
  static createUserMessage(content: string): ChatMessage {
    return {
      role: 'user',
      content,
    }
  }

  /**
   * Creates a system message.
   */
  static createSystemMessage(content: string): ChatMessage {
    return {
      role: 'system',
      content,
    }
  }

  /**
   * Creates an assistant message.
   */
  static createAssistantMessage(content: string): ChatMessage {
    return {
      role: 'assistant',
      content,
    }
  }
}
