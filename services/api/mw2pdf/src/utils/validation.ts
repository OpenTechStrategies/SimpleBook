import Joi from 'joi'

function isObject(value) {
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

export function assertValidPassthroughParameters(passthroughParameters) {
  Joi.assert(
    passthroughParameters,
    validJsonStringSchema,
  )

  Joi.assert(
    JSON.parse(passthroughParameters),
    passthroughParametersSchema,
  )
}
