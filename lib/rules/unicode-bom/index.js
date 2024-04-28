import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `unicode-bom`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expected: `Expected Unicode BOM`,
	rejected: `Unexpected Unicode BOM`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions || !root.source || root.source.inline || root.source.lang === `object-literal` || root.document !== undefined /* Ignore HTML documents */) {
			return
		}

		const { hasBOM } = root.source.input

		if (primary === `always` && !hasBOM) {
			report({
				result,
				ruleName,
				message: messages.expected,
				node: root,
				line: 1,
			})
		}

		if (primary === `never` && hasBOM) {
			report({
				result,
				ruleName,
				message: messages.rejected,
				node: root,
				line: 1,
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
