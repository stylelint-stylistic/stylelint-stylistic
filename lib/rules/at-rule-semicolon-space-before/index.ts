import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { declaresTheEncoding } from "../../utils/declaresTheEncoding/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { isLastNodeWithoutSemicolon } from "../../utils/isLastNodeWithoutSemicolon/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { writeWhitespaceBeforeSemicolon } from "../../utils/whitespaceBeforeSemicolon/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `at-rule-semicolon-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before ";"`,
	rejectedBefore: () => `Unexpected whitespace before ";"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space before the semicolon, `never` no whitespace. */
export type PrimaryOption = `always` | `never`

/**
 * Requires or disallows whitespace before the semicolons of at-rules.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkAtRules((atRule) => {
			if (hasBlock(atRule)) return

			if (!syntax.isStandardAtRule(atRule)) return

			// The semicolon of an encoding declaration follows its closing quotation mark directly, as the specification reads it (#703)
			if (declaresTheEncoding(atRule)) return

			// The check asks about the position one past the at-rule, as though a semicolon stood there; where the file spells none the at-rule runs to its container's `}` or the end of the file, and the position is somebody else's (#395)
			if (isLastNodeWithoutSemicolon(atRule)) return

			// `report` counts an index from the node's own start, so the raw whitespace in front of the at-rule stays out of the text the position is measured in (#545)
			let atRuleString = nodeString(atRule, result)
			let problemIndex = atRuleString.length - 1
			// The fix writes over the run the at-rule ends with, and a `//` comment there is closed by that run's break, so either option would put the semicolon inside it: the warning stands
			// A neighbour respelling the head makes a `@charset` the encoding declaration within the same run — `at-rule-name-case` the name's own case among them — and the specification reads no whitespace in front of its semicolon, so `always` never writes there (#697); `never` writes the spelling the specification asks for
			let isFixable = !syntax.writesIntoInlineComment(atRule, result) && !(primary === `always` && atRule.name.toLowerCase() === `charset`)

			checker.before({
				source: atRuleString,
				index: atRuleString.length,
				err: (m) => {
					report({
						message: m,
						node: atRule,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						...(isFixable && {
							fix: (): void => {
								writeWhitespaceBeforeSemicolon(syntax, atRule, primary === `always` ? ` ` : ``)
							},
						}),
					})
				},
			})
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
