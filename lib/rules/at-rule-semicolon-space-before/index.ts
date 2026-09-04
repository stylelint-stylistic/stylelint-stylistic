import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { isLastNodeWithoutSemicolon } from "../../utils/isLastNodeWithoutSemicolon/index.ts"
import { rawNodeString } from "../../utils/rawNodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `at-rule-semicolon-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before ";"`,
	rejectedBefore: () => `Unexpected whitespace before ";"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

/**
 * Requires or disallows whitespace before the semicolons of at-rules.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never`): RuleCheck {
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

			// The check asks about the position one character past the end of the at-rule, as though a semicolon always stood there, and that is right only where the file spells one: PostCSS prints a bodiless at-rule as its name, its `afterName`, its parameters, its `raws.between` and only then the semicolon, so that raw is exactly the whitespace in front of it. Where the file spells none, the at-rule runs to the brace closing its container or to the end of the file, and the position the check asks about is somebody else's — the whitespace in front of the brace, which the parser files into the same raw, or nothing at all, the run at the top level going to the root instead (#395)
			if (isLastNodeWithoutSemicolon(atRule)) return

			let atRuleString = rawNodeString(atRule, result)
			let problemIndex = atRuleString.length - 1

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
					})
				},
			})
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
