import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `no-empty-first-line`

export const ruleName = addNamespace(shortName)

export const noEmptyFirstLineTest = /^\s*[\r\n]/

export const messages = ruleMessages(ruleName, {
	rejected: `Unexpected empty line`,
})

const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual: primary })

		// @ts-expect-error -- TS2339: Property 'inline' does not exist on type 'Source'. Property 'lang' does not exist on type 'Source'.
		if (!validOptions || root.source.inline || root.source.lang === `object-literal`) {
			return
		}

		const rootString = (root.source && root.source.input.css) || ``

		if (!rootString.trim()) {
			return
		}

		if (noEmptyFirstLineTest.test(rootString)) {
			report({
				message: messages.rejected,
				node: root,
				result,
				ruleName,
				fix () {
					if (root.first === null) {
						throw new Error(`The root node must have the first node.`)
					}

					if (root.first.raws.before === null) {
						throw new Error(`The first node must have spaces before.`)
					}

					root.first.raws.before = root.first.raws.before.trimStart()
				},
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
