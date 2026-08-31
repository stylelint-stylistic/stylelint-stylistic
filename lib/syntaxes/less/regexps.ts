/** Every regular expression the less namespace reads a stylesheet with, each one a named constant under a line saying what it matches, exactly as `lib/regexps.ts` keeps the core's. */

/** The Less `:extend`, with or without the selector list it takes. */
export const LESS_EXTEND = /:extend(?:\(.*?\))?/u

/** A Less `:extend(…)` carrying a selector list, in whatever case it is written. */
export const LESS_EXTEND_CALL = /:extend\(.+\)/iu

/** The `when` of a Less CSS guard, read in lower case only, as Less reads its keywords. */
export const LESS_GUARD = /\swhen\s*(?:not\s*)?\(/u

/** The parameter list of a Less parametric mixin, closing the selector it is written on. */
export const LESS_PARAMETRIC_MIXIN = /\(@.*\)$/u

/** A Less mixin call with something written after it, as `.foo().bar` and `.foo(@a, @b)[bar]` are. */
export const LESS_RESOLVED_MIXIN = /\.[\w-]+\(.*\).+/u
