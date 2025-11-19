import type { ErrorResponseDto } from './types'

/**
 * Domain error codes mapped to HTTP status codes and messages.
 */
export enum ErrorCode {
  // Client errors (4xx)
  InvalidInput = 'InvalidInput',
  Unauthorized = 'Unauthorized',
  Forbidden = 'Forbidden',
  NotFound = 'NotFound',
  Conflict = 'Conflict',
  DuplicateLanguage = 'DuplicateLanguage',
  DuplicateCategory = 'DuplicateCategory',
  DuplicateWord = 'DuplicateWord',
  ValidationError = 'ValidationError',
  InvalidAIResponse = 'InvalidAIResponse',
  RateLimited = 'RateLimited',

  // Server errors (5xx)
  InternalError = 'InternalError',
  ExternalServiceError = 'ExternalServiceError',
}

/**
 * Base domain error class for consistent error handling.
 */
export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'DomainError'
    Object.setPrototypeOf(this, DomainError.prototype)
  }

  toJSON(): ErrorResponseDto {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    }
  }
}

/**
 * Specific domain error classes for common scenarios.
 */
export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.ValidationError, message, 400, details)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Authentication required') {
    super(ErrorCode.Unauthorized, message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Access forbidden') {
    super(ErrorCode.Forbidden, message, 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string = 'Resource') {
    super(ErrorCode.NotFound, `${resource} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, code: ErrorCode = ErrorCode.Conflict) {
    super(code, message, 409)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends DomainError {
  constructor(message: string = 'Rate limit exceeded') {
    super(ErrorCode.RateLimited, message, 429)
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends DomainError {
  constructor(service: string, message?: string) {
    super(ErrorCode.ExternalServiceError, message || `External service error: ${service}`, 502)
    this.name = 'ExternalServiceError'
  }
}

/**
 * Maps Supabase PostgREST errors to domain errors.
 */
export function mapSupabaseError(error: any): DomainError {
  // Handle unique constraint violations
  if (error.code === '23505') {
    const constraint = error.constraint || ''
    if (constraint.includes('user_learning_languages')) {
      return new ConflictError(
        'You are already learning this language',
        ErrorCode.DuplicateLanguage
      )
    }
    if (constraint.includes('categories')) {
      return new ConflictError(
        'A category with this name already exists',
        ErrorCode.DuplicateCategory
      )
    }
    if (constraint.includes('words')) {
      return new ConflictError(
        'A word with this term already exists in this category',
        ErrorCode.DuplicateWord
      )
    }
    return new ConflictError('Duplicate entry detected')
  }

  // Handle foreign key violations
  if (error.code === '23503') {
    return new ValidationError('Referenced resource does not exist')
  }

  // Handle RLS policy violations (403)
  if (error.code === 'PGRST301' || error.message?.includes('policy')) {
    return new ForbiddenError('You do not have permission to access this resource')
  }

  // Handle not found from PostgREST
  if (error.code === 'PGRST116' || error.status === 404) {
    return new NotFoundError()
  }

  // Default to internal error
  return new DomainError(ErrorCode.InternalError, 'An unexpected error occurred', 500, error)
}

/**
 * Centralizes error response creation for consistent API responses.
 */
export function createErrorResponse(error: unknown): { body: ErrorResponseDto; status: number } {
  // Handle known domain errors
  if (error instanceof DomainError) {
    return {
      body: error.toJSON(),
      status: error.statusCode,
    }
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> }
    const messages = zodError.issues.map(issue => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    return {
      body: {
        error: {
          code: ErrorCode.ValidationError,
          message: messages.join('; '),
        },
      },
      status: 400,
    }
  }

  // Log unexpected errors and return generic message
  console.error('Unexpected error:', error)
  return {
    body: {
      error: {
        code: ErrorCode.InternalError,
        message: 'An unexpected error occurred',
      },
    },
    status: 500,
  }
}
