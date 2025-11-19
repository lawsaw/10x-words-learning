import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  registerCommandSchema,
  loginCommandSchema,
  languagesQuerySchema,
  updateProfileCommandSchema,
  learningLanguagesQuerySchema,
  createLearningLanguageCommandSchema,
  deleteLearningLanguageParamsSchema,
  categoriesQuerySchema,
  createCategoryCommandSchema,
  updateCategoryCommandSchema,
  categoryParamsSchema,
  learningLanguageParamsSchema,
  categoryWordsQuerySchema,
  searchWordsQuerySchema,
  createWordCommandSchema,
  updateWordCommandSchema,
  wordParamsSchema,
  generateWordsCommandSchema,
  vocabularyOverviewQuerySchema,
  testResetCommandSchema,
} from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('registerCommandSchema', () => {
    it('should validate correct registration data', () => {
      // Arrange
      const validData = {
        email: 'user@example.com',
        password: 'password123',
        userLanguage: 'en',
      }

      // Act
      const result = registerCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject invalid email format', () => {
      // Arrange
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
        userLanguage: 'en',
      }

      // Act
      const result = registerCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email')
      }
    })

    it('should reject password shorter than 6 characters', () => {
      // Arrange
      const invalidData = {
        email: 'user@example.com',
        password: '12345',
        userLanguage: 'en',
      }

      // Act
      const result = registerCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters')
      }
    })

    it('should validate language code with country variant', () => {
      // Arrange
      const validData = {
        email: 'user@example.com',
        password: 'password123',
        userLanguage: 'en-US',
      }

      // Act
      const result = registerCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid language code format', () => {
      // Arrange
      const invalidData = {
        email: 'user@example.com',
        password: 'password123',
        userLanguage: 'english',
      }

      // Act
      const result = registerCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid language code format')
      }
    })

    it('should reject language code that is too short', () => {
      // Arrange
      const invalidData = {
        email: 'user@example.com',
        password: 'password123',
        userLanguage: 'e',
      }

      // Act
      const result = registerCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should accept 3-letter language codes', () => {
      // Arrange
      const validData = {
        email: 'user@example.com',
        password: 'password123',
        userLanguage: 'eng',
      }

      // Act
      const result = registerCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject missing required fields', () => {
      // Arrange
      const invalidData = {
        email: 'user@example.com',
      }

      // Act
      const result = registerCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('loginCommandSchema', () => {
    it('should validate correct login data', () => {
      // Arrange
      const validData = {
        email: 'user@example.com',
        password: 'anypassword',
      }

      // Act
      const result = loginCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        password: 'password',
      }

      // Act
      const result = loginCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      // Arrange
      const invalidData = {
        email: 'user@example.com',
        password: '',
      }

      // Act
      const result = loginCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required')
      }
    })

    it('should accept any non-empty password', () => {
      // Arrange
      const validData = {
        email: 'user@example.com',
        password: '1',
      }

      // Act
      const result = loginCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe('languagesQuerySchema', () => {
    it('should validate with registration scope', () => {
      // Arrange
      const validData = { scope: 'registration' }

      // Act
      const result = languagesQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate with learning scope', () => {
      // Arrange
      const validData = { scope: 'learning' }

      // Act
      const result = languagesQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate with no scope (optional)', () => {
      // Arrange
      const validData = {}

      // Act
      const result = languagesQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid scope value', () => {
      // Arrange
      const invalidData = { scope: 'invalid' }

      // Act
      const result = languagesQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('updateProfileCommandSchema', () => {
    it('should validate with displayName', () => {
      // Arrange
      const validData = { displayName: 'John Doe' }

      // Act
      const result = updateProfileCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate with no displayName (optional)', () => {
      // Arrange
      const validData = {}

      // Act
      const result = updateProfileCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject empty displayName', () => {
      // Arrange
      const invalidData = { displayName: '' }

      // Act
      const result = updateProfileCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should reject displayName longer than 100 characters', () => {
      // Arrange
      const invalidData = { displayName: 'a'.repeat(101) }

      // Act
      const result = updateProfileCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should accept displayName exactly 100 characters', () => {
      // Arrange
      const validData = { displayName: 'a'.repeat(100) }

      // Act
      const result = updateProfileCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe('learningLanguagesQuerySchema', () => {
    it('should apply default values', () => {
      // Arrange
      const input = {}

      // Act
      const result = learningLanguagesQuerySchema.parse(input)

      // Assert
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.includeStats).toBe(false)
    })

    it('should coerce page number from string', () => {
      // Arrange
      const input = { page: '5' }

      // Act
      const result = learningLanguagesQuerySchema.parse(input)

      // Assert
      expect(result.page).toBe(5)
    })

    it('should reject page less than 1', () => {
      // Arrange
      const invalidData = { page: 0 }

      // Act
      const result = learningLanguagesQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should reject pageSize less than 1', () => {
      // Arrange
      const invalidData = { pageSize: 0 }

      // Act
      const result = learningLanguagesQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should reject pageSize greater than 50', () => {
      // Arrange
      const invalidData = { pageSize: 51 }

      // Act
      const result = learningLanguagesQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should accept pageSize exactly 50', () => {
      // Arrange
      const validData = { pageSize: 50 }

      // Act
      const result = learningLanguagesQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should transform includeStats from string "true" to boolean', () => {
      // Arrange
      const input = { includeStats: 'true' }

      // Act
      const result = learningLanguagesQuerySchema.parse(input)

      // Assert
      expect(result.includeStats).toBe(true)
      expect(typeof result.includeStats).toBe('boolean')
    })

    it('should transform includeStats from string "false" to boolean', () => {
      // Arrange
      const input = { includeStats: 'false' }

      // Act
      const result = learningLanguagesQuerySchema.parse(input)

      // Assert
      expect(result.includeStats).toBe(false)
    })

    it('should accept boolean includeStats', () => {
      // Arrange
      const input = { includeStats: true }

      // Act
      const result = learningLanguagesQuerySchema.parse(input)

      // Assert
      expect(result.includeStats).toBe(true)
    })

    it('should validate optional cursor', () => {
      // Arrange
      const validData = { cursor: 'some-cursor-string' }

      // Act
      const result = learningLanguagesQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe('createLearningLanguageCommandSchema', () => {
    it('should validate correct language ID', () => {
      // Arrange
      const validData = { languageId: 'en' }

      // Act
      const result = createLearningLanguageCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid language code format', () => {
      // Arrange
      const invalidData = { languageId: 'invalid-code' }

      // Act
      const result = createLearningLanguageCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('deleteLearningLanguageParamsSchema', () => {
    it('should validate correct UUID', () => {
      // Arrange
      const validData = { learningLanguageId: '123e4567-e89b-12d3-a456-426614174000' }

      // Act
      const result = deleteLearningLanguageParamsSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID format', () => {
      // Arrange
      const invalidData = { learningLanguageId: 'not-a-uuid' }

      // Act
      const result = deleteLearningLanguageParamsSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid UUID format')
      }
    })

    it('should reject empty string', () => {
      // Arrange
      const invalidData = { learningLanguageId: '' }

      // Act
      const result = deleteLearningLanguageParamsSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('categoriesQuerySchema', () => {
    it('should apply default values', () => {
      // Arrange
      const input = {}

      // Act
      const result = categoriesQuerySchema.parse(input)

      // Assert
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.orderBy).toBe('createdAt')
      expect(result.direction).toBe('desc')
    })

    it('should validate search parameter', () => {
      // Arrange
      const validData = { search: 'travel' }

      // Act
      const result = categoriesQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject search longer than 150 characters', () => {
      // Arrange
      const invalidData = { search: 'a'.repeat(151) }

      // Act
      const result = categoriesQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should validate orderBy name', () => {
      // Arrange
      const validData = { orderBy: 'name' }

      // Act
      const result = categoriesQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid orderBy value', () => {
      // Arrange
      const invalidData = { orderBy: 'invalid' }

      // Act
      const result = categoriesQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should validate direction asc', () => {
      // Arrange
      const validData = { direction: 'asc' }

      // Act
      const result = categoriesQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid direction', () => {
      // Arrange
      const invalidData = { direction: 'ascending' }

      // Act
      const result = categoriesQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('createCategoryCommandSchema', () => {
    it('should validate correct category name', () => {
      // Arrange
      const validData = { name: 'Travel Vocabulary' }

      // Act
      const result = createCategoryCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      // Arrange
      const invalidData = { name: '' }

      // Act
      const result = createCategoryCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Category name is required')
      }
    })

    it('should reject name longer than 150 characters', () => {
      // Arrange
      const invalidData = { name: 'a'.repeat(151) }

      // Act
      const result = createCategoryCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Category name must be at most 150 characters')
      }
    })

    it('should accept name exactly 150 characters', () => {
      // Arrange
      const validData = { name: 'a'.repeat(150) }

      // Act
      const result = createCategoryCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe('updateCategoryCommandSchema', () => {
    it('should validate correct category name', () => {
      // Arrange
      const validData = { name: 'Updated Category' }

      // Act
      const result = updateCategoryCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      // Arrange
      const invalidData = { name: '' }

      // Act
      const result = updateCategoryCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('categoryParamsSchema', () => {
    it('should validate correct UUID', () => {
      // Arrange
      const validData = { categoryId: '123e4567-e89b-12d3-a456-426614174000' }

      // Act
      const result = categoryParamsSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      // Arrange
      const invalidData = { categoryId: 'not-a-uuid' }

      // Act
      const result = categoryParamsSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('learningLanguageParamsSchema', () => {
    it('should validate correct UUID', () => {
      // Arrange
      const validData = { learningLanguageId: '123e4567-e89b-12d3-a456-426614174000' }

      // Act
      const result = learningLanguageParamsSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      // Arrange
      const invalidData = { learningLanguageId: 'invalid' }

      // Act
      const result = learningLanguageParamsSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('categoryWordsQuerySchema', () => {
    it('should apply default values', () => {
      // Arrange
      const input = {}

      // Act
      const result = categoryWordsQuerySchema.parse(input)

      // Assert
      expect(result.view).toBe('table')
      expect(result.orderBy).toBe('createdAt')
      expect(result.direction).toBe('desc')
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
    })

    it('should validate slider view', () => {
      // Arrange
      const validData = { view: 'slider' }

      // Act
      const result = categoryWordsQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate random orderBy', () => {
      // Arrange
      const validData = { orderBy: 'random' }

      // Act
      const result = categoryWordsQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate term orderBy', () => {
      // Arrange
      const validData = { orderBy: 'term' }

      // Act
      const result = categoryWordsQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should enforce pageSize limit for table view (max 50)', () => {
      // Arrange
      const invalidData = { view: 'table', pageSize: 51 }

      // Act
      const result = categoryWordsQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Page size must be ≤50 for table view, ≤100 for slider view'
        )
      }
    })

    it('should allow pageSize 50 for table view', () => {
      // Arrange
      const validData = { view: 'table', pageSize: 50 }

      // Act
      const result = categoryWordsQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should enforce pageSize limit for slider view (max 100)', () => {
      // Arrange
      const invalidData = { view: 'slider', pageSize: 101 }

      // Act
      const result = categoryWordsQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        // The base validation (max 100) triggers before the custom refine
        expect(result.error.issues[0].message).toContain('100')
      }
    })

    it('should allow pageSize 100 for slider view', () => {
      // Arrange
      const validData = { view: 'slider', pageSize: 100 }

      // Act
      const result = categoryWordsQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should allow pageSize 51 for slider view but not table', () => {
      // Arrange
      const sliderData = { view: 'slider', pageSize: 51 }
      const tableData = { view: 'table', pageSize: 51 }

      // Act
      const sliderResult = categoryWordsQuerySchema.safeParse(sliderData)
      const tableResult = categoryWordsQuerySchema.safeParse(tableData)

      // Assert
      expect(sliderResult.success).toBe(true)
      expect(tableResult.success).toBe(false)
    })

    it('should validate optional cursor', () => {
      // Arrange
      const validData = { cursor: 'cursor-string' }

      // Act
      const result = categoryWordsQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe('searchWordsQuerySchema', () => {
    it('should apply default values', () => {
      // Arrange
      const input = {}

      // Act
      const result = searchWordsQuerySchema.parse(input)

      // Assert
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.orderBy).toBe('createdAt')
      expect(result.direction).toBe('desc')
    })

    it('should validate optional learningLanguageId', () => {
      // Arrange
      const validData = { learningLanguageId: '123e4567-e89b-12d3-a456-426614174000' }

      // Act
      const result = searchWordsQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate optional categoryId', () => {
      // Arrange
      const validData = { categoryId: '123e4567-e89b-12d3-a456-426614174000' }

      // Act
      const result = searchWordsQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate search parameter', () => {
      // Arrange
      const validData = { search: 'hello' }

      // Act
      const result = searchWordsQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject search longer than 200 characters', () => {
      // Arrange
      const invalidData = { search: 'a'.repeat(201) }

      // Act
      const result = searchWordsQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should not allow random orderBy (only createdAt and term)', () => {
      // Arrange
      const invalidData = { orderBy: 'random' }

      // Act
      const result = searchWordsQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('createWordCommandSchema', () => {
    it('should validate correct word data', () => {
      // Arrange
      const validData = {
        term: 'hello',
        translation: 'hola',
        examplesMd: 'Example usage',
      }

      // Act
      const result = createWordCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should apply default empty string to examplesMd', () => {
      // Arrange
      const input = {
        term: 'hello',
        translation: 'hola',
      }

      // Act
      const result = createWordCommandSchema.parse(input)

      // Assert
      expect(result.examplesMd).toBe('')
    })

    it('should reject empty term', () => {
      // Arrange
      const invalidData = {
        term: '',
        translation: 'hola',
      }

      // Act
      const result = createWordCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Term is required')
      }
    })

    it('should reject term longer than 500 characters', () => {
      // Arrange
      const invalidData = {
        term: 'a'.repeat(501),
        translation: 'hola',
      }

      // Act
      const result = createWordCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Term is too long')
      }
    })

    it('should reject empty translation', () => {
      // Arrange
      const invalidData = {
        term: 'hello',
        translation: '',
      }

      // Act
      const result = createWordCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Translation is required')
      }
    })

    it('should reject translation longer than 500 characters', () => {
      // Arrange
      const invalidData = {
        term: 'hello',
        translation: 'a'.repeat(501),
      }

      // Act
      const result = createWordCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Translation is too long')
      }
    })

    it('should reject examplesMd longer than 2000 characters', () => {
      // Arrange
      const invalidData = {
        term: 'hello',
        translation: 'hola',
        examplesMd: 'a'.repeat(2001),
      }

      // Act
      const result = createWordCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Examples are too long')
      }
    })

    it('should accept examplesMd exactly 2000 characters', () => {
      // Arrange
      const validData = {
        term: 'hello',
        translation: 'hola',
        examplesMd: 'a'.repeat(2000),
      }

      // Act
      const result = createWordCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe('updateWordCommandSchema', () => {
    it('should validate with only term', () => {
      // Arrange
      const validData = { term: 'updated' }

      // Act
      const result = updateWordCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate with only translation', () => {
      // Arrange
      const validData = { translation: 'updated translation' }

      // Act
      const result = updateWordCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate with only examplesMd', () => {
      // Arrange
      const validData = { examplesMd: 'new examples' }

      // Act
      const result = updateWordCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate with multiple fields', () => {
      // Arrange
      const validData = {
        term: 'updated',
        translation: 'updated translation',
      }

      // Act
      const result = updateWordCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject empty object (no fields provided)', () => {
      // Arrange
      const invalidData = {}

      // Act
      const result = updateWordCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one field must be provided')
      }
    })

    it('should handle explicitly undefined fields (Zod behavior)', () => {
      // Arrange
      const data = {
        term: undefined,
        translation: undefined,
      }

      // Act
      const result = updateWordCommandSchema.safeParse(data)

      // Assert
      // Note: Zod optional() fields strip undefined values during parsing
      // Since all fields are optional, undefined values are valid and stripped
      // Only a completely empty object {} triggers the refine error
      expect(result.success).toBe(true)
    })

    it('should reject empty term when provided', () => {
      // Arrange
      const invalidData = { term: '' }

      // Act
      const result = updateWordCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should reject term longer than 500 characters', () => {
      // Arrange
      const invalidData = { term: 'a'.repeat(501) }

      // Act
      const result = updateWordCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('wordParamsSchema', () => {
    it('should validate correct UUID', () => {
      // Arrange
      const validData = { wordId: '123e4567-e89b-12d3-a456-426614174000' }

      // Act
      const result = wordParamsSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      // Arrange
      const invalidData = { wordId: 'not-a-uuid' }

      // Act
      const result = wordParamsSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('generateWordsCommandSchema', () => {
    it('should validate with all required fields', () => {
      // Arrange
      const validData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      // Arrange
      const input = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
      }

      // Act
      const result = generateWordsCommandSchema.parse(input)

      // Assert
      expect(result.difficulty).toBe('medium')
      expect(result.temperature).toBe(0.7)
      expect(result.count).toBe(1)
    })

    it('should validate difficulty levels', () => {
      // Arrange
      const difficulties = ['easy', 'medium', 'advanced']

      // Act & Assert
      difficulties.forEach(difficulty => {
        const data = {
          learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
          userLanguage: 'en',
          difficulty,
        }
        const result = generateWordsCommandSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid difficulty', () => {
      // Arrange
      const invalidData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        difficulty: 'hard',
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should validate temperature boundaries', () => {
      // Arrange
      const validData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        temperature: 0.5,
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject temperature less than 0', () => {
      // Arrange
      const invalidData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        temperature: -0.1,
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should reject temperature greater than 1', () => {
      // Arrange
      const invalidData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        temperature: 1.1,
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should accept temperature 0 and 1 (boundaries)', () => {
      // Arrange
      const data1 = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        temperature: 0,
      }
      const data2 = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        temperature: 1,
      }

      // Act
      const result1 = generateWordsCommandSchema.safeParse(data1)
      const result2 = generateWordsCommandSchema.safeParse(data2)

      // Assert
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })

    it('should only accept count of 1', () => {
      // Arrange
      const validData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        count: 1,
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject count other than 1', () => {
      // Arrange
      const invalidData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        count: 5,
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should validate excludeTerms array', () => {
      // Arrange
      const validData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        excludeTerms: ['hello', 'world'],
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject excludeTerms array with more than 100 items', () => {
      // Arrange
      const invalidData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        excludeTerms: Array(101).fill('word'),
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should reject excludeTerms with empty strings', () => {
      // Arrange
      const invalidData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        excludeTerms: ['valid', ''],
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should reject excludeTerms with items longer than 500 characters', () => {
      // Arrange
      const invalidData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        excludeTerms: ['a'.repeat(501)],
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should validate categoryContext', () => {
      // Arrange
      const validData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        categoryContext: 'Travel vocabulary',
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject categoryContext longer than 500 characters', () => {
      // Arrange
      const invalidData = {
        learningLanguageId: '123e4567-e89b-12d3-a456-426614174000',
        userLanguage: 'en',
        categoryContext: 'a'.repeat(501),
      }

      // Act
      const result = generateWordsCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('vocabularyOverviewQuerySchema', () => {
    it('should apply default values', () => {
      // Arrange
      const input = {}

      // Act
      const result = vocabularyOverviewQuerySchema.parse(input)

      // Assert
      expect(result.orderBy).toBe('createdAt')
      expect(result.direction).toBe('desc')
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('should validate optional learningLanguageId', () => {
      // Arrange
      const validData = { learningLanguageId: '123e4567-e89b-12d3-a456-426614174000' }

      // Act
      const result = vocabularyOverviewQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate optional categoryId', () => {
      // Arrange
      const validData = { categoryId: '123e4567-e89b-12d3-a456-426614174000' }

      // Act
      const result = vocabularyOverviewQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate orderBy values', () => {
      // Arrange
      const validValues = ['createdAt', 'category', 'language']

      // Act & Assert
      validValues.forEach(orderBy => {
        const result = vocabularyOverviewQuerySchema.safeParse({ orderBy })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid orderBy', () => {
      // Arrange
      const invalidData = { orderBy: 'invalid' }

      // Act
      const result = vocabularyOverviewQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })

    it('should accept pageSize up to 100', () => {
      // Arrange
      const validData = { pageSize: 100 }

      // Act
      const result = vocabularyOverviewQuerySchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject pageSize greater than 100', () => {
      // Arrange
      const invalidData = { pageSize: 101 }

      // Act
      const result = vocabularyOverviewQuerySchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('testResetCommandSchema', () => {
    it('should validate with admin token', () => {
      // Arrange
      const validData = { adminToken: 'secret-token-123' }

      // Act
      const result = testResetCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject empty admin token', () => {
      // Arrange
      const invalidData = { adminToken: '' }

      // Act
      const result = testResetCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Admin token is required')
      }
    })

    it('should reject missing admin token', () => {
      // Arrange
      const invalidData = {}

      // Act
      const result = testResetCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('Integration: Complex validation scenarios', () => {
    it('should handle URL query string coercion', () => {
      // Arrange - Simulating query params from URL (all strings)
      const queryParams = {
        page: '2',
        pageSize: '25',
        direction: 'asc',
      }

      // Act
      const result = categoriesQuerySchema.parse(queryParams)

      // Assert
      expect(result.page).toBe(2)
      expect(result.pageSize).toBe(25)
      expect(typeof result.page).toBe('number')
      expect(typeof result.pageSize).toBe('number')
    })

    it('should validate nested complex schema for word creation', () => {
      // Arrange
      const validData = {
        term: 'bonjour',
        translation: 'hello',
        examplesMd:
          '**Example:** Bonjour, comment allez-vous?\n\n_Translation:_ Hello, how are you?',
      }

      // Act
      const result = createWordCommandSchema.safeParse(validData)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.examplesMd).toContain('**Example:**')
      }
    })

    it('should properly chain validation errors', () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        userLanguage: 'invalid-code',
      }

      // Act
      const result = registerCommandSchema.safeParse(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1) // Multiple validation errors
      }
    })
  })
})
