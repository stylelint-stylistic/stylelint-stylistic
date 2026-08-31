import type { AtRule, Node, Rule } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, LINE_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { nextNonCommentNode } from "../../utils/nextNonCommentNode/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { rawNodeString } from "../../utils/rawNodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `block-opening-brace-newline-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected newline after "{"`,
	expectedAfterMultiLine: () => `Expected newline after "{" of a multi-line block`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "{" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Asks whether the `never-multi-line` fix would take the node it checks into an inline comment.
 *
 * That fix takes every line break out of the whitespace standing in front of each node of the run the block opens with, from the first one up to the node being checked, so every node of that run is asked rather than the last alone: a block comment standing between an inline one and the declaration is carried into the inline comment along with everything behind it, and the declaration with it.
 *
 * Each node of the run is asked about the text standing behind it, since the break taken away is the one the whitespace in front of the node that follows opens with. The opening brace is asked about nothing: the only whitespace it stands behind is the one in front of the first node, and a brace inside an inline comment opens no block at all, so taking that break away can comment nothing out.
 * @param syntax - The syntax the rule is built over.
 * @param statement - The statement whose block the run stands at the head of.
 * @param nodeToCheck - The first node of the block that is not a comment, which the run ends in front of.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns True where any node of that run leaves an inline comment open behind it.
 */
function fixWouldCommentOutTheBlock (syntax: Syntax, statement: Rule | AtRule, nodeToCheck: Node, result: PostcssResult): boolean {
	for (let node = statement.first; node && node !== nodeToCheck; node = node.next()) {
		if (syntax.writesIntoInlineComment(node, result)) return true
	}

	return false
}

/**
 * Requires a newline after the opening brace of blocks.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always`, `always-multi-line` and `never-multi-line`.
 * @param secondaryOptions - The secondary options: `ignore`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `always-multi-line` | `never-multi-line`, secondaryOptions: { ignore?: `rules` | `rules`[] }): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`always`, `always-multi-line`, `never-multi-line`],
			},
			{
				actual: secondaryOptions,
				possible: {
					ignore: [`rules`],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		// Check both kinds of statement: rules and at-rules
		if (!optionsMatches(secondaryOptions, `ignore`, `rules`)) root.walkRules(check)

		root.walkAtRules(check)

		/**
		 * Checks a statement for opening brace newline violations.
		 * @param statement - The rule or at-rule to check.
		 */
		function check (statement: Rule | AtRule): void {
			// Return early if blockless or has an empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			let backupCommentNextBefores = (new Map())

			/**
			 * Carries the line break standing in front of a comment onto the node behind it.
			 *
			 * The check reads the whitespace in front of the node it is handed, and a comment standing at the head of the block is allowed to hold the break the option asks for. So the break in front of such a comment is moved onto the node the walk steps to, and the whitespace standing there in its place is filed in a map, which the fix reads back and the check restores from once it is done. A block holding nothing but comments is the one path reaching neither restore, and what this carried stays written there; that is #410, and the recursion this write was lifted out of left it standing just the same.
			 *
			 * Over a run of comments the move chains: each step reads what the step before it wrote, so a break standing anywhere inside the run reaches the node the run ends in front of, and a run holding none carries nothing. That is what lets a run of comments read as the one end-of-line comment the option allows.
			 * @param comment - The comment the walk stepped over.
			 * @param nextNode - The node standing behind that comment.
			 */
			function carryBreakPastComment (comment: Node, nextNode: Node | undefined): void {
				if (!nextNode) return

				// A line break is what PostCSS reads as one: a line feed, with or without the carriage return of a Windows pair in front of it
				if (!LINE_BREAK.test(comment.raws.before || ``) || LINE_BREAK.test(nextNode.raws.before || ``)) return

				backupCommentNextBefores.set(nextNode, nextNode.raws.before)
				nextNode.raws.before = comment.raws.before
			}

			// Allow an end-of-line comment
			let nodeToCheck = nextNonCommentNode(statement.first, carryBreakPastComment)

			if (!nodeToCheck) return

			let problemIndex = beforeBlockString(statement, result, { noRawBefore: true }).length + 1
			// The line break the `never-multi-line` fix takes away is the one that closes an inline comment standing in front of it, so taking it away would put the rest of the block inside that comment's text, and the declarations it holds out of the stylesheet altogether. Nothing can be written there, so the block is left alone and the warning stands. The `always` options are in no such danger, since the break they keep or write is what closes such a comment anyway — and nothing arrives at that half of the question here: an inline comment is closed by a break, so the whitespace in front of the node behind it always opens with one, and these options never report such a block at all. It is written for the symmetry with `declaration-block-semicolon-newline-after`, where the same short-circuit is reached and pinned
			let isFixable = primary.startsWith(`always`) || !fixWouldCommentOutTheBlock(syntax, statement, nodeToCheck, result)

			checker.afterOneOnly({
				source: rawNodeString(nodeToCheck, result),
				index: -1,
				lineCheckStr: blockString(statement, result),
				err: (m) => {
					report({
						message: m,
						node: statement,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						...(isFixable && {
							fix: (): void => {
								let nodeToCheckRaws = nodeToCheck.raws

								if (typeof nodeToCheckRaws.before !== `string`) return

								if (primary.startsWith(`always`)) {
									// Trim up to the break that already stands there, whichever character it is, and add one only where none does
									let index = nodeToCheckRaws.before.search(LINE_BREAK)

									nodeToCheckRaws.before = index >= 0 ? nodeToCheckRaws.before.slice(index) : getLineBreak(root, result) + nodeToCheckRaws.before

									backupCommentNextBefores.delete(nodeToCheck)

									return
								}

								if (primary === `never-multi-line`) {
									// Restore the `before` of the node next to the comment node.
									for (let [node, before] of backupCommentNextBefores.entries()) node.raws.before = before

									backupCommentNextBefores.clear()

									// Fix
									let fixTarget = statement.first

									while (fixTarget) {
										let fixTargetRaws = fixTarget.raws

										if (typeof fixTargetRaws.before !== `string`) continue

										if (LINE_BREAK.test(fixTargetRaws.before || ``)) fixTargetRaws.before = fixTargetRaws.before.replaceAll(EVERY_LINE_BREAK, ``)

										if (fixTarget.type !== `comment`) break

										fixTarget = fixTarget.next()
									}

									nodeToCheckRaws.before = ``
								}
							},
						}),
					})
				},
			})

			// Restore the `before` of the node next to the comment node.
			for (let [node, before] of backupCommentNextBefores.entries()) node.raws.before = before
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
