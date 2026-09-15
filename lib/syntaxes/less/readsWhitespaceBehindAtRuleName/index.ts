import type { AtRule } from "postcss"

import { LEADING_WHITESPACE_RUN } from "../../../regexps.ts"

/** The at-rules Less reads as its directive only with whitespace behind the name. */
const DIRECTIVES = new Set([`import`, `plugin`])

/**
 * Asks whether whitespace written behind an at-rule's name changes what Less reads the at-rule as.
 *
 * Less takes `@import` and `@plugin` as directives only where whitespace stands behind the lower-case name. `@import(reference) "x"`, `@import"x"` and one with a comment right behind the name it prints through as text, and whitespace written into them makes them directives (#396); every other at-rule it reads the same way in both spellings. An upper-case name Less refuses in both, and is read all the same: `at-rule-name-case` lowercases it within the same run, so the answer would otherwise hang on the order the rules are listed in.
 * @param atRule - The at-rule.
 * @returns True where a rule writing whitespace behind the name would change the stylesheet's meaning.
 */
export function readsWhitespaceBehindAtRuleName (atRule: AtRule): boolean {
	return DIRECTIVES.has(atRule.name.toLowerCase()) && !LEADING_WHITESPACE_RUN.test(atRule.raws.afterName ?? ``)
}
