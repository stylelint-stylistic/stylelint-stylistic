import type { ChildNode } from "postcss"
import stylelint from "stylelint"

import { LINE_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isInlineStyleAttribute } from "../../utils/isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../../utils/isLastNodeWithoutSemicolon/index.ts"
import { nextNonCommentNode } from "../../utils/nextNonCommentNode/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { rawNodeString } from "../../utils/rawNodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isAtRule, isRule } from "../../utils/typeGuards/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `declaration-block-semicolon-newline-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected newline after ";"`,
	expectedAfterMultiLine: () => `Expected newline after ";" in a multi-line declaration block`,
	rejectedAfterMultiLine: () => `Unexpected newline after ";" in a multi-line declaration block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline or disallows whitespace after the semicolons of declaration blocks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always`, `always-multi-line` or `never-multi-line`.
 * @param _secondaryOptions - None.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `always-multi-line` | `never-multi-line`, _secondaryOptions: unknown): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			let parentRule = decl.parent

			if (!parentRule) throw new Error(`A parent node must be present`)

			if (!isAtRule(parentRule) && !isRule(parentRule) && !isInlineStyleAttribute(parentRule)) return

			if (isLastNodeWithoutSemicolon(decl)) return

			let nextNode = decl.next()

			if (!nextNode) return

			// Allow end-of-line comment
			let nodeToCheck = nextNonCommentNode(nextNode)

			if (!nodeToCheck) return

			let problemIndex = nodeString(decl, result).length + 1
			let previousNode = nodeToCheck.prev() as ChildNode
			// Under `never-multi-line` the fix takes the whitespace in front of the checked node, and the break opening it may close an inline comment, so the block is left alone; the `always` options keep the break. The semicolon is handed in with the declaration, since the write lands behind it; behind a comment node there is none
			let isFixable = primary.startsWith(`always`) || !syntax.writesIntoInlineComment(previousNode, result, previousNode === decl ? `;` : ``)

			checker.afterOneOnly({
				source: rawNodeString(nodeToCheck, result),
				index: -1,
				lineCheckStr: blockString(parentRule, result),
				err: (m) => {
					report({
						message: m,
						node: decl,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						...(isFixable && {
							fix: (): void => {
								if (primary.startsWith(`always`)) {
									// Trim up to the break already there, and add one only where none is
									let index = nodeToCheck.raws.before.search(LINE_BREAK)

									nodeToCheck.raws.before = index >= 0 ? nodeToCheck.raws.before.slice(index) : getLineBreak(syntax, root, result) + nodeToCheck.raws.before

									return
								}

								if (primary === `never-multi-line`) nodeToCheck.raws.before = ``
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
