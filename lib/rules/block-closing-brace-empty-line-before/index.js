import stylelint from "stylelint"

import addEmptyLineAfter from "../../utils/addEmptyLineAfter.js"
import { addNamespace } from "../../utils/addNamespace.js"
import blockString from "../../utils/blockString.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import hasBlock from "../../utils/hasBlock.js"
import hasEmptyBlock from "../../utils/hasEmptyBlock.js"
import hasEmptyLine from "../../utils/hasEmptyLine.js"
import isSingleLineString from "../../utils/isSingleLineString.js"
import optionsMatches from "../../utils/optionsMatches.js"
import removeEmptyLinesAfter from "../../utils/removeEmptyLinesAfter.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `block-closing-brace-empty-line-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: `Expected empty line before closing brace`,
	rejected: `Unexpected empty line before closing brace`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary, secondaryOptions, context) {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`always-multi-line`, `never`],
			},
			{
				actual: secondaryOptions,
				possible: {
					except: [`after-closing-brace`],
				},
				optional: true,
			},
		)

		if (!validOptions) {
			return
		}

		// Check both kinds of statements: rules and at-rules
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

			// Get whitespace after ""}", ignoring extra semicolon
			let before = (statement.raws.after || ``).replace(/;+/, ``)

			// Calculate index
			let statementString = statement.toString()
			let index = statementString.length - 1

			if (statementString[index - 1] === `\r`) {
				index -= 1
			}

			// Set expectation
			let expectEmptyLineBefore = (() => {
				let childNodeTypes = statement.nodes.map((item) => item.type)

				// Reverse the primary options if `after-closing-brace` is set
				if (optionsMatches(secondaryOptions, `except`, `after-closing-brace`) && !childNodeTypes.includes(`decl`)) {
					return primary === `never`
				}

				return primary === `always-multi-line` && !isSingleLineString(blockString(statement))
			})()

			// Check for at least one empty line
			let hasEmptyLineBefore = hasEmptyLine(before)

			// Return if the expectation is met
			if (expectEmptyLineBefore === hasEmptyLineBefore) {
				return
			}

			let message = expectEmptyLineBefore ? messages.expected : messages.rejected

			report({
				message,
				result,
				ruleName,
				node: statement,
				index,
				endIndex: index,
				fix () {
					let { newline } = context

					if (typeof newline !== `string`) return

					if (expectEmptyLineBefore) {
						addEmptyLineAfter(statement, newline)
					} else {
						removeEmptyLinesAfter(statement, newline)
					}
				},
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
