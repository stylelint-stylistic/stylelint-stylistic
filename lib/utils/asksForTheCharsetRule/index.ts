import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { CHARSET_AT_RULE_NAME } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { configuredSetting } from "../contradictingSettings/index.ts"
import type { EmbeddedSource } from "../typeGuards/index.ts"

/** The core rule that judges the spelling of a `@charset`, which no rule of the plugin reads. */
const CHARSET_RULE = `at-charset-rule-no-invalid`

/** The warning, before the rule name closes it. */
export const CHARSET_RULE_MESSAGE = `The "@stylistic/" rules pass over "@charset"; enable the "${CHARSET_RULE}" rule to have its spelling checked`

/**
 * Asks whether a stylesheet holding a `@charset` is read by nothing that judges its spelling: the plugin's rules pass the construct over, and the configuration leaves `at-charset-rule-no-invalid` off.
 *
 * Only a file of plain CSS is asked about. A block of `postcss-html` and a styled template are roots inside a document, where the declaration is dead in every spelling, and a compiler stands between an SCSS or Less file and its output, measured on dart-sass 1.105.0 and Less 4.9.1: Sass drops the file's `@charset` at its head and writes its own where the output holds non-ASCII, passing a name not in lower case through as an unknown at-rule, and Less keeps a well-spelled one as written, respaces and hoists a badly spelled one, and refuses a name not in lower case.
 * @param root - The stylesheet.
 * @param result - The lint result carrying the configuration.
 * @param syntax - The syntax the rule asking is built over.
 * @returns True where the warning is due.
 */
export function asksForTheCharsetRule (root: Root, result: PostcssResult, syntax: Syntax): boolean {
	if (syntax.namespace !== undefined) return false

	let source: EmbeddedSource | undefined = root.source

	if (!source || source.inline || source.lang === `object-literal` || result.root !== root) return false

	let rules: Record<string, unknown> | undefined = result.stylelint?.config?.rules

	if (configuredSetting(CHARSET_RULE, rules?.[CHARSET_RULE]).primary === true) return false

	let found = false

	root.walkAtRules(CHARSET_AT_RULE_NAME, () => {
		found = true

		return false
	})

	return found
}
