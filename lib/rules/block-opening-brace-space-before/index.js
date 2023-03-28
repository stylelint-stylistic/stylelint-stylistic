import beforeBlockString from '../../utils/beforeBlockString'
import blockString from '../../utils/blockString'
import hasBlock from '../../utils/hasBlock'
import hasEmptyBlock from '../../utils/hasEmptyBlock'
import optionsMatches from '../../utils/optionsMatches'
import report from '../../utils/report'
import ruleMessages from '../../utils/ruleMessages'
import validateOptions from '../../utils/validateOptions'
import whitespaceChecker from '../../utils/whitespaceChecker'
import { isRegExp, isString } from '../../utils/validateTypes'

export const ruleName = `block-opening-brace-space-before`

export const messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before "{"`,
	rejectedBefore: () => `Unexpected whitespace before "{"`,
	expectedBeforeSingleLine: () => `Expected single space before "{" of a single-line block`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "{" of a single-line block`,
	expectedBeforeMultiLine: () => `Expected single space before "{" of a multi-line block`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "{" of a multi-line block`
})

export const meta = {
	url: `https://stylelint.io/user-guide/rules/block-opening-brace-space-before`,
	fixable: true
}

/** @type {import('stylelint').Rule} */
const rule = (primary, secondaryOptions, context) => {
	const checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [
					`always`,
					`never`,
					`always-single-line`,
					`never-single-line`,
					`always-multi-line`,
					`never-multi-line`
				]
			},
			{
				actual: secondaryOptions,
				possible: {
					ignoreAtRules: [isString, isRegExp],
					ignoreSelectors: [isString, isRegExp]
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
			// Return early if blockless or has an empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) {
				return
			}

			// Return early if at-rule is to be ignored
			if (
				statement.type === `atrule` &&
				optionsMatches(secondaryOptions, `ignoreAtRules`, statement.name)
			) {
				return
			}

			// Return early if selector is to be ignored
			if (
				statement.type === `rule` &&
				optionsMatches(secondaryOptions, `ignoreSelectors`, statement.selector)
			) {
				return
			}

			const source = beforeBlockString(statement)
			const beforeBraceNoRaw = beforeBlockString(statement, {
				noRawBefore: true
			})

			let index = beforeBraceNoRaw.length - 1

			if (beforeBraceNoRaw[index - 1] === `\r`) {
				index -= 1
			}

			checker.before({
				source,
				index: source.length,
				lineCheckStr: blockString(statement),
				err: (m) => {
					if (context.fix) {
						if (primary.startsWith(`always`)) {
							statement.raws.between = ` `

							return
						}

						if (primary.startsWith(`never`)) {
							statement.raws.between = ``

							return
						}
					}

					report({
						message: m,
						node: statement,
						index,
						result,
						ruleName
					})
				}
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
