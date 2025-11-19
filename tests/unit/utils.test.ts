import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

/**
 * Example test for utility functions
 * Tests the cn (className) utility from lib/utils.ts
 */

describe('Utils - cn function', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toContain('text-red-500')
    expect(result).toContain('bg-blue-500')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toContain('base-class')
    expect(result).toContain('active-class')
  })

  it('should handle falsy values', () => {
    const result = cn('base-class', false && 'hidden-class', null, undefined)
    expect(result).toContain('base-class')
    expect(result).not.toContain('hidden-class')
  })

  it('should override conflicting Tailwind classes', () => {
    // tailwind-merge should keep the last class in case of conflicts
    const result = cn('p-4', 'p-6')
    expect(result).toContain('p-6')
    expect(result).not.toContain('p-4')
  })
})
