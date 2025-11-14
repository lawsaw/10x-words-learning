import { NextResponse } from "next/server"
import type { EmptyResponse } from "./types"
import { createErrorResponse } from "./errors"

/**
 * Helper to create standardized JSON responses.
 */
export function jsonResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

/**
 * Success response for GET requests.
 */
export function okResponse<T>(data: T): NextResponse<T> {
  return jsonResponse(data, 200)
}

/**
 * Success response for POST requests (resource created).
 */
export function createdResponse<T>(data: T): NextResponse<T> {
  return jsonResponse(data, 201)
}

/**
 * Success response for DELETE requests (no content).
 */
export function noContentResponse(): NextResponse<EmptyResponse> {
  return new NextResponse(null, { status: 204 })
}

/**
 * Error response handler that converts errors to standardized format.
 */
export function errorResponse(error: unknown): NextResponse {
  const { body, status } = createErrorResponse(error)
  if (status === 204) {
    return noContentResponse()
  }
  return jsonResponse(body, status)
}

/**
 * Omits undefined fields from objects for clean JSON serialization.
 */
export function omitUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>
}


