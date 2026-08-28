import stylelint from "stylelint"

import { LINE_BREAK } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { blockString } from "../../utils/blockString/index.js"
import { getLineBreak } from "../../utils/getLineBreak/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isInlineStyleAttribute } from "../../utils/isInlineStyleAttribute/index.js"
import { isLastDeclarationWithoutSemicolon } from "../../utils/isLastDeclarationWithoutSemicolon/index.js"
import { nextNonCommentNode } from "../../utils/nextNonCommentNode/index.js"
import { rawNodeString } from "../../utils/rawNodeString/index.js"
import { isAtRule, isRule } from "../../utils/typeGuards/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"
import { writesIntoInlineComment } from "../../utils/writesIntoInlineComment/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-block-semicolon-newline-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
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
 * @type {import('stylelint').Rule}
 */
function rule (primary, _secondaryOptions) {
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

			if (isLastDeclarationWithoutSemicolon(decl)) return

			let nextNode = decl.next()

			if (!nextNode) return

			// Allow end-of-line comment
			let nodeToCheck = nextNonCommentNode(nextNode)

			if (!nodeToCheck) return

			let problemIndex = decl.toString().length + 1
			let previousNode = /** @type {import('postcss').ChildNode} */ (nodeToCheck.prev())
			// Under `never-multi-line` the fix takes away the whitespace standing in front of the node it checks, and where an inline comment stands in front of that whitespace, the line break the whitespace opens with is what closes the comment: taking it away would put the node inside the comment's text, and the declaration it holds out of the stylesheet altogether. Nothing can be written there, so the block is left alone and the warning stands. The `always` options are in no such danger, since the break they keep or write is what closes such a comment anyway
			//
			// The semicolon stands between the declaration and that whitespace, so it is handed in with the declaration: a value ending in the break that closes its own comment is asked about with the semicolon behind it, which is where the write lands. Where a comment node stands between the two instead, the semicolon is in front of that comment rather than behind it, and there is nothing to hand in
			let isFixable = primary.startsWith(`always`) || !writesIntoInlineComment(previousNode, result, previousNode === decl ? `;` : ``)

			checker.afterOneOnly({
				source: rawNodeString(nodeToCheck),
				index: -1,
				lineCheckStr: blockString(parentRule),
				err: (m) => {
					report({
						message: m,
						node: decl,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix: isFixable
							? () => {
								if (primary.startsWith(`always`)) {
									// Trim up to the break that already stands there, whichever character it is, and add one only where none does
									let index = nodeToCheck.raws.before.search(LINE_BREAK)

									nodeToCheck.raws.before = index >= 0 ? nodeToCheck.raws.before.slice(index) : getLineBreak(root, result) + nodeToCheck.raws.before

									return
								}

								if (primary === `never-multi-line`) nodeToCheck.raws.before = ``
							}
							: undefined,
					})
				},
			})
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
