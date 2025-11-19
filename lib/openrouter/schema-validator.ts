import { z } from 'zod'
import type { JsonSchema, ResponseFormatSchema } from '@/lib/types'
import { OpenRouterSchemaError, OpenRouterValidationError } from './errors'

/**
 * Utility for validating JSON schemas and response formats.
 */
export class SchemaValidator {
  /**
   * Validates a response format schema structure.
   * @param responseFormat Response format to validate
   * @throws {OpenRouterValidationError} If schema is invalid
   */
  static validateResponseFormat(responseFormat: ResponseFormatSchema): void {
    if (!responseFormat.type) {
      throw new OpenRouterValidationError('Response format must have a type')
    }

    if (responseFormat.type === 'json_schema') {
      if (!responseFormat.json_schema) {
        throw new OpenRouterValidationError(
          "Response format type 'json_schema' requires json_schema property"
        )
      }

      const { name, schema } = responseFormat.json_schema

      if (!name || typeof name !== 'string') {
        throw new OpenRouterValidationError('JSON schema must have a name')
      }

      if (!schema) {
        throw new OpenRouterValidationError('JSON schema must have a schema property')
      }

      // Validate basic schema structure
      this.validateJsonSchema(schema)
    }
  }

  /**
   * Validates a JSON schema structure.
   * @param schema JSON schema to validate
   * @throws {OpenRouterValidationError} If schema is invalid
   */
  static validateJsonSchema(schema: JsonSchema): void {
    if (!schema.type) {
      throw new OpenRouterValidationError('JSON schema must have a type property')
    }

    // Validate type is valid
    const validTypes = ['object', 'array', 'string', 'number', 'integer', 'boolean', 'null']
    if (!validTypes.includes(schema.type)) {
      throw new OpenRouterValidationError(`Invalid JSON schema type: ${schema.type}`, {
        validTypes,
      })
    }

    // If type is object, validate properties
    if (schema.type === 'object') {
      if (!schema.properties || typeof schema.properties !== 'object') {
        throw new OpenRouterValidationError("JSON schema with type 'object' must have properties")
      }

      // Validate required fields exist in properties
      if (schema.required && Array.isArray(schema.required)) {
        for (const requiredField of schema.required) {
          if (!(requiredField in schema.properties)) {
            throw new OpenRouterValidationError(
              `Required field '${requiredField}' not found in properties`,
              { requiredField, properties: Object.keys(schema.properties) }
            )
          }
        }
      }
    }

    // If type is array, validate items
    if (schema.type === 'array') {
      if (!schema.items) {
        throw new OpenRouterValidationError(
          "JSON schema with type 'array' must have items property"
        )
      }
    }
  }

  /**
   * Validates data against a JSON schema using Zod.
   * @param data Data to validate
   * @param jsonSchema JSON schema to validate against
   * @throws {OpenRouterSchemaError} If validation fails
   */
  static validateDataAgainstSchema(data: unknown, jsonSchema: JsonSchema): void {
    try {
      const zodSchema = this.jsonSchemaToZod(jsonSchema)
      zodSchema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new OpenRouterSchemaError('Response data does not match expected schema', {
          errors: error.issues,
          data,
        })
      }
      throw error
    }
  }

  /**
   * Converts a JSON schema to a Zod schema.
   * @param jsonSchema JSON schema to convert
   * @returns Zod schema
   * @private
   */
  private static jsonSchemaToZod(jsonSchema: JsonSchema): z.ZodType<any> {
    switch (jsonSchema.type) {
      case 'string':
        return z.string()

      case 'number':
        return z.number()

      case 'integer':
        return z.number().int()

      case 'boolean':
        return z.boolean()

      case 'null':
        return z.null()

      case 'array':
        if (!jsonSchema.items) {
          return z.array(z.unknown())
        }
        return z.array(this.jsonSchemaToZod(jsonSchema.items))

      case 'object': {
        if (!jsonSchema.properties) {
          return z.record(z.string(), z.unknown())
        }

        const shape: Record<string, z.ZodType<any>> = {}

        for (const [key, propSchema] of Object.entries(jsonSchema.properties)) {
          let zodType = this.jsonSchemaToZod(propSchema as JsonSchema)

          // Make field optional if not in required array
          const isRequired = jsonSchema.required?.includes(key) ?? false
          if (!isRequired) {
            zodType = zodType.optional()
          }

          shape[key] = zodType
        }

        let objectSchema = z.object(shape)

        // Handle additionalProperties
        if (jsonSchema.additionalProperties === false) {
          objectSchema = objectSchema.strict()
        }

        return objectSchema
      }

      default:
        return z.unknown()
    }
  }

  /**
   * Validates that a parsed JSON response matches the expected structure.
   * @param content Content string to validate
   * @param jsonSchema Optional JSON schema to validate against
   * @returns Parsed and validated JSON
   * @throws {OpenRouterSchemaError} If validation fails
   */
  static validateJsonResponse(content: string, jsonSchema?: JsonSchema): any {
    // Parse JSON
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (error) {
      throw new OpenRouterSchemaError('Response content is not valid JSON', {
        content: content.substring(0, 500),
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Validate against schema if provided
    if (jsonSchema) {
      this.validateDataAgainstSchema(parsed, jsonSchema)
    }

    return parsed
  }
}
