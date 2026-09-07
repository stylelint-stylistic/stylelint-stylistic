import type { Document } from "postcss"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import type { EmbeddedSource } from "../../utils/typeGuards/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `unicode-bom`

const MESSAGES = defineMessages({
	expected: `Expected Unicode BOM`,
	rejected: `Unexpected Unicode BOM`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

/** `always` a byte order mark at the start of the file, `never` none. */
export type PrimaryOption = `always` | `never`

/**
 * Requires or disallows Unicode BOM.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		// A byte order mark stands at the head of the file, not of a `document` root's stylesheets
		let source: EmbeddedSource | undefined = root.source
		let { document } = root as { document?: Document }

		if (!validOptions || !source || source.inline || source.lang === `object-literal` || document !== undefined) return

		let { hasBOM } = source.input

		if (primary === `always` && !hasBOM) {
			report({
				result,
				ruleName,
				message: messages.expected,
				node: root,
			})
		}

		if (primary === `never` && hasBOM) {
			report({
				result,
				ruleName,
				message: messages.rejected,
				node: root,
			})
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
