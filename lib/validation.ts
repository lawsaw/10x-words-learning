import { z } from "zod"
import type {
  CategoryOrderField,
  DifficultyLevel,
  SortDirection,
  VocabularyOverviewOrderField,
  WordOrderField,
  WordViewMode,
} from "./types"

/**
 * Shared validation primitives
 */
const uuidSchema = z.string().uuid("Invalid UUID format")
const languageCodeSchema = z
  .string()
  .min(2)
  .max(10)
  .regex(/^[a-z]{2,3}(-[A-Z]{2})?$/, "Invalid language code format")
const sortDirectionSchema = z.enum(["asc", "desc"]) as z.ZodType<SortDirection>
const pageSchema = z.coerce.number().int().min(1).default(1)
const emailSchema = z.string().email("Invalid email format")

/**
 * Auth validation schemas
 */
export const registerCommandSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
  userLanguage: languageCodeSchema,
})

export const loginCommandSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

/**
 * Languages validation schemas
 */
export const languagesQuerySchema = z.object({
  scope: z.enum(["registration", "learning"]).optional(),
})

/**
 * Profile validation schemas
 */
export const updateProfileCommandSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
})

/**
 * Learning Languages validation schemas
 */
export const learningLanguagesQuerySchema = z.object({
  page: pageSchema,
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  cursor: z.string().optional(),
  includeStats: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .optional()
    .default(false),
})

export const createLearningLanguageCommandSchema = z.object({
  languageId: languageCodeSchema,
})

export const deleteLearningLanguageParamsSchema = z.object({
  learningLanguageId: uuidSchema,
})

/**
 * Categories validation schemas
 */
export const categoriesQuerySchema = z.object({
  search: z.string().max(150).optional(),
  page: pageSchema,
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  orderBy: z
    .enum(["createdAt", "name"])
    .default("createdAt") as z.ZodType<CategoryOrderField>,
  direction: sortDirectionSchema.default("desc"),
})

export const createCategoryCommandSchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(150, "Category name must be at most 150 characters"),
})

export const updateCategoryCommandSchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(150, "Category name must be at most 150 characters"),
})

export const categoryParamsSchema = z.object({
  categoryId: uuidSchema,
})

export const learningLanguageParamsSchema = z.object({
  learningLanguageId: uuidSchema,
})

/**
 * Words validation schemas
 */
export const categoryWordsQuerySchema = z
  .object({
    view: z
      .enum(["table", "slider"])
      .default("table") as z.ZodType<WordViewMode>,
    orderBy: z
      .enum(["createdAt", "term", "random"])
      .default("createdAt") as z.ZodType<WordOrderField>,
    direction: sortDirectionSchema.default("desc"),
    page: pageSchema,
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    cursor: z.string().optional(),
  })
  .refine(
    (data) => {
      const maxSize = data.view === "table" ? 50 : 100
      return data.pageSize <= maxSize
    },
    {
      message: "Page size must be ≤50 for table view, ≤100 for slider view",
      path: ["pageSize"],
    }
  )

export const searchWordsQuerySchema = z.object({
  learningLanguageId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  search: z.string().max(200).optional(),
  page: pageSchema,
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  orderBy: z.enum(["createdAt", "term"]).default("createdAt"),
  direction: sortDirectionSchema.default("desc"),
  cursor: z.string().optional(),
})

export const createWordCommandSchema = z.object({
  term: z.string().min(1, "Term is required").max(500, "Term is too long"),
  translation: z
    .string()
    .min(1, "Translation is required")
    .max(500, "Translation is too long"),
  examplesMd: z
    .string()
    .max(2000, "Examples are too long")
    .optional()
    .default(""),
})

export const updateWordCommandSchema = z
  .object({
    term: z.string().min(1).max(500).optional(),
    translation: z.string().min(1).max(500).optional(),
    examplesMd: z.string().max(2000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })

export const wordParamsSchema = z.object({
  wordId: uuidSchema,
})

/**
 * AI Generation validation schemas
 */
export const generateWordsCommandSchema = z.object({
  learningLanguageId: uuidSchema,
  learningLanguageName: z.string().max(150).optional(),
  userLanguage: languageCodeSchema,
  userLanguageName: z.string().max(150).optional(),
  difficulty: z
    .enum(["easy", "medium", "advanced"])
    .optional()
    .default("medium") as z.ZodType<DifficultyLevel>,
  categoryContext: z.string().max(500).optional(),
  temperature: z.number().min(0).max(1).default(0.7),
  count: z.literal(1).default(1),
  excludeTerms: z.array(z.string().min(1).max(500)).max(100).optional(),
})

/**
 * Vocabulary Overview validation schemas
 */
export const vocabularyOverviewQuerySchema = z.object({
  learningLanguageId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  orderBy: z
    .enum(["createdAt", "category", "language"])
    .default("createdAt") as z.ZodType<VocabularyOverviewOrderField>,
  direction: sortDirectionSchema.default("desc"),
  page: pageSchema,
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * Testing validation schemas
 */
export const testResetCommandSchema = z.object({
  adminToken: z.string().min(1, "Admin token is required"),
})


