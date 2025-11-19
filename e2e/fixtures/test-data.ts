/**
 * Test data and fixtures for E2E tests
 */

export const testUsers = {
  valid: {
    email: 'test@example.com',
    password: 'ValidPassword123!',
    name: 'Test User',
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'WrongPassword',
  },
}

export const testCategories = {
  technology: {
    name: 'Technology',
    description: 'Tech-related vocabulary',
  },
  business: {
    name: 'Business',
    description: 'Business vocabulary',
  },
}

export const testWords = {
  word1: {
    word: 'algorithm',
    translation: 'algorytm',
    definition: 'A step-by-step procedure for solving a problem',
    examples: ['The algorithm efficiently sorts the data.', 'We need to optimize this algorithm.'],
  },
  word2: {
    word: 'database',
    translation: 'baza danych',
    definition: 'An organized collection of data',
    examples: [
      'The database stores all user information.',
      'We migrated to a new database system.',
    ],
  },
}
