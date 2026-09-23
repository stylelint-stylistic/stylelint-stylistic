/** The regular expressions of the Less namespace, kept as `lib/regexps.ts` keeps the core's. */

/** A Less `:extend`, with or without its selector list. */
export const LESS_EXTEND = /:extend(?:\(.*?\))?/u

/** A Less `:extend(…)` with a selector list, in any case. */
export const LESS_EXTEND_CALL = /:extend\(.+\)/iu

/** A name Less calls a detached ruleset by: its `variableCall` reads ASCII word characters and hyphens, and an at-rule of the same shape spelling any other is read as an at-rule. */
export const LESS_DETACHED_RULESET_NAME = /^[\w-]+$/u

/** The `when` of a Less guard, lower case only, as Less reads its keywords. */
export const LESS_GUARD = /\swhen\s*(?:not\s*)?\(/u

/** The head of a Less mixin definition's selector: one class or id name, escapes included, and the parenthesis opening its parameter list, whitespace allowed in front; the pattern Less's `mixin.definition` reads, but for an escaped character outside the Basic Multilingual Plane, which this reads whole and Less refuses ([#651](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/651)). */
export const LESS_MIXIN_DEFINITION_HEAD = /^[#.](?:[\w-]|\\(?:[\dA-Fa-f]{1,6} ?|[^\dA-Fa-f]))+\s*\(/u

/** The parameter list closing a Less parametric mixin's selector. */
export const LESS_PARAMETRIC_MIXIN = /\(@.*\)$/u

/** A Less mixin call with something behind it, as `.foo().bar` is. */
export const LESS_RESOLVED_MIXIN = /\.[\w-]+\(.*\).+/u

/** A single entity, no call, a Less custom property's value may spell alone in front of a `//` comment and still have `permissiveValue` read that comment whole: a bare word, a quoted string, or a bracketed group. */
export const LESS_CUSTOM_PROPERTY_BARE_ENTITY = /^(?:[\w-]+|(["'])[^"']*\1|\[[^[\]]*\])$/u

/** A call's name and opening parenthesis, at the start of a text. */
export const LESS_CALL_OPENING = /^[\w-]+\(/u
