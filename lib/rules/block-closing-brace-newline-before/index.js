import stylelint from "stylelint"

import blockString from "../../utils/blockString.js"
import hasBlock from "../../utils/hasBlock.js"
import hasEmptyBlock from "../../utils/hasEmptyBlock.js"
import isSingleLineString from "../../utils/isSingleLineString.js"
import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `block-closing-brace-newline-before`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedBefore: `Expected newline before "}"`,
	expectedBeforeMultiLine: `Expected newline before "}" of a multi-line block`,
	rejectedBeforeMultiLine: `Unexpected whitespace before "}" of a multi-line block`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => (root, result) => {
	const validOptions = validateOptions(result, ruleName, {
		actual: primary,
		possible: [`always`, `always-multi-line`, `never-multi-line`],
	})

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

		// Ignore extra semicolon
		const after = (statement.raws.after || ``).replace(/;+/, ``)

		if (after === undefined) {
			return
		}

		const blockIsMultiLine = !isSingleLineString(blockString(statement))
		const statementString = statement.toString()

		let index = statementString.length - 2

		if (statementString[index - 1] === `\r`) {
			index -= 1
		}

		// We're really just checking whether a
		// newline *starts* the block's final space -- between
		// the last declaration and the closing brace. We can
		// ignore any other whitespace between them, because that
		// will be checked by the indentation rule.
		if (!after.startsWith(`\n`) && !after.startsWith(`\r\n`)) {
			if (primary === `always`) {
				complain(messages.expectedBefore)
			} else if (blockIsMultiLine && primary === `always-multi-line`) {
				complain(messages.expectedBeforeMultiLine)
			}
		}

		if (after !== `` && blockIsMultiLine && primary === `never-multi-line`) {
			complain(messages.rejectedBeforeMultiLine)
		}

		/**
		 * @param {string} message
		 */
		function complain (message) {
			if (context.fix) {
				const statementRaws = statement.raws

				if (typeof statementRaws.after !== `string`) {return}

				if (primary.startsWith(`always`)) {
					const firstWhitespaceIndex = statementRaws.after.search(/\s/)
					const newlineBefore = firstWhitespaceIndex >= 0 ? statementRaws.after.slice(0, firstWhitespaceIndex) : statementRaws.after
					const newlineAfter = firstWhitespaceIndex >= 0 ? statementRaws.after.slice(firstWhitespaceIndex) : ``
					const newlineIndex = newlineAfter.search(/\r?\n/)

					statementRaws.after = newlineIndex >= 0 ? newlineBefore + newlineAfter.slice(newlineIndex) : newlineBefore + context.newline + newlineAfter

					return
				}

				if (primary === `never-multi-line`) {
					statementRaws.after = statementRaws.after.replace(/\s/g, ``)

					return
				}
			}

			report({
				message,
				result,
				ruleName,
				node: statement,
				index,
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
