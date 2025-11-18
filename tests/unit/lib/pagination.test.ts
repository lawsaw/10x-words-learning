import { describe, it, expect, vi } from 'vitest'
import {
  calculatePaginationMeta,
  calculateCursorPaginationMeta,
  mapOrderByToColumn,
  applyPagination,
  trimToPageSize,
  generateCursor,
  parseCursor,
} from '@/lib/pagination'
import type { PaginationMetaDto, CursorPaginationMetaDto } from '@/lib/types'

describe('Pagination Utilities', () => {
  describe('calculatePaginationMeta', () => {
    it('should return correct metadata when there are more items', () => {
      // Arrange
      const page = 1
      const pageSize = 10
      const totalFetched = 11 // Fetched one extra to check hasMore

      // Act
      const result = calculatePaginationMeta(page, pageSize, totalFetched)

      // Assert
      expect(result).toEqual<PaginationMetaDto>({
        page: 1,
        pageSize: 10,
        hasMore: true,
      })
    })

    it('should return correct metadata when there are no more items', () => {
      // Arrange
      const page = 1
      const pageSize = 10
      const totalFetched = 10

      // Act
      const result = calculatePaginationMeta(page, pageSize, totalFetched)

      // Assert
      expect(result).toEqual<PaginationMetaDto>({
        page: 1,
        pageSize: 10,
        hasMore: false,
      })
    })

    it('should handle when fewer items fetched than page size', () => {
      // Arrange
      const page = 3
      const pageSize = 20
      const totalFetched = 5

      // Act
      const result = calculatePaginationMeta(page, pageSize, totalFetched)

      // Assert
      expect(result).toEqual<PaginationMetaDto>({
        page: 3,
        pageSize: 20,
        hasMore: false,
      })
    })

    it('should handle edge case when totalFetched is zero', () => {
      // Arrange
      const page = 1
      const pageSize = 10
      const totalFetched = 0

      // Act
      const result = calculatePaginationMeta(page, pageSize, totalFetched)

      // Assert
      expect(result).toEqual<PaginationMetaDto>({
        page: 1,
        pageSize: 10,
        hasMore: false,
      })
    })

    it('should handle boundary case when totalFetched equals pageSize + 1', () => {
      // Arrange
      const page = 2
      const pageSize = 50
      const totalFetched = 51

      // Act
      const result = calculatePaginationMeta(page, pageSize, totalFetched)

      // Assert
      expect(result).toEqual<PaginationMetaDto>({
        page: 2,
        pageSize: 50,
        hasMore: true,
      })
    })

    it('should handle large page numbers', () => {
      // Arrange
      const page = 999
      const pageSize = 100
      const totalFetched = 15

      // Act
      const result = calculatePaginationMeta(page, pageSize, totalFetched)

      // Assert
      expect(result).toEqual<PaginationMetaDto>({
        page: 999,
        pageSize: 100,
        hasMore: false,
      })
    })
  })

  describe('calculateCursorPaginationMeta', () => {
    it('should return cursor when there are more items', () => {
      // Arrange
      const page = 1
      const pageSize = 10
      const totalFetched = 11
      const lastItemCursor = 'cursor123'

      // Act
      const result = calculateCursorPaginationMeta(page, pageSize, totalFetched, lastItemCursor)

      // Assert
      expect(result).toEqual<CursorPaginationMetaDto>({
        page: 1,
        pageSize: 10,
        hasMore: true,
        nextCursor: 'cursor123',
      })
    })

    it('should return null cursor when there are no more items', () => {
      // Arrange
      const page = 1
      const pageSize = 10
      const totalFetched = 10
      const lastItemCursor = 'cursor123'

      // Act
      const result = calculateCursorPaginationMeta(page, pageSize, totalFetched, lastItemCursor)

      // Assert
      expect(result).toEqual<CursorPaginationMetaDto>({
        page: 1,
        pageSize: 10,
        hasMore: false,
        nextCursor: null,
      })
    })

    it('should return null cursor when lastItemCursor is undefined', () => {
      // Arrange
      const page = 1
      const pageSize = 10
      const totalFetched = 11

      // Act
      const result = calculateCursorPaginationMeta(page, pageSize, totalFetched)

      // Assert
      expect(result).toEqual<CursorPaginationMetaDto>({
        page: 1,
        pageSize: 10,
        hasMore: true,
        nextCursor: null,
      })
    })

    it('should return null cursor when lastItemCursor is empty string and hasMore is true', () => {
      // Arrange
      const page = 1
      const pageSize = 10
      const totalFetched = 11
      const lastItemCursor = ''

      // Act
      const result = calculateCursorPaginationMeta(page, pageSize, totalFetched, lastItemCursor)

      // Assert
      expect(result).toEqual<CursorPaginationMetaDto>({
        page: 1,
        pageSize: 10,
        hasMore: true,
        nextCursor: null,
      })
    })

    it('should handle fewer items than page size with cursor', () => {
      // Arrange
      const page = 5
      const pageSize = 20
      const totalFetched = 3
      const lastItemCursor = 'cursor999'

      // Act
      const result = calculateCursorPaginationMeta(page, pageSize, totalFetched, lastItemCursor)

      // Assert
      expect(result).toEqual<CursorPaginationMetaDto>({
        page: 5,
        pageSize: 20,
        hasMore: false,
        nextCursor: null,
      })
    })
  })

  describe('mapOrderByToColumn', () => {
    it('should map camelCase field names to snake_case column names', () => {
      // Arrange & Act & Assert
      expect(mapOrderByToColumn('createdAt')).toBe('created_at')
      expect(mapOrderByToColumn('updatedAt')).toBe('updated_at')
      expect(mapOrderByToColumn('learningLanguageId')).toBe('user_learning_language_id')
      expect(mapOrderByToColumn('categoryId')).toBe('category_id')
      expect(mapOrderByToColumn('userId')).toBe('user_id')
    })

    it('should return the original value for unmapped fields', () => {
      // Arrange
      const unmappedField = 'customField'

      // Act
      const result = mapOrderByToColumn(unmappedField)

      // Assert
      expect(result).toBe('customField')
    })

    it('should handle empty string', () => {
      // Arrange
      const emptyField = ''

      // Act
      const result = mapOrderByToColumn(emptyField)

      // Assert
      expect(result).toBe('')
    })

    it('should pass through already snake_case column names', () => {
      // Arrange
      const snakeCaseColumn = 'created_at'

      // Act
      const result = mapOrderByToColumn(snakeCaseColumn)

      // Assert
      expect(result).toBe('created_at')
    })

    it('should handle arbitrary strings that are not in mapping', () => {
      // Arrange
      const arbitraryField = 'some_random_field_name'

      // Act
      const result = mapOrderByToColumn(arbitraryField)

      // Assert
      expect(result).toBe('some_random_field_name')
    })
  })

  describe('applyPagination', () => {
    it('should apply ordering and range with ascending direction', () => {
      // Arrange
      const mockQuery = {
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      const page = 1
      const pageSize = 10
      const orderBy = 'createdAt'
      const direction = 'asc' as const

      // Act
      applyPagination(mockQuery, page, pageSize, orderBy, direction)

      // Assert
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: true })
      expect(mockQuery.range).toHaveBeenCalledWith(0, 10)
    })

    it('should apply ordering and range with descending direction', () => {
      // Arrange
      const mockQuery = {
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      const page = 2
      const pageSize = 20
      const orderBy = 'updatedAt'
      const direction = 'desc' as const

      // Act
      applyPagination(mockQuery, page, pageSize, orderBy, direction)

      // Assert
      expect(mockQuery.order).toHaveBeenCalledWith('updated_at', { ascending: false })
      expect(mockQuery.range).toHaveBeenCalledWith(20, 40)
    })

    it('should use default descending direction when not specified', () => {
      // Arrange
      const mockQuery = {
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      const page = 1
      const pageSize = 10
      const orderBy = 'term'

      // Act
      applyPagination(mockQuery, page, pageSize, orderBy)

      // Assert
      expect(mockQuery.order).toHaveBeenCalledWith('term', { ascending: false })
      expect(mockQuery.range).toHaveBeenCalledWith(0, 10)
    })

    it('should skip ordering when orderBy is not provided', () => {
      // Arrange
      const mockQuery = {
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      const page = 1
      const pageSize = 15

      // Act
      applyPagination(mockQuery, page, pageSize)

      // Assert
      expect(mockQuery.order).not.toHaveBeenCalled()
      expect(mockQuery.range).toHaveBeenCalledWith(0, 15)
    })

    it('should calculate correct offset for page 3', () => {
      // Arrange
      const mockQuery = {
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      const page = 3
      const pageSize = 25

      // Act
      applyPagination(mockQuery, page, pageSize)

      // Assert
      // offset = (3 - 1) * 25 = 50
      // range: 50 to 75
      expect(mockQuery.range).toHaveBeenCalledWith(50, 75)
    })

    it('should handle large page numbers correctly', () => {
      // Arrange
      const mockQuery = {
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      const page = 100
      const pageSize = 10

      // Act
      applyPagination(mockQuery, page, pageSize)

      // Assert
      // offset = (100 - 1) * 10 = 990
      // range: 990 to 1000
      expect(mockQuery.range).toHaveBeenCalledWith(990, 1000)
    })

    it('should map complex orderBy fields correctly', () => {
      // Arrange
      const mockQuery = {
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }
      const page = 1
      const pageSize = 10
      const orderBy = 'learningLanguageId'

      // Act
      applyPagination(mockQuery, page, pageSize, orderBy)

      // Assert
      expect(mockQuery.order).toHaveBeenCalledWith('user_learning_language_id', {
        ascending: false,
      })
    })
  })

  describe('trimToPageSize', () => {
    it('should trim array to exact page size when array is larger', () => {
      // Arrange
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      const pageSize = 10

      // Act
      const result = trimToPageSize(data, pageSize)

      // Assert
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      expect(result).toHaveLength(10)
    })

    it('should return the full array when smaller than page size', () => {
      // Arrange
      const data = [1, 2, 3, 4, 5]
      const pageSize = 10

      // Act
      const result = trimToPageSize(data, pageSize)

      // Assert
      expect(result).toEqual([1, 2, 3, 4, 5])
      expect(result).toHaveLength(5)
    })

    it('should return the full array when equal to page size', () => {
      // Arrange
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const pageSize = 10

      // Act
      const result = trimToPageSize(data, pageSize)

      // Assert
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      expect(result).toHaveLength(10)
    })

    it('should handle empty array', () => {
      // Arrange
      const data: number[] = []
      const pageSize = 10

      // Act
      const result = trimToPageSize(data, pageSize)

      // Assert
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should handle array with objects', () => {
      // Arrange
      const data = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' },
      ]
      const pageSize = 2

      // Act
      const result = trimToPageSize(data, pageSize)

      // Assert
      expect(result).toEqual([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ])
      expect(result).toHaveLength(2)
    })

    it('should not mutate the original array', () => {
      // Arrange
      const data = [1, 2, 3, 4, 5]
      const pageSize = 3
      const originalLength = data.length

      // Act
      const result = trimToPageSize(data, pageSize)

      // Assert
      expect(data).toHaveLength(originalLength)
      expect(result).not.toBe(data) // Different reference
    })

    it('should handle page size of 1', () => {
      // Arrange
      const data = [1, 2, 3, 4, 5]
      const pageSize = 1

      // Act
      const result = trimToPageSize(data, pageSize)

      // Assert
      expect(result).toEqual([1])
      expect(result).toHaveLength(1)
    })

    it('should handle page size of 0', () => {
      // Arrange
      const data = [1, 2, 3]
      const pageSize = 0

      // Act
      const result = trimToPageSize(data, pageSize)

      // Assert
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })
  })

  describe('generateCursor', () => {
    it('should generate a base64 encoded cursor from item field', () => {
      // Arrange
      const item = {
        id: '123',
        created_at: '2024-01-15T10:30:00Z',
        name: 'Test',
      }
      const orderByField = 'createdAt'

      // Act
      const result = generateCursor(item, orderByField)

      // Assert
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
      // Verify it's valid base64
      expect(() => Buffer.from(result, 'base64')).not.toThrow()
    })

    it('should encode the correct field value in the cursor', () => {
      // Arrange
      const item = {
        id: '123',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-16T10:30:00Z',
      }
      const orderByField = 'createdAt'

      // Act
      const result = generateCursor(item, orderByField)
      const decoded = Buffer.from(result, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)

      // Assert
      expect(parsed).toEqual({
        createdAt: '2024-01-15T10:30:00Z',
      })
    })

    it('should map orderBy field before accessing item property', () => {
      // Arrange
      const item = {
        id: '456',
        user_learning_language_id: 'lang-123',
        name: 'Language',
      }
      const orderByField = 'learningLanguageId'

      // Act
      const result = generateCursor(item, orderByField)
      const decoded = Buffer.from(result, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)

      // Assert
      expect(parsed).toEqual({
        learningLanguageId: 'lang-123',
      })
    })

    it('should handle numeric values in cursor', () => {
      // Arrange
      const item = {
        id: 999,
        created_at: '2024-01-15T10:30:00Z',
      }
      const orderByField = 'id'

      // Act
      const result = generateCursor(item, orderByField)
      const decoded = Buffer.from(result, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)

      // Assert
      expect(parsed).toEqual({
        id: 999,
      })
    })

    it('should handle undefined field values', () => {
      // Arrange
      const item = {
        id: '123',
        name: 'Test',
      }
      const orderByField = 'createdAt'

      // Act
      const result = generateCursor(item, orderByField)
      const decoded = Buffer.from(result, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)

      // Assert
      expect(parsed).toEqual({
        createdAt: undefined,
      })
    })

    it('should generate different cursors for different field values', () => {
      // Arrange
      const item1 = { created_at: '2024-01-15T10:30:00Z' }
      const item2 = { created_at: '2024-01-16T10:30:00Z' }
      const orderByField = 'createdAt'

      // Act
      const cursor1 = generateCursor(item1, orderByField)
      const cursor2 = generateCursor(item2, orderByField)

      // Assert
      expect(cursor1).not.toBe(cursor2)
    })
  })

  describe('parseCursor', () => {
    it('should parse a valid cursor string', () => {
      // Arrange
      const data = { createdAt: '2024-01-15T10:30:00Z' }
      const cursor = Buffer.from(JSON.stringify(data)).toString('base64')

      // Act
      const result = parseCursor(cursor)

      // Assert
      expect(result).toEqual({
        createdAt: '2024-01-15T10:30:00Z',
      })
    })

    it('should return null for invalid base64 string', () => {
      // Arrange
      const invalidCursor = 'not-valid-base64-!@#$%'

      // Act
      const result = parseCursor(invalidCursor)

      // Assert
      expect(result).toBeNull()
    })

    it('should return null for valid base64 but invalid JSON', () => {
      // Arrange
      const invalidJson = Buffer.from('not valid json {{{').toString('base64')

      // Act
      const result = parseCursor(invalidJson)

      // Assert
      expect(result).toBeNull()
    })

    it('should return null for empty string', () => {
      // Arrange
      const emptyCursor = ''

      // Act
      const result = parseCursor(emptyCursor)

      // Assert
      expect(result).toBeNull()
    })

    it('should handle cursors with multiple fields', () => {
      // Arrange
      const data = {
        createdAt: '2024-01-15T10:30:00Z',
        id: '123',
        page: 5,
      }
      const cursor = Buffer.from(JSON.stringify(data)).toString('base64')

      // Act
      const result = parseCursor(cursor)

      // Assert
      expect(result).toEqual({
        createdAt: '2024-01-15T10:30:00Z',
        id: '123',
        page: 5,
      })
    })

    it('should handle cursors with numeric values', () => {
      // Arrange
      const data = { id: 999 }
      const cursor = Buffer.from(JSON.stringify(data)).toString('base64')

      // Act
      const result = parseCursor(cursor)

      // Assert
      expect(result).toEqual({ id: 999 })
    })

    it('should handle cursors with null values', () => {
      // Arrange
      const data = { createdAt: null }
      const cursor = Buffer.from(JSON.stringify(data)).toString('base64')

      // Act
      const result = parseCursor(cursor)

      // Assert
      expect(result).toEqual({ createdAt: null })
    })

    it('should round-trip with generateCursor', () => {
      // Arrange
      const item = {
        created_at: '2024-01-15T10:30:00Z',
        id: 'test-id-123',
      }
      const orderByField = 'createdAt'

      // Act
      const cursor = generateCursor(item, orderByField)
      const parsed = parseCursor(cursor)

      // Assert
      expect(parsed).toEqual({
        createdAt: '2024-01-15T10:30:00Z',
      })
    })

    it('should handle malformed cursor gracefully', () => {
      // Arrange
      const malformedCursor = 'SGVsbG8gV29ybGQh' // "Hello World!" in base64

      // Act
      const result = parseCursor(malformedCursor)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('Integration: Pagination workflow', () => {
    it('should work correctly for a complete pagination flow', () => {
      // Arrange - Simulate fetching 11 items for page size 10
      const mockData = Array.from({ length: 11 }, (_, i) => ({
        id: `id-${i}`,
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        term: `Term ${i}`,
      }))

      const page = 1
      const pageSize = 10

      // Act - Trim to page size
      const trimmedData = trimToPageSize(mockData, pageSize)

      // Act - Calculate pagination meta
      const meta = calculatePaginationMeta(page, pageSize, mockData.length)

      // Assert
      expect(trimmedData).toHaveLength(10)
      expect(meta.hasMore).toBe(true)
      expect(meta.page).toBe(1)
      expect(meta.pageSize).toBe(10)
    })

    it('should work correctly for cursor pagination flow', () => {
      // Arrange
      const mockData = Array.from({ length: 11 }, (_, i) => ({
        id: `id-${i}`,
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      }))

      const page = 1
      const pageSize = 10

      // Act - Trim data and get last item for cursor
      const trimmedData = trimToPageSize(mockData, pageSize)
      const lastItem = trimmedData[trimmedData.length - 1]
      const cursor = generateCursor(lastItem, 'createdAt')

      // Act - Calculate cursor pagination meta
      const meta = calculateCursorPaginationMeta(page, pageSize, mockData.length, cursor)

      // Assert
      expect(meta.hasMore).toBe(true)
      expect(meta.nextCursor).toBeTruthy()

      // Act - Parse cursor to verify it's valid
      const parsedCursor = parseCursor(meta.nextCursor!)

      // Assert
      expect(parsedCursor).toEqual({
        createdAt: lastItem.created_at,
      })
    })
  })
})

