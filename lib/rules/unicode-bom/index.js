import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"

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
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		// A `document` root is an HTML file holding stylesheets, and a byte order mark stands at the head of the file rather than of any block in it
		if (!validOptions || !root.source || root.source.inline || root.source.lang === `object-literal` || root.document !== undefined) return

		let { hasBOM } = root.source.input

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
