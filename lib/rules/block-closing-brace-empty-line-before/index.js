import addEmptyLineAfter from '../../utils/addEmptyLineAfter'
import blockString from '../../utils/blockString'
import hasBlock from '../../utils/hasBlock'
import hasEmptyBlock from '../../utils/hasEmptyBlock'
import hasEmptyLine from '../../utils/hasEmptyLine'
import isSingleLineString from '../../utils/isSingleLineString'
import optionsMatches from '../../utils/optionsMatches'
import removeEmptyLinesAfter from '../../utils/removeEmptyLinesAfter'
import report from '../../utils/report'
import ruleMessages from '../../utils/ruleMessages'
import validateOptions from '../../utils/validateOptions'

export const ruleName = `block-closing-brace-empty-line-before`

export const messages = ruleMessages(ruleName, {
	expected: `Expected empty line before closing brace`,
	rejected: `Unexpected empty line before closing brace`
})

export const meta = {
	url: `https://stylelint.io/user-guide/rules/block-closing-brace-empty-line-before`,
	fixable: true,
	deprecated: true
}

/** @type {import('stylelint').Rule} */
const rule = (primary, secondaryOptions, context) => (root, result) => {
	const validOptions = validateOptions(
		result,
		ruleName,
		{
			actual: primary,
			possible: [`always-multi-line`, `never`]
		},
		{
			actual: secondaryOptions,
			possible: {
				except: [`after-closing-brace`]
			},
			optional: true
		}
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
	function check(statement) {
		// Return early if blockless or has empty block
		if (!hasBlock(statement) || hasEmptyBlock(statement)) {
			return
		}

		// Get whitespace after ""}", ignoring extra semicolon
		const before = (statement.raws.after || ``).replace(/;+/, ``)

		// Calculate index
		const statementString = statement.toString()
		let index = statementString.length - 1

		if (statementString[index - 1] === `\r`) {
			index -= 1
		}

		// Set expectation
		const expectEmptyLineBefore = (() => {
			const childNodeTypes = statement.nodes.map((item) => item.type)

			// Reverse the primary options if `after-closing-brace` is set
			if (
				optionsMatches(secondaryOptions, `except`, `after-closing-brace`) &&
					statement.type === `atrule` &&
					!childNodeTypes.includes(`decl`)
			) {
				return primary === `never`
			}

			return primary === `always-multi-line` && !isSingleLineString(blockString(statement))
		})()

		// Check for at least one empty line
		const hasEmptyLineBefore = hasEmptyLine(before)

		// Return if the expectation is met
		if (expectEmptyLineBefore === hasEmptyLineBefore) {
			return
		}

		if (context.fix) {
			const { newline } = context

			if (typeof newline !== `string`) {return}

			if (expectEmptyLineBefore) {
				addEmptyLineAfter(statement, newline)
			} else {
				removeEmptyLinesAfter(statement, newline)
			}

			return
		}

		const message = expectEmptyLineBefore ? messages.expected : messages.rejected

		report({
			message,
			result,
			ruleName,
			node: statement,
			index
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
