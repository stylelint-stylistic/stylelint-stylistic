import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import blockString from "../../utils/blockString.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import hasBlock from "../../utils/hasBlock.js"
import hasEmptyBlock from "../../utils/hasEmptyBlock.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `block-closing-brace-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before "}"`,
	rejectedBefore: () => `Unexpected whitespace before "}"`,
	expectedBeforeSingleLine: () => `Expected single space before "}" of a single-line block`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "}" of a single-line block`,
	expectedBeforeMultiLine: () => `Expected single space before "}" of a multi-line block`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "}" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [
				`always`,
				`never`,
				`always-single-line`,
				`never-single-line`,
				`always-multi-line`,
				`never-multi-line`,
			],
		})

		if (!validOptions) {
			return
		}

		// Check both kinds of statement: rules and at-rules
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * @param {import('postcss').Rule | import('postcss').AtRule} statement
		 */
		function check (statement) {
			// Return early if blockless or has empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) {
				return
			}

			let source = blockString(statement)
			let statementString = statement.toString()

			let index = statementString.length - 2

			if (statementString[index - 1] === `\r`) {
				index -= 1
			}

			checker.before({
				source,
				index: source.length - 1,
				err: (msg) => {
					report({
						message: msg,
						node: statement,
						index,
						endIndex: index,
						result,
						ruleName,
						fix () {
							let statementRaws = statement.raws

							if (typeof statementRaws.after !== `string`) return

							if (primary.startsWith(`always`)) {
								statementRaws.after = statementRaws.after.replace(/\s*$/, ` `)
							} else if (primary.startsWith(`never`)) {
								statementRaws.after = statementRaws.after.replace(/\s*$/, ``)
							}
						},
					})
				},
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
