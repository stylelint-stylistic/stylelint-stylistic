import stylelint from "stylelint"
import { rule as _rule, Input } from "postcss"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `linebreaks`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (linebreak) => `Expected linebreak to be ${linebreak}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`unix`, `windows`],
		})

		if (!validOptions) {
			return
		}

		let shouldHaveCR = primary === `windows`

		function fix () {
			root.walk((node) => {
				if (`selector` in node) {
					node.selector = fixData(node.selector)
				}

				if (`value` in node) {
					node.value = fixData(node.value)
				}

				if (`text` in node) {
					node.text = fixData(node.text)
				}

				if (node.raws.before) {
					node.raws.before = fixData(node.raws.before)
				}

				if (typeof node.raws.after === `string`) {
					node.raws.after = fixData(node.raws.after)
				}
			})

			if (typeof root.raws.after === `string`) {
				root.raws.after = fixData(root.raws.after)
			}
		}

		if (root.source === null) { throw new Error(`The root node must have a source`) }

		let lines = root.source.input.css.split(`\n`)

		for (let [i, line] of lines.entries()) {
			if (i < lines.length - 1 && !line.includes(`\r`)) {
				line += `\n`
			}

			if (hasError(line)) {
				let lineNum = i + 1
				let colNum = line.length

				reportNewlineError(lineNum, colNum)
			}
		}

		/**
		 * @param {string} dataToCheck
		 */
		function hasError (dataToCheck) {
			let hasNewlineToVerify = (/[\r\n]/).test(dataToCheck)
			let hasCR = hasNewlineToVerify ? (/\r/).test(dataToCheck) : false

			return hasNewlineToVerify && hasCR !== shouldHaveCR
		}

		/**
		 * @param {string} data
		 */
		function fixData (data) {
			if (data) {
				let res = data.replace(/\r/g, ``)

				if (shouldHaveCR) {
					res = res.replace(/\n/g, `\r\n`)
				}

				return res
			}

			return data
		}

		/**
		 * @param {number} line
		 * @param {number} column
		 */
		function reportNewlineError (line, column) {
			// Creating a node manually helps us to point to empty lines.
			let node = _rule({
				source: {
					start: { line, column, offset: 0 },
					input: new Input(``),
				},
			})

			report({
				message: messages.expected,
				messageArgs: [primary],
				node,
				result,
				ruleName,
				fix,
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
