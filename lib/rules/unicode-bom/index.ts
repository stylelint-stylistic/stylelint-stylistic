import type { Document } from "postcss"
import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import type { EmbeddedSource } from "../../utils/typeGuards/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `unicode-bom`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: `Expected Unicode BOM`,
	rejected: `Unexpected Unicode BOM`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

/**
 * Requires or disallows Unicode BOM.
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `never`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		// A `document` root is an HTML file holding stylesheets, and a byte order mark stands at the head of the file rather than of any block in it
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

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
