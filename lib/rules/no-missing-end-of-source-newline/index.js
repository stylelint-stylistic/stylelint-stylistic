import stylelint from "stylelint"

import { TRAILING_LINE_BREAK } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { getLineEnding } from "../../utils/getLineEnding/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `no-missing-end-of-source-newline`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	rejected: `Unexpected missing end-of-source newline`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Disallows missing end-of-source newlines.
 * @type {import('stylelint').Rule}
 */
function rule (primary, _secondaryOptions, context) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, { actual: primary })

		if (!validOptions) return

		if (root.source === null) throw new Error(`The root node must have a source property`)

		if (root.source.inline || root.source.lang === `object-literal`) return

		let rootString = root.source.input.css

		if (!rootString.trim() || TRAILING_LINE_BREAK.test(rootString)) return

		let problemIndex = rootString.length - 1

		report({
			message: messages.rejected,
			node: root,
			index: problemIndex,
			endIndex: problemIndex,
			result,
			ruleName,
			fix () {
				// The file is closed with the break it spells its lines with. `context.newline` is left for the file that ends no line at all, since it reads a line feed and a Windows pair and knows neither of the two other breaks a stylesheet is written with
				root.raws.after = getLineEnding(root) ?? context.newline
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
