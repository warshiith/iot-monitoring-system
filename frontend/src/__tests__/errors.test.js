import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '../utils/errors.js'

describe('getErrorMessage', () => {
  it('returns a plain string detail unchanged', () => {
    const err = { response: { data: { detail: 'Incorrect email or password' } } }
    expect(getErrorMessage(err)).toBe('Incorrect email or password')
  })

  it('flattens a FastAPI validation error array into readable text', () => {
    const err = {
      response: {
        data: {
          detail: [
            { type: 'value_error', loc: ['body', 'email'], msg: 'Enter a valid email address', input: 'bad', ctx: {} },
          ],
        },
      },
    }
    expect(getErrorMessage(err)).toBe('email: Enter a valid email address')
  })

  it('falls back to the default message when there is no detail', () => {
    const err = {}
    expect(getErrorMessage(err, 'Something failed.')).toBe('Something failed.')
  })

  it('never returns a non-string value', () => {
    const err = { response: { data: { detail: [{ type: 'x', loc: [], msg: 'bad', input: 1, ctx: {} }] } } }
    expect(typeof getErrorMessage(err)).toBe('string')
  })
})
