import stylelint from "stylelint"

import { CHARSET_AT_RULE_NAME } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { type EmbeddedSource, isAtRule } from "../../utils/typeGuards/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `unicode-bom`

const MESSAGES = defineMessages({
	expected: `Expected Unicode BOM`,
	rejected: `Unexpected Unicode BOM`,
	contradicts: `The "always" option contradicts the "@charset" standing first in the file; set "never" or leave the rule unset`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a byte order mark at the start of the file, `never` none. */
export type PrimaryOption = `always` | `never`

/**
 * Requires or disallows Unicode BOM. The mark is in none of the text the rules read: PostCSS takes it off while building the `Input` and keeps it as the `hasBOM` flag, which the stringifier reads back when it prints a root, so the fix is the flag ([#700](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/700)).
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		// A byte order mark stands at the head of the file, which only the result's root stands for; a block of `postcss-html` and a styled template are roots inside a document (#728)
		let source: EmbeddedSource | undefined = root.source

		if (!validOptions || !source || source.inline || source.lang === `object-literal` || result.root !== root) return

		let { input } = source

		if (primary === `always`) {
			// A mark outranks the encoding declaration behind it, so a plain CSS file whose first node is a `@charset` in any spelling is one the option is wrong for rather than one to write into, and the spelling is `at-charset-rule-no-invalid`'s to judge; under the SCSS and Less namespaces the compiler stands between the file and its output, and neither dart-sass nor Less carries the file's mark into it
			if (syntax.namespace === undefined && root.first && isAtRule(root.first) && CHARSET_AT_RULE_NAME.test(root.first.name)) {
				report({
					result,
					ruleName,
					message: messages.contradicts,
					node: root,
				})

				return
			}

			if (!input.hasBOM) {
				report({
					result,
					ruleName,
					message: messages.expected,
					node: root,
					fix () {
						input.hasBOM = true
					},
				})
			}
		}

		if (primary === `never` && input.hasBOM) {
			report({
				result,
				ruleName,
				message: messages.rejected,
				node: root,
				fix () {
					input.hasBOM = false
				},
			})
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
