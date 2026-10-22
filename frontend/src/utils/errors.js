/**
 * Safely extracts a human-readable message from an Axios/FastAPI error.
 *
 * FastAPI's `detail` field can be:
 *  - a plain string (most handwritten HTTPExceptions)
 *  - a list of Pydantic validation error objects, e.g.
 *    [{ type, loc, msg, input, ctx }, ...] (422 responses)
 *  - occasionally a single object
 *
 * React cannot render objects/arrays as children, so any code that puts
 * `err.response?.data?.detail` directly into JSX will crash the whole page
 * the moment a validation error occurs. Always route error messages
 * through this helper before rendering or toasting them.
 */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const detail = err?.response?.data?.detail

  if (!detail) return fallback
  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'msg' in item) {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null
          return field ? `${field}: ${item.msg}` : item.msg
        }
        return null
      })
      .filter(Boolean)
    return messages.length ? messages.join(' · ') : fallback
  }

  if (typeof detail === 'object' && 'msg' in detail) {
    return detail.msg
  }

  return fallback
}
