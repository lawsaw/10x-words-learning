import { createClient } from "@/lib/supabase/server"
import type {
  RegisterCommand,
  RegisterResponseDto,
  LoginCommand,
  LoginResponseDto,
  AuthSessionStatusDto,
  AuthUserDto,
  AuthSessionDto,
  ProfileDto,
} from "@/lib/types"
import {
  mapSupabaseError,
  ValidationError,
  UnauthorizedError,
  ConflictError,
} from "@/lib/errors"

/**
 * Service for managing authentication operations.
 */
export class AuthService {
  /**
   * Registers a new user, creates their profile, and returns session data.
   */
  static async register(
    command: RegisterCommand
  ): Promise<RegisterResponseDto> {
    const supabase = await createClient()

    // Validate that the user language exists
    const { data: languageExists, error: languageError } = await supabase
      .schema("app")
      .from("languages")
      .select("code")
      .eq("code", command.userLanguage)
      .single()

    if (languageError || !languageExists) {
      throw new ValidationError(
        `Language '${command.userLanguage}' is not available`
      )
    }

    // Create the user account via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: command.email,
      password: command.password,
    })
    
    if (authError) {
      // Handle duplicate email case
      if (authError.message?.toLowerCase().includes("already registered")) {
        throw new ConflictError("Email address is already registered")
      }

      const detailedMessage =
        authError.message || (authError as { error_description?: string }).error_description

      if (detailedMessage) {
        const normalized = detailedMessage.trim()
        if (normalized.toLowerCase().includes("password")) {
          throw new ValidationError(normalized)
        }
        if (authError.status === 400) {
          throw new ValidationError(normalized)
        }
      }
      throw mapSupabaseError(authError)
    }

    if (!authData.user || !authData.session) {
      throw new ValidationError("Failed to create user account")
    }

    // Create the user profile with the specified language
    const { data: profileData, error: profileError } = await supabase
      .schema("app")
      .from("profiles")
      .insert({
        user_id: authData.user.id,
        user_language_id: command.userLanguage,
      })
      .select()
      .single()

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      // but Supabase Auth doesn't easily allow that from client side
      // The profile creation should be handled by a database trigger or webhook
      throw mapSupabaseError(profileError)
    }

    const user: AuthUserDto = {
      id: authData.user.id,
      email: authData.user.email!,
    }

    const session: AuthSessionDto = {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresAt: authData.session.expires_at!,
    }

    const profile: ProfileDto = {
      userId: profileData.user_id,
      userLanguage: profileData.user_language_id,
      displayName: profileData.display_name,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
    }

    return {
      user,
      session,
      profile,
    }
  }

  /**
   * Authenticates a user with email and password.
   */
  static async login(command: LoginCommand): Promise<LoginResponseDto> {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: command.email,
      password: command.password,
    })

    if (error) {
      // Map auth errors to appropriate domain errors
      if (
        error.message?.toLowerCase().includes("invalid") ||
        error.message?.toLowerCase().includes("credentials")
      ) {
        throw new UnauthorizedError("Invalid email or password")
      }
      throw mapSupabaseError(error)
    }

    if (!data.user || !data.session) {
      throw new UnauthorizedError("Authentication failed")
    }

    const user: AuthUserDto = {
      id: data.user.id,
      email: data.user.email!,
    }

    const session: AuthSessionDto = {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at!,
    }

    return {
      user,
      session,
    }
  }

  /**
   * Logs out the current user by ending their session.
   */
  static async logout(): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw mapSupabaseError(error)
    }
  }

  /**
   * Retrieves the current session status for the authenticated user.
   */
  static async getSessionStatus(): Promise<AuthSessionStatusDto> {
    const supabase = await createClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      throw mapSupabaseError(error)
    }

    if (!session) {
      return {
        session: null,
      }
    }

    return {
      session: {
        userId: session.user.id,
        accessTokenExpiresAt: session.expires_at!,
      },
    }
  }

  /**
   * Helper to get the current authenticated user ID or throw an error.
   */
  static async getCurrentUserId(): Promise<string> {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      throw new UnauthorizedError("Authentication required")
    }

    return user.id
  }
}

