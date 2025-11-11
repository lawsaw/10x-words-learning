import { createClient } from "@/lib/supabase/server"
import type { ProfileDto, UpdateProfileCommand } from "@/lib/types"
import {
  mapSupabaseError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors"

/**
 * Service for managing user profile operations.
 */
export class ProfileService {
  /**
   * Retrieves the profile for the authenticated user.
   */
  static async getProfile(userId: string): Promise<ProfileDto> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .schema("app")
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error) {
      throw mapSupabaseError(error)
    }

    if (!data) {
      throw new NotFoundError("Profile")
    }

    return {
      userId: data.user_id,
      userLanguage: data.user_language_id,
      displayName: data.display_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  /**
   * Updates the profile for the authenticated user.
   * Note: userLanguage is immutable and cannot be changed.
   */
  static async updateProfile(
    userId: string,
    command: UpdateProfileCommand
  ): Promise<ProfileDto> {
    const supabase = await createClient()

    // Validate that at least one field is provided
    if (Object.keys(command).length === 0) {
      throw new ValidationError("No fields provided for update")
    }

    // Build update object (only include defined fields)
    const updateData: Record<string, any> = {}
    if (command.displayName !== undefined) {
      updateData.display_name = command.displayName
    }

    const { data, error } = await supabase
      .schema("app")
      .from("profiles")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      throw mapSupabaseError(error)
    }

    if (!data) {
      throw new NotFoundError("Profile")
    }

    return {
      userId: data.user_id,
      userLanguage: data.user_language_id,
      displayName: data.display_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }
}

