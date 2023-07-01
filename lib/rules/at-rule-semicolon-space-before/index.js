import hasBlock from '../../utils/hasBlock'
import isStandardSyntaxAtRule from '../../utils/isStandardSyntaxAtRule'
import rawNodeString from '../../utils/rawNodeString'
import report from '../../utils/report'
import ruleMessages from '../../utils/ruleMessages'
import validateOptions from '../../utils/validateOptions'
import whitespaceChecker from '../../utils/whitespaceChecker'

export const ruleName = `at-rule-semicolon-space-before`

export const messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before ";"`,
	rejectedBefore: () => `Unexpected whitespace before ";"`
})

export const meta = {
	url: `https://github.com/firefoxic/stylelint-codeguide/blob/main/lib/rules/at-rule-semicolon-space-before/README.md`
}

/** @type {import('stylelint').Rule} */
const rule = (primary) => {
	const checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`]
		})

		if (!validOptions) {
			return
		}

		root.walkAtRules((atRule) => {
			if (hasBlock(atRule)) {
				return
			}

			if (!isStandardSyntaxAtRule(atRule)) {
				return
			}

			const nodeString = rawNodeString(atRule)

			checker.before({
				source: nodeString,
				index: nodeString.length,
				err: (m) => {
					report({
						message: m,
						node: atRule,
						index: nodeString.length - 1,
						result,
						ruleName
					})
				}
			})
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
