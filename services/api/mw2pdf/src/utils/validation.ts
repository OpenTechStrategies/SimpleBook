import Joi from 'joi'

function isObject(value: Object): boolean {
  return (typeof value === 'object' && value !== null)
}

const validJsonStringSchema = Joi.string()
  .custom(
    (value, helpers) => {
      try {
        JSON.parse(value)
      } catch (e) {
        throw new Error(`the provided string could not be parsed as JSON (${e.message}`)
      }
      return value
    },
    'is a parsable JSON string',
  )

const allKeysPattern = /\w+/
const passthroughParametersSchema = Joi.object()
  .pattern(
    allKeysPattern,
    Joi.any().custom(
      (value, helpers) => {
        if (isObject(value)) {
          throw new Error('individual passthrough values cannot be objects')
        }
        return value
      },
      'is not an object',
    )
  )

/**
 *
 * Assert that "passthrough parameters" (parameters that will be passed directly to
 * MediaWiki on all API operations) are validly formatted JSON.
 *
 * @param passthroughParameters A JSON-formatted string of parameters from the CLI user
 * that will be "passed through" to MediaWiki on any API operations.
 */
export function assertValidPassthroughParameters(passthroughParameters: string): void {
  Joi.assert(
    passthroughParameters,
    validJsonStringSchema,
  )

  Joi.assert(
    JSON.parse(passthroughParameters),
    passthroughParametersSchema,
  )
}
