/**
 * The words that join the queries and the features of a media query list.
 *
 * None of them names a function, however a file spells one: `and(min-width: 1px)` is a feature written without the space the grammar asks for, and not a call whose arguments the rules should pass over.
 */
export const MEDIA_QUERY_COMBINATORS: Set<string> = new Set([`and`, `not`, `only`, `or`])

/** The media features whose value is a `<ratio>`: the two of Media Queries 4, in the `min-` and `max-` spellings of the plain form as well, the device one deprecated and read by every browser still. A rule about the notation of a ratio reads the value of these features and of no other, in the plain form and in the range form alike. */
export const RATIO_MEDIA_FEATURES: Set<string> = new Set([`aspect-ratio`, `min-aspect-ratio`, `max-aspect-ratio`, `device-aspect-ratio`, `min-device-aspect-ratio`, `max-device-aspect-ratio`])
