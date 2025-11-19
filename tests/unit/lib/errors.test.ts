import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ErrorCode,
  DomainError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  mapSupabaseError,
  createErrorResponse,
} from '@/lib/errors'
import type { ErrorResponseDto } from '@/lib/types'

describe('Error Handling', () => {
  describe('DomainError', () => {
    it('should create a domain error with all properties', () => {
      // Arrange
      const code = ErrorCode.InternalError
      const message = 'Something went wrong'
      const statusCode = 500
      const details = { extra: 'info' }

      // Act
      const error = new DomainError(code, message, statusCode, details)

      // Assert
      expect(error.code).toBe(ErrorCode.InternalError)
      expect(error.message).toBe('Something went wrong')
      expect(error.statusCode).toBe(500)
      expect(error.details).toEqual({ extra: 'info' })
      expect(error.name).toBe('DomainError')
    })

    it('should use default status code 500 when not provided', () => {
      // Arrange
      const code = ErrorCode.InternalError
      const message = 'Error'

      // Act
      const error = new DomainError(code, message)

      // Assert
      expect(error.statusCode).toBe(500)
    })

    it('should serialize to JSON correctly', () => {
      // Arrange
      const error = new DomainError(ErrorCode.NotFound, 'Resource not found', 404)

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual<ErrorResponseDto>({
        error: {
          code: 'NotFound',
          message: 'Resource not found',
        },
      })
    })

    it('should not include details in JSON output', () => {
      // Arrange
      const error = new DomainError(ErrorCode.InternalError, 'Error', 500, { sensitive: 'data' })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).not.toHaveProperty('details')
      expect(json.error).not.toHaveProperty('details')
    })

    it('should be instanceof Error', () => {
      // Arrange
      const error = new DomainError(ErrorCode.InternalError, 'Error')

      // Assert
      expect(error instanceof Error).toBe(true)
      expect(error instanceof DomainError).toBe(true)
    })

    it('should have correct prototype chain', () => {
      // Arrange
      const error = new DomainError(ErrorCode.InternalError, 'Error')

      // Assert
      expect(Object.getPrototypeOf(error)).toBe(DomainError.prototype)
    })
  })

  describe('ValidationError', () => {
    it('should create validation error with correct defaults', () => {
      // Arrange
      const message = 'Invalid input'

      // Act
      const error = new ValidationError(message)

      // Assert
      expect(error.name).toBe('ValidationError')
      expect(error.code).toBe(ErrorCode.ValidationError)
      expect(error.message).toBe('Invalid input')
      expect(error.statusCode).toBe(400)
    })

    it('should include details when provided', () => {
      // Arrange
      const message = 'Invalid input'
      const details = { field: 'email', reason: 'invalid format' }

      // Act
      const error = new ValidationError(message, details)

      // Assert
      expect(error.details).toEqual(details)
    })

    it('should extend DomainError', () => {
      // Arrange
      const error = new ValidationError('Invalid')

      // Assert
      expect(error instanceof DomainError).toBe(true)
      expect(error.name).toBe('ValidationError')
    })

    it('should serialize to JSON correctly', () => {
      // Arrange
      const error = new ValidationError('Invalid email format')

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual<ErrorResponseDto>({
        error: {
          code: 'ValidationError',
          message: 'Invalid email format',
        },
      })
    })
  })

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with default message', () => {
      // Act
      const error = new UnauthorizedError()

      // Assert
      expect(error.name).toBe('UnauthorizedError')
      expect(error.code).toBe(ErrorCode.Unauthorized)
      expect(error.message).toBe('Authentication required')
      expect(error.statusCode).toBe(401)
    })

    it('should create unauthorized error with custom message', () => {
      // Arrange
      const customMessage = 'Invalid token'

      // Act
      const error = new UnauthorizedError(customMessage)

      // Assert
      expect(error.message).toBe('Invalid token')
      expect(error.statusCode).toBe(401)
    })

    it('should extend DomainError', () => {
      // Arrange
      const error = new UnauthorizedError()

      // Assert
      expect(error instanceof DomainError).toBe(true)
      expect(error.name).toBe('UnauthorizedError')
    })
  })

  describe('ForbiddenError', () => {
    it('should create forbidden error with default message', () => {
      // Act
      const error = new ForbiddenError()

      // Assert
      expect(error.name).toBe('ForbiddenError')
      expect(error.code).toBe(ErrorCode.Forbidden)
      expect(error.message).toBe('Access forbidden')
      expect(error.statusCode).toBe(403)
    })

    it('should create forbidden error with custom message', () => {
      // Arrange
      const customMessage = 'Insufficient permissions'

      // Act
      const error = new ForbiddenError(customMessage)

      // Assert
      expect(error.message).toBe('Insufficient permissions')
      expect(error.statusCode).toBe(403)
    })
  })

  describe('NotFoundError', () => {
    it('should create not found error with default resource name', () => {
      // Act
      const error = new NotFoundError()

      // Assert
      expect(error.name).toBe('NotFoundError')
      expect(error.code).toBe(ErrorCode.NotFound)
      expect(error.message).toBe('Resource not found')
      expect(error.statusCode).toBe(404)
    })

    it('should create not found error with custom resource name', () => {
      // Arrange
      const resource = 'User'

      // Act
      const error = new NotFoundError(resource)

      // Assert
      expect(error.message).toBe('User not found')
      expect(error.statusCode).toBe(404)
    })

    it('should work with different resource names', () => {
      // Arrange
      const resources = ['Category', 'Word', 'Learning Language']

      // Act & Assert
      resources.forEach(resource => {
        const error = new NotFoundError(resource)
        expect(error.message).toBe(`${resource} not found`)
      })
    })
  })

  describe('ConflictError', () => {
    it('should create conflict error with default error code', () => {
      // Arrange
      const message = 'Resource already exists'

      // Act
      const error = new ConflictError(message)

      // Assert
      expect(error.name).toBe('ConflictError')
      expect(error.code).toBe(ErrorCode.Conflict)
      expect(error.message).toBe('Resource already exists')
      expect(error.statusCode).toBe(409)
    })

    it('should create conflict error with custom error code', () => {
      // Arrange
      const message = 'Duplicate language'
      const code = ErrorCode.DuplicateLanguage

      // Act
      const error = new ConflictError(message, code)

      // Assert
      expect(error.code).toBe(ErrorCode.DuplicateLanguage)
      expect(error.message).toBe('Duplicate language')
      expect(error.statusCode).toBe(409)
    })

    it('should work with all conflict-related error codes', () => {
      // Arrange
      const conflictCodes = [
        ErrorCode.Conflict,
        ErrorCode.DuplicateLanguage,
        ErrorCode.DuplicateCategory,
        ErrorCode.DuplicateWord,
      ]

      // Act & Assert
      conflictCodes.forEach(code => {
        const error = new ConflictError('Conflict', code)
        expect(error.code).toBe(code)
        expect(error.statusCode).toBe(409)
      })
    })
  })

  describe('RateLimitError', () => {
    it('should create rate limit error with default message', () => {
      // Act
      const error = new RateLimitError()

      // Assert
      expect(error.name).toBe('RateLimitError')
      expect(error.code).toBe(ErrorCode.RateLimited)
      expect(error.message).toBe('Rate limit exceeded')
      expect(error.statusCode).toBe(429)
    })

    it('should create rate limit error with custom message', () => {
      // Arrange
      const customMessage = 'Too many requests, try again in 60 seconds'

      // Act
      const error = new RateLimitError(customMessage)

      // Assert
      expect(error.message).toBe('Too many requests, try again in 60 seconds')
      expect(error.statusCode).toBe(429)
    })
  })

  describe('ExternalServiceError', () => {
    it('should create external service error with service name', () => {
      // Arrange
      const service = 'OpenAI'

      // Act
      const error = new ExternalServiceError(service)

      // Assert
      expect(error.name).toBe('ExternalServiceError')
      expect(error.code).toBe(ErrorCode.ExternalServiceError)
      expect(error.message).toBe('External service error: OpenAI')
      expect(error.statusCode).toBe(502)
    })

    it('should create external service error with custom message', () => {
      // Arrange
      const service = 'OpenAI'
      const customMessage = 'OpenAI API rate limit exceeded'

      // Act
      const error = new ExternalServiceError(service, customMessage)

      // Assert
      expect(error.message).toBe('OpenAI API rate limit exceeded')
      expect(error.statusCode).toBe(502)
    })

    it('should handle different service names', () => {
      // Arrange
      const services = ['Supabase', 'Stripe', 'SendGrid']

      // Act & Assert
      services.forEach(service => {
        const error = new ExternalServiceError(service)
        expect(error.message).toContain(service)
      })
    })
  })

  describe('mapSupabaseError', () => {
    describe('Unique Constraint Violations (23505)', () => {
      it('should map user_learning_languages constraint to DuplicateLanguage', () => {
        // Arrange
        const supabaseError = {
          code: '23505',
          constraint: 'user_learning_languages_unique',
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result instanceof DomainError).toBe(true)
        expect(result.name).toBe('ConflictError')
        expect(result.code).toBe(ErrorCode.DuplicateLanguage)
        expect(result.message).toBe('You are already learning this language')
        expect(result.statusCode).toBe(409)
      })

      it('should map categories constraint to DuplicateCategory', () => {
        // Arrange
        const supabaseError = {
          code: '23505',
          constraint: 'categories_name_unique',
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result instanceof DomainError).toBe(true)
        expect(result.name).toBe('ConflictError')
        expect(result.code).toBe(ErrorCode.DuplicateCategory)
        expect(result.message).toBe('A category with this name already exists')
        expect(result.statusCode).toBe(409)
      })

      it('should map words constraint to DuplicateWord', () => {
        // Arrange
        const supabaseError = {
          code: '23505',
          constraint: 'words_term_unique',
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result instanceof DomainError).toBe(true)
        expect(result.name).toBe('ConflictError')
        expect(result.code).toBe(ErrorCode.DuplicateWord)
        expect(result.message).toBe('A word with this term already exists in this category')
        expect(result.statusCode).toBe(409)
      })

      it('should map unknown 23505 constraint to generic Conflict', () => {
        // Arrange
        const supabaseError = {
          code: '23505',
          constraint: 'unknown_constraint',
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result instanceof DomainError).toBe(true)
        expect(result.name).toBe('ConflictError')
        expect(result.code).toBe(ErrorCode.Conflict)
        expect(result.message).toBe('Duplicate entry detected')
        expect(result.statusCode).toBe(409)
      })

      it('should handle 23505 without constraint field', () => {
        // Arrange
        const supabaseError = {
          code: '23505',
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result instanceof DomainError).toBe(true)
        expect(result.name).toBe('ConflictError')
        expect(result.message).toBe('Duplicate entry detected')
      })
    })

    describe('Foreign Key Violations (23503)', () => {
      it('should map foreign key violation to ValidationError', () => {
        // Arrange
        const supabaseError = {
          code: '23503',
          message: 'Foreign key constraint violation',
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result instanceof DomainError).toBe(true)
        expect(result.name).toBe('ValidationError')
        expect(result.code).toBe(ErrorCode.ValidationError)
        expect(result.message).toBe('Referenced resource does not exist')
        expect(result.statusCode).toBe(400)
      })
    })

    describe('RLS Policy Violations', () => {
      it('should map PGRST301 to ForbiddenError', () => {
        // Arrange
        const supabaseError = {
          code: 'PGRST301',
          message: 'Row level security policy violation',
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result instanceof DomainError).toBe(true)
        expect(result.name).toBe('ForbiddenError')
        expect(result.code).toBe(ErrorCode.Forbidden)
        expect(result.message).toBe('You do not have permission to access this resource')
        expect(result.statusCode).toBe(403)
      })

      it('should map policy error by message content', () => {
        // Arrange
        const supabaseError = {
          code: 'UNKNOWN',
          message: 'RLS policy violation detected',
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result instanceof DomainError).toBe(true)
        expect(result.name).toBe('ForbiddenError')
        expect(result.message).toBe('You do not have permission to access this resource')
      })
    })

    describe('Not Found Errors', () => {
      it('should map PGRST116 to NotFoundError', () => {
        // Arrange
        const supabaseError = {
          code: 'PGRST116',
          message: 'Resource not found',
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result instanceof DomainError).toBe(true)
        expect(result.name).toBe('NotFoundError')
        expect(result.code).toBe(ErrorCode.NotFound)
        expect(result.message).toBe('Resource not found')
        expect(result.statusCode).toBe(404)
      })

      it('should map status 404 to NotFoundError', () => {
        // Arrange
        const supabaseError = {
          status: 404,
          message: 'Not found',
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result instanceof DomainError).toBe(true)
        expect(result.name).toBe('NotFoundError')
        expect(result.statusCode).toBe(404)
      })
    })

    describe('Default Error Handling', () => {
      it('should map unknown error to InternalError', () => {
        // Arrange
        const supabaseError = {
          code: 'UNKNOWN_CODE',
          message: 'Something unexpected happened',
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result instanceof DomainError).toBe(true)
        expect(result.code).toBe(ErrorCode.InternalError)
        expect(result.message).toBe('An unexpected error occurred')
        expect(result.statusCode).toBe(500)
        expect(result.details).toEqual(supabaseError)
      })

      it('should handle error without code', () => {
        // Arrange
        const supabaseError = {
          message: 'Database error',
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result.code).toBe(ErrorCode.InternalError)
        expect(result.statusCode).toBe(500)
      })

      it('should handle error with null/undefined fields', () => {
        // Arrange
        const supabaseError = {
          code: null,
          message: undefined,
          constraint: null,
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result.code).toBe(ErrorCode.InternalError)
      })

      it('should preserve original error as details', () => {
        // Arrange
        const supabaseError = {
          code: 'CUSTOM_ERROR',
          data: { extra: 'info' },
        }

        // Act
        const result = mapSupabaseError(supabaseError)

        // Assert
        expect(result.details).toEqual(supabaseError)
      })
    })
  })

  describe('createErrorResponse', () => {
    // Mock console.error to avoid noise in test output
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
    })

    describe('DomainError Handling', () => {
      it('should create response from ValidationError', () => {
        // Arrange
        const error = new ValidationError('Invalid email format')

        // Act
        const response = createErrorResponse(error)

        // Assert
        expect(response.status).toBe(400)
        expect(response.body).toEqual<ErrorResponseDto>({
          error: {
            code: 'ValidationError',
            message: 'Invalid email format',
          },
        })
      })

      it('should create response from UnauthorizedError', () => {
        // Arrange
        const error = new UnauthorizedError('Invalid token')

        // Act
        const response = createErrorResponse(error)

        // Assert
        expect(response.status).toBe(401)
        expect(response.body.error.code).toBe('Unauthorized')
      })

      it('should create response from NotFoundError', () => {
        // Arrange
        const error = new NotFoundError('User')

        // Act
        const response = createErrorResponse(error)

        // Assert
        expect(response.status).toBe(404)
        expect(response.body.error.message).toBe('User not found')
      })

      it('should create response from ConflictError', () => {
        // Arrange
        const error = new ConflictError('Duplicate entry', ErrorCode.DuplicateCategory)

        // Act
        const response = createErrorResponse(error)

        // Assert
        expect(response.status).toBe(409)
        expect(response.body.error.code).toBe('DuplicateCategory')
      })

      it('should create response from RateLimitError', () => {
        // Arrange
        const error = new RateLimitError()

        // Act
        const response = createErrorResponse(error)

        // Assert
        expect(response.status).toBe(429)
        expect(response.body.error.code).toBe('RateLimited')
      })

      it('should create response from ExternalServiceError', () => {
        // Arrange
        const error = new ExternalServiceError('OpenAI', 'API timeout')

        // Act
        const response = createErrorResponse(error)

        // Assert
        expect(response.status).toBe(502)
        expect(response.body.error.code).toBe('ExternalServiceError')
        expect(response.body.error.message).toBe('API timeout')
      })
    })

    describe('Zod Error Handling', () => {
      it('should format single Zod validation error', () => {
        // Arrange
        const zodError = {
          issues: [
            {
              path: ['email'],
              message: 'Invalid email format',
            },
          ],
        }

        // Act
        const response = createErrorResponse(zodError)

        // Assert
        expect(response.status).toBe(400)
        expect(response.body).toEqual<ErrorResponseDto>({
          error: {
            code: 'ValidationError',
            message: 'email: Invalid email format',
          },
        })
      })

      it('should format multiple Zod validation errors', () => {
        // Arrange
        const zodError = {
          issues: [
            {
              path: ['email'],
              message: 'Invalid email format',
            },
            {
              path: ['password'],
              message: 'Password must be at least 6 characters',
            },
          ],
        }

        // Act
        const response = createErrorResponse(zodError)

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.error.code).toBe('ValidationError')
        expect(response.body.error.message).toBe(
          'email: Invalid email format; password: Password must be at least 6 characters'
        )
      })

      it('should format Zod error with nested path', () => {
        // Arrange
        const zodError = {
          issues: [
            {
              path: ['user', 'profile', 'name'],
              message: 'Name is required',
            },
          ],
        }

        // Act
        const response = createErrorResponse(zodError)

        // Assert
        expect(response.body.error.message).toBe('user.profile.name: Name is required')
      })

      it('should format Zod error without path', () => {
        // Arrange
        const zodError = {
          issues: [
            {
              path: [],
              message: 'Invalid data structure',
            },
          ],
        }

        // Act
        const response = createErrorResponse(zodError)

        // Assert
        expect(response.body.error.message).toBe('Invalid data structure')
      })

      it('should handle Zod error with array indices in path', () => {
        // Arrange
        const zodError = {
          issues: [
            {
              path: ['items', 0, 'name'],
              message: 'Name is required',
            },
          ],
        }

        // Act
        const response = createErrorResponse(zodError)

        // Assert
        expect(response.body.error.message).toBe('items.0.name: Name is required')
      })
    })

    describe('Unknown Error Handling', () => {
      it('should handle string error', () => {
        // Arrange
        const error = 'Something went wrong'

        // Act
        const response = createErrorResponse(error)

        // Assert
        expect(response.status).toBe(500)
        expect(response.body).toEqual<ErrorResponseDto>({
          error: {
            code: 'InternalError',
            message: 'An unexpected error occurred',
          },
        })
        expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected error:', error)
      })

      it('should handle null error', () => {
        // Arrange
        const error = null

        // Act
        const response = createErrorResponse(error)

        // Assert
        expect(response.status).toBe(500)
        expect(response.body.error.code).toBe('InternalError')
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      it('should handle undefined error', () => {
        // Arrange
        const error = undefined

        // Act
        const response = createErrorResponse(error)

        // Assert
        expect(response.status).toBe(500)
        expect(response.body.error.code).toBe('InternalError')
      })

      it('should handle Error instance', () => {
        // Arrange
        const error = new Error('Standard error')

        // Act
        const response = createErrorResponse(error)

        // Assert
        expect(response.status).toBe(500)
        expect(response.body.error.code).toBe('InternalError')
        expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected error:', error)
      })

      it('should handle object without issues property', () => {
        // Arrange
        const error = {
          someField: 'value',
          anotherField: 123,
        }

        // Act
        const response = createErrorResponse(error)

        // Assert
        expect(response.status).toBe(500)
        expect(response.body.error.code).toBe('InternalError')
      })

      it('should handle number error', () => {
        // Arrange
        const error = 404

        // Act
        const response = createErrorResponse(error)

        // Assert
        expect(response.status).toBe(500)
        expect(response.body.error.code).toBe('InternalError')
      })

      it('should log unexpected errors to console', () => {
        // Arrange
        const error = { unexpected: 'error object' }

        // Act
        createErrorResponse(error)

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected error:', error)
      })
    })
  })

  describe('Integration: Error Flow', () => {
    it('should handle Supabase duplicate error through full flow', () => {
      // Arrange
      const supabaseError = {
        code: '23505',
        constraint: 'user_learning_languages_unique',
      }

      // Act
      const domainError = mapSupabaseError(supabaseError)
      const response = createErrorResponse(domainError)

      // Assert
      expect(response.status).toBe(409)
      expect(response.body.error.code).toBe('DuplicateLanguage')
      expect(response.body.error.message).toBe('You are already learning this language')
    })

    it('should handle validation error through full flow', () => {
      // Arrange
      const validationError = new ValidationError('Invalid input', { field: 'email' })

      // Act
      const response = createErrorResponse(validationError)

      // Assert
      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('ValidationError')
      // Details should not be in response body
      expect(response.body).not.toHaveProperty('details')
    })

    it('should maintain error type through mapping chain', () => {
      // Arrange
      const supabaseError = {
        code: 'PGRST301',
        message: 'Permission denied',
      }

      // Act
      const mappedError = mapSupabaseError(supabaseError)

      // Assert
      expect(mappedError instanceof DomainError).toBe(true)
      expect(mappedError.name).toBe('ForbiddenError')
      expect(mappedError.code).toBe(ErrorCode.Forbidden)
      expect(mappedError.statusCode).toBe(403)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long error messages', () => {
      // Arrange
      const longMessage = 'Error '.repeat(1000)
      const error = new ValidationError(longMessage)

      // Act
      const response = createErrorResponse(error)

      // Assert
      expect(response.body.error.message).toBe(longMessage)
      expect(response.body.error.message.length).toBeGreaterThan(5000)
    })

    it('should handle special characters in error messages', () => {
      // Arrange
      const specialMessage = 'Error with <script>alert("xss")</script> & symbols'
      const error = new NotFoundError(specialMessage)

      // Act
      const response = createErrorResponse(error)

      // Assert
      expect(response.body.error.message).toContain('<script>')
      expect(response.body.error.message).toContain('&')
    })

    it('should handle circular references in error details', () => {
      // Arrange
      const circular: any = { name: 'test' }
      circular.self = circular
      const error = new DomainError(ErrorCode.InternalError, 'Error', 500, circular)

      // Act
      const response = createErrorResponse(error)

      // Assert
      expect(response.status).toBe(500)
      // Should not throw on circular reference
      expect(response.body.error.code).toBe('InternalError')
    })

    it('should handle empty Zod issues array', () => {
      // Arrange
      const zodError = {
        issues: [],
      }

      // Act
      const response = createErrorResponse(zodError)

      // Assert
      expect(response.status).toBe(400)
      expect(response.body.error.message).toBe('')
    })
  })
})
