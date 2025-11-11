# 10xWordsLearning REST API Documentation

Complete REST API for the vocabulary learning workspace.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via Supabase session cookies. Authentication is established through the `/auth/register` or `/auth/login` endpoints.

---

## Environment Variables

Required environment variables (create a `.env.local` file):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OpenRouter AI Configuration (for word generation)
OPENROUTER_API_KEY=your-openrouter-api-key-here

# Testing Configuration (only for test environment)
NODE_ENV=development
TEST_ADMIN_TOKEN=your-secure-test-token-here
```

---

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "userLanguage": "english"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "accessToken": "token",
    "refreshToken": "token",
    "expiresAt": 1234567890
  },
  "profile": {
    "userId": "uuid",
    "userLanguage": "english",
    "displayName": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`

#### Logout
```http
POST /api/auth/logout
```

**Response:** `204 No Content`

#### Get Session Status
```http
GET /api/auth/session
```

**Response:** `200 OK`
```json
{
  "session": {
    "userId": "uuid",
    "accessTokenExpiresAt": 1234567890
  }
}
```

---

### Languages

#### List Languages
```http
GET /api/languages?scope=registration|learning
```

**Query Parameters:**
- `scope` (optional): Filter languages by scope

**Response:** `200 OK`
```json
{
  "languages": [
    {
      "code": "english",
      "name": "English"
    }
  ]
}
```

---

### Profile

#### Get Profile
```http
GET /api/profile
```

**Response:** `200 OK`
```json
{
  "userId": "uuid",
  "userLanguage": "english",
  "displayName": "John Doe",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Update Profile
```http
PATCH /api/profile
```

**Request Body:**
```json
{
  "displayName": "John Doe"
}
```

**Response:** `200 OK`

---

### Learning Languages

#### List Learning Languages
```http
GET /api/learning-languages?page=1&pageSize=10&includeStats=true
```

**Query Parameters:**
- `page` (optional, default: 1)
- `pageSize` (optional, default: 10, max: 50)
- `cursor` (optional): Cursor for pagination
- `includeStats` (optional, default: false): Include category/word counts

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "languageId": "german",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "stats": {
        "categories": 5,
        "words": 120
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "hasMore": false,
    "nextCursor": null
  }
}
```

#### Create Learning Language
```http
POST /api/learning-languages
```

**Request Body:**
```json
{
  "languageId": "german"
}
```

**Response:** `201 Created`

#### Delete Learning Language
```http
DELETE /api/learning-languages/{learningLanguageId}
```

**Response:** `204 No Content`

---

### Categories

#### List Categories
```http
GET /api/learning-languages/{learningLanguageId}/categories?search=food&page=1&pageSize=10&orderBy=name&direction=asc
```

**Query Parameters:**
- `search` (optional): Search by category name
- `page` (optional, default: 1)
- `pageSize` (optional, default: 10, max: 50)
- `orderBy` (optional, default: createdAt): `createdAt` | `name`
- `direction` (optional, default: desc): `asc` | `desc`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "learningLanguageId": "uuid",
      "name": "Food & Drinks",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "wordCount": 25
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "hasMore": false
  }
}
```

#### Create Category
```http
POST /api/learning-languages/{learningLanguageId}/categories
```

**Request Body:**
```json
{
  "name": "Food & Drinks"
}
```

**Response:** `201 Created`

#### Update Category
```http
PATCH /api/categories/{categoryId}
```

**Request Body:**
```json
{
  "name": "Food & Beverages"
}
```

**Response:** `200 OK`

#### Delete Category
```http
DELETE /api/categories/{categoryId}
```

**Response:** `204 No Content`

---

### Words

#### List Category Words
```http
GET /api/categories/{categoryId}/words?view=table&orderBy=term&direction=asc&page=1&pageSize=20
```

**Query Parameters:**
- `view` (optional, default: table): `table` | `slider`
- `orderBy` (optional, default: createdAt): `createdAt` | `term` | `random`
- `direction` (optional, default: desc): `asc` | `desc`
- `page` (optional, default: 1)
- `pageSize` (optional, default: 10, max: 50 for table, 100 for slider)
- `cursor` (optional): Cursor for pagination

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "learningLanguageId": "uuid",
      "categoryId": "uuid",
      "term": "Brot",
      "translation": "bread",
      "examplesMd": "- Ich esse Brot zum Frühstück\n- Das Brot ist frisch",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "hasMore": false,
    "nextCursor": null,
    "view": "table",
    "orderBy": "term",
    "direction": "asc"
  }
}
```

#### Global Word Search
```http
GET /api/words?search=bread&learningLanguageId=uuid&categoryId=uuid&page=1&pageSize=10
```

**Query Parameters:**
- `learningLanguageId` (optional): Filter by learning language
- `categoryId` (optional): Filter by category
- `search` (optional): Search in term and translation
- `page` (optional, default: 1)
- `pageSize` (optional, default: 10, max: 50)
- `orderBy` (optional, default: createdAt): `createdAt` | `term`
- `direction` (optional, default: desc): `asc` | `desc`
- `cursor` (optional): Cursor for pagination

**Response:** `200 OK`

#### Get Word Detail
```http
GET /api/words/{wordId}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "learningLanguageId": "uuid",
  "categoryId": "uuid",
  "term": "Brot",
  "translation": "bread",
  "examplesMd": "- Ich esse Brot zum Frühstück",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Create Word
```http
POST /api/categories/{categoryId}/words
```

**Request Body:**
```json
{
  "term": "Brot",
  "translation": "bread",
  "examplesMd": "- Ich esse Brot zum Frühstück\n- Das Brot ist frisch"
}
```

**Response:** `201 Created`

#### Update Word
```http
PATCH /api/words/{wordId}
```

**Request Body (at least one field required):**
```json
{
  "term": "Brot",
  "translation": "bread",
  "examplesMd": "- Updated example"
}
```

**Response:** `200 OK`

#### Delete Word
```http
DELETE /api/words/{wordId}
```

**Response:** `204 No Content`

---

### AI Generation

#### Generate Word Suggestions
```http
POST /api/categories/{categoryId}/words/ai-generate
```

**Request Body:**
```json
{
  "learningLanguageId": "uuid",
  "userLanguage": "english",
  "difficulty": "medium",
  "categoryContext": "Food and cooking vocabulary",
  "temperature": 0.7,
  "count": 5
}
```

**Field Descriptions:**
- `learningLanguageId` (required): UUID of the learning language
- `userLanguage` (required): Interface language code
- `difficulty` (optional, default: medium): `easy` | `medium` | `advanced`
- `categoryContext` (optional): Topic description for themed vocabulary (max 500 chars)
- `temperature` (optional, default: 0.7): Randomness 0-1
- `count` (optional, default: 5, max: 5): Number of words to generate

**Response:** `200 OK`
```json
{
  "generated": [
    {
      "term": "Pfanne",
      "translation": "frying pan",
      "examplesMd": "- Ich brate Eier in der Pfanne\n- Die Pfanne ist heiß"
    }
  ],
  "model": "openai/gpt-4o-mini",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 200
  }
}
```

---

### Vocabulary Overview

#### Get Vocabulary Overview
```http
GET /api/vocabulary-overview?learningLanguageId=uuid&categoryId=uuid&orderBy=category&direction=asc&page=1&pageSize=20
```

**Query Parameters:**
- `learningLanguageId` (optional): Filter by learning language
- `categoryId` (optional): Filter by category
- `orderBy` (optional, default: createdAt): `createdAt` | `category` | `language`
- `direction` (optional, default: desc): `asc` | `desc`
- `page` (optional, default: 1)
- `pageSize` (optional, default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "learningLanguageId": "uuid",
      "learningLanguageCode": "german",
      "categoryId": "uuid",
      "categoryName": "Food & Drinks",
      "wordId": "uuid",
      "term": "Brot",
      "translation": "bread",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "hasMore": false
  }
}
```

---

### Testing

#### Reset Database (Test Environment Only)
```http
POST /api/testing/reset
```

**Request Body:**
```json
{
  "adminToken": "your-test-admin-token"
}
```

**Response:** `204 No Content`

**⚠️ Important:** This endpoint only works when `NODE_ENV=test` and requires a valid `TEST_ADMIN_TOKEN`.

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "ValidationError",
    "message": "Email is required"
  }
}
```

### Error Codes

- `ValidationError` (400): Invalid input data
- `Unauthorized` (401): Authentication required or invalid credentials
- `Forbidden` (403): Access denied
- `NotFound` (404): Resource not found
- `Conflict` (409): Duplicate resource
- `DuplicateLanguage` (409): Learning language already exists
- `DuplicateCategory` (409): Category name already exists
- `DuplicateWord` (409): Word term already exists in category
- `RateLimited` (429): Rate limit exceeded
- `InvalidAIResponse` (422): AI service returned invalid data
- `InternalError` (500): Server error
- `ExternalServiceError` (502): External service (AI) error

---

## Development

### Running Locally

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (see above)

3. Run migrations:
```bash
npm run migration:up
```

4. Start development server:
```bash
npm run dev
```

### Database Schema

The application uses Supabase with PostgreSQL. Schema is managed via migrations in `supabase/migrations/`.

Key tables:
- `languages` - Available languages catalog
- `profiles` - User profiles with interface language
- `user_learning_languages` - Languages a user is studying
- `categories` - Vocabulary categories
- `words` - Vocabulary entries
- `vocabulary_overview` - Read-only view for analytics

### Security

- Row Level Security (RLS) policies enforce data isolation
- All user data is scoped by `user_id`
- Markdown content is sanitized to prevent XSS
- API keys stored in environment variables
- Testing reset endpoint protected by environment and token guards

---

## License

See LICENSE file for details.

