import { createClient } from '@/lib/supabase/server'
import type { TestResetCommand } from '@/lib/types'
import { ForbiddenError, UnauthorizedError } from '@/lib/errors'

/**
 * Service for testing utilities - ONLY available in test environment.
 */
export class TestingResetService {
  /**
   * Resets the database to a clean state for testing.
   * ONLY works when NODE_ENV=test and with valid admin token.
   */
  static async resetDatabase(command: TestResetCommand): Promise<void> {
    // Guard: Only allow in test environment
    if (process.env.NODE_ENV !== 'test') {
      throw new ForbiddenError('Reset endpoint is only available in test environment')
    }

    // Guard: Validate admin token
    const adminToken = process.env.TEST_ADMIN_TOKEN
    if (!adminToken) {
      throw new ForbiddenError('Test admin token is not configured')
    }

    if (command.adminToken !== adminToken) {
      throw new UnauthorizedError('Invalid admin token')
    }

    const supabase = await createClient()

    // Delete data in reverse dependency order to avoid foreign key violations
    // Note: Due to RLS policies, we need to use service role or disable RLS temporarily
    // For test environments, the service role should be used

    try {
      // Delete words first (no dependencies)
      await supabase
        .schema('app')
        .from('words')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      // Delete categories (depends on words via cascade)
      await supabase
        .schema('app')
        .from('categories')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      // Delete learning languages (depends on categories via cascade)
      await supabase
        .schema('app')
        .from('user_learning_languages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      // Delete profiles (depends on learning languages via cascade)
      await supabase
        .schema('app')
        .from('profiles')
        .delete()
        .neq('user_id', '00000000-0000-0000-0000-000000000000')

      // Note: We don't delete auth.users directly as that should be handled
      // by Supabase Auth or manual cleanup. Deleting profiles will cascade
      // if foreign key constraints are set properly.

      console.log('Test database reset completed successfully')
    } catch (error) {
      console.error('Error during test database reset:', error)
      throw error
    }
  }
}
