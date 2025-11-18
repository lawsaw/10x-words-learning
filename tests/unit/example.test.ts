import { describe, it, expect, vi } from 'vitest';

/**
 * Example unit test file
 * This demonstrates basic Vitest functionality
 */

describe('Example Unit Test Suite', () => {
  it('should perform basic arithmetic correctly', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
  });

  it('should work with objects', () => {
    const user = { name: 'John', age: 30 };
    expect(user).toEqual({ name: 'John', age: 30 });
    expect(user).toHaveProperty('name');
  });

  it('should demonstrate function mocking', () => {
    const mockFn = vi.fn((x: number) => x * 2);
    
    const result = mockFn(5);
    
    expect(result).toBe(10);
    expect(mockFn).toHaveBeenCalledWith(5);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should work with async operations', async () => {
    const fetchData = async () => {
      return Promise.resolve({ data: 'test' });
    };

    const result = await fetchData();
    expect(result).toEqual({ data: 'test' });
  });

  it('should demonstrate snapshot testing', () => {
    const data = {
      title: '10x Words Learning',
      version: '0.0.1',
      features: ['vocabulary', 'study', 'categories'],
    };

    expect(data).toMatchInlineSnapshot(`
      {
        "features": [
          "vocabulary",
          "study",
          "categories",
        ],
        "title": "10x Words Learning",
        "version": "0.0.1",
      }
    `);
  });
});

