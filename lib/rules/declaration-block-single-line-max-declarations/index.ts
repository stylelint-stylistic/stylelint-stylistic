import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isDeclaration } from "../../utils/typeGuards/index.ts"
import { isNumber } from "../../utils/validateTypes/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `declaration-block-single-line-max-declarations`

const MESSAGES = defineMessages({
	expected: (max) => `Too many declarations, maximum ${max}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

/** The most declarations a single-line block may hold. */
export type PrimaryOption = number

/**
 * Limits the number of declarations within a single-line declaration block.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The maximum.
 * @returns The check.
 */
function rule ({ ruleName, messages }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [isNumber],
		})

		if (!validOptions) return

		// A block of declarations is what is counted, whichever keyword opens it, so an at-rule's block is read as a rule's (#640)
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Counts the declarations of one statement's block.
		 * @param statement - The rule or at-rule.
		 */
		function check (statement: Rule | AtRule): void {
			// A bodiless at-rule, a Less variable or a mixin call among them, has nothing to count
			if (!hasBlock(statement)) return

			// Printed by the file's syntax, since PostCSS prints a Less mixin call and an inline comment unlike the file
			let block = blockString(statement, result)

			if (!isSingleLineString(block)) return

			// What the parser filed as a declaration, as Stylelint's own rule counted: a nested rule, an at-rule and a comment are none
			let declarations = statement.nodes.filter(isDeclaration)

			if (declarations.length <= primary) return

			// Counted from the statement's own start, as `report` reads an index
			let index = beforeBlockString(statement, result, { noRawBefore: true }).length

			report({
				message: messages.expected,
				messageArgs: [primary],
				node: statement,
				index,
				endIndex: index + block.length,
				result,
				ruleName,
			})
		}
	}
}

// Reads a lineness the run's writers change and writes nothing itself, so it checks behind them
export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule, defersToRunEnd: true })

export let { ruleName, messages } = createRule(css)
