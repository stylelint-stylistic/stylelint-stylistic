/** The regular expressions of the Less namespace, kept as `lib/regexps.ts` keeps the core's. */

/** A Less `:extend`, with or without its selector list. */
export const LESS_EXTEND = /:extend(?:\(.*?\))?/u

/** A Less `:extend(…)` with a selector list, in any case. */
export const LESS_EXTEND_CALL = /:extend\(.+\)/iu

/** A name Less calls a detached ruleset by: its `variableCall` reads ASCII word characters and hyphens, and an at-rule of the same shape spelling any other is read as an at-rule. */
export const LESS_DETACHED_RULESET_NAME = /^[\w-]+$/u

/** The `when` of a Less guard, lower case only, as Less reads its keywords. */
export const LESS_GUARD = /\swhen\s*(?:not\s*)?\(/u

/** The parameter list closing a Less parametric mixin's selector. */
export const LESS_PARAMETRIC_MIXIN = /\(@.*\)$/u

/** A Less mixin call with something behind it, as `.foo().bar` is. */
export const LESS_RESOLVED_MIXIN = /\.[\w-]+\(.*\).+/u
