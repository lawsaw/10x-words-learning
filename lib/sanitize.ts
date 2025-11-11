/**
 * Markdown sanitization utilities to prevent XSS attacks.
 * 
 * This is a basic implementation. For production, consider using
 * libraries like 'dompurify' or 'marked' with proper sanitization.
 */

/**
 * Sanitizes markdown content by removing potentially dangerous HTML.
 * Currently performs basic sanitization - can be enhanced with a proper library.
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) {
    return ""
  }

  // Remove script tags and their content
  let sanitized = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, "")

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "")

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, "")

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")

  // Remove object and embed tags
  sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, "")

  // Basic HTML entity encoding for remaining dangerous characters
  // Note: This is basic - a proper markdown parser should be used in production
  
  return sanitized.trim()
}

/**
 * Validates markdown length constraints.
 */
export function validateMarkdownLength(
  markdown: string,
  maxLength: number
): boolean {
  return markdown.length <= maxLength
}

/**
 * Strips all HTML tags from markdown, leaving only text content.
 * Useful for preview or plain text extraction.
 */
export function stripHtmlTags(markdown: string): string {
  if (!markdown) {
    return ""
  }

  return markdown.replace(/<[^>]*>/g, "").trim()
}

/**
 * Truncates markdown to a specified length while trying to preserve words.
 */
export function truncateMarkdown(
  markdown: string,
  maxLength: number,
  suffix: string = "..."
): string {
  if (!markdown || markdown.length <= maxLength) {
    return markdown
  }

  const truncated = markdown.substring(0, maxLength - suffix.length)
  const lastSpace = truncated.lastIndexOf(" ")

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + suffix
  }

  return truncated + suffix
}

