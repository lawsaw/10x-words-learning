import type {
  PaginationMetaDto,
  CursorPaginationMetaDto,
  SortDirection,
} from "./types"

/**
 * Calculates pagination metadata for offset-based pagination.
 */
export function calculatePaginationMeta(
  page: number,
  pageSize: number,
  totalFetched: number
): PaginationMetaDto {
  return {
    page,
    pageSize,
    hasMore: totalFetched > pageSize,
  }
}

/**
 * Calculates cursor-based pagination metadata.
 */
export function calculateCursorPaginationMeta(
  page: number,
  pageSize: number,
  totalFetched: number,
  lastItemCursor?: string
): CursorPaginationMetaDto {
  return {
    page,
    pageSize,
    hasMore: totalFetched > pageSize,
    nextCursor: totalFetched > pageSize ? lastItemCursor || null : null,
  }
}

/**
 * Converts orderBy field name to database column name.
 */
export function mapOrderByToColumn(orderBy: string): string {
  const mapping: Record<string, string> = {
    createdAt: "created_at",
    updatedAt: "updated_at",
    learningLanguageId: "user_learning_language_id",
    categoryId: "category_id",
    userId: "user_id",
  }
  return mapping[orderBy] || orderBy
}

/**
 * Applies pagination and sorting to a Supabase query builder.
 */
export function applyPagination<T>(
  query: any,
  page: number,
  pageSize: number,
  orderBy?: string,
  direction: SortDirection = "desc"
): any {
  let paginatedQuery = query

  // Apply sorting if specified
  if (orderBy) {
    const column = mapOrderByToColumn(orderBy)
    paginatedQuery = paginatedQuery.order(column, { ascending: direction === "asc" })
  }

  // Fetch one extra item to determine if there are more results
  const offset = (page - 1) * pageSize
  paginatedQuery = paginatedQuery.range(offset, offset + pageSize)

  return paginatedQuery
}

/**
 * Trims fetched data to page size and determines if more items exist.
 */
export function trimToPageSize<T>(data: T[], pageSize: number): T[] {
  return data.slice(0, pageSize)
}

/**
 * Generates a cursor string from the last item in a result set.
 */
export function generateCursor(item: any, orderByField: string): string {
  const value = item[mapOrderByToColumn(orderByField)]
  return Buffer.from(JSON.stringify({ [orderByField]: value })).toString("base64")
}

/**
 * Parses a cursor string back into filter criteria.
 */
export function parseCursor(cursor: string): Record<string, any> | null {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8")
    return JSON.parse(decoded)
  } catch {
    return null
  }
}


