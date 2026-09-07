/** The words joining queries and features. None names a function: `and(min-width: 1px)` is a feature missing its space, not a call. */
export const MEDIA_QUERY_COMBINATORS: Set<string> = new Set([`and`, `not`, `only`, `or`])

/** The `<ratio>` media features, with `min-`/`max-` and the deprecated device ones; the ratio notation rule reads no other. */
export const RATIO_MEDIA_FEATURES: Set<string> = new Set([`aspect-ratio`, `min-aspect-ratio`, `max-aspect-ratio`, `device-aspect-ratio`, `min-device-aspect-ratio`, `max-device-aspect-ratio`])
