import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `no-missing-end-of-source-newline`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	rejected: `Unexpected missing end-of-source newline`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary, _secondaryOptions, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual: primary })

		if (!validOptions) {
			return
		}

		if (root.source === null) {
			throw new Error(`The root node must have a source property`)
		}

		// @ts-expect-error -- TS2339: Property 'inline' does not exist on type 'Source'.
		if (root.source.inline || root.source.lang === `object-literal`) {
			return
		}

		const rootString = root.source.input.css

		if (!rootString.trim() || rootString.endsWith(`\n`)) {
			return
		}

		report({
			message: messages.rejected,
			node: root,
			index: rootString.length - 1,
			result,
			ruleName,
			fix () {
				root.raws.after = context.newline
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
