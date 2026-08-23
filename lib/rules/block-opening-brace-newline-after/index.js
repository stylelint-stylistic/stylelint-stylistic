import stylelint from "stylelint"

import { EVERY_LINE_BREAK, LINE_BREAK } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { beforeBlockString } from "../../utils/beforeBlockString/index.js"
import { blockString } from "../../utils/blockString/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { hasBlock } from "../../utils/hasBlock/index.js"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.js"
import { optionsMatches } from "../../utils/optionsMatches/index.js"
import { rawNodeString } from "../../utils/rawNodeString/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"
import { writesIntoInlineComment } from "../../utils/writesIntoInlineComment/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `block-opening-brace-newline-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
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
 * @param {import('postcss').Rule | import('postcss').AtRule} statement - The statement whose block the run stands at the head of.
 * @param {import('postcss').ChildNode} nodeToCheck - The first node of the block that is not a comment, which the run ends in front of.
 * @param {import('stylelint').PostcssResult} result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns {boolean} True where any node of that run leaves an inline comment open behind it.
 */
function fixWouldCommentOutTheBlock (statement, nodeToCheck, result) {
	for (let node = statement.first; node && node !== nodeToCheck; node = node.next()) {
		if (writesIntoInlineComment(node, result)) return true
	}

	return false
}

/**
 * Requires a newline after the opening brace of blocks.
 * @type {import('stylelint').Rule}
 */
function rule (primary, secondaryOptions, context) {
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
		 * @param {import('postcss').Rule | import('postcss').AtRule} statement - The rule or at-rule to check.
		 */
		function check (statement) {
			// Return early if blockless or has an empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			let backupCommentNextBefores = (new Map())

			/**
			 * Gets the next node with checking newlines after comment.
			 *
			 * @param {import('postcss').ChildNode | undefined} startNode - The starting node.
			 * @returns {import('postcss').ChildNode | undefined} The next non-comment node.
			 */
			function nextNode (startNode) {
				if (!startNode || !startNode.next) return

				if (startNode.type === `comment`) {
					// A bare carriage return and a form feed end a line as readily as a line feed to every syntax this plugin reads through
					let newLineMatch = LINE_BREAK.test(startNode.raws.before || ``)

					let next = startNode.next()

					if (next && newLineMatch && !LINE_BREAK.test(next.raws.before || ``)) {
						backupCommentNextBefores.set(next, next.raws.before)
						next.raws.before = startNode.raws.before
					}

					return nextNode(next)
				}

				return startNode
			}

			// Allow an end-of-line comment
			let nodeToCheck = nextNode(statement.first)

			if (!nodeToCheck) return

			let problemIndex = beforeBlockString(statement, { noRawBefore: true }).length + 1
			// The line break the `never-multi-line` fix takes away is the one that closes an inline comment standing in front of it, so taking it away would put the rest of the block inside that comment's text, and the declarations it holds out of the stylesheet altogether. Nothing can be written there, so the block is left alone and the warning stands. The `always` options are in no such danger, since the break they keep or write is what closes such a comment anyway — and nothing arrives at that half of the question here: an inline comment is closed by a break, so the whitespace in front of the node behind it always opens with one, and these options never report such a block at all. It is written for the symmetry with `declaration-block-semicolon-newline-after`, where the same short-circuit is reached and pinned
			let isFixable = primary.startsWith(`always`) || !fixWouldCommentOutTheBlock(statement, nodeToCheck, result)

			checker.afterOneOnly({
				source: rawNodeString(nodeToCheck),
				index: -1,
				lineCheckStr: blockString(statement),
				err: (m) => {
					report({
						message: m,
						node: statement,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix: isFixable
							? () => {
								let nodeToCheckRaws = nodeToCheck.raws

								if (typeof nodeToCheckRaws.before !== `string`) return

								if (primary.startsWith(`always`)) {
									// Trim up to the break that already stands there, whichever character it is, and add one only where none does
									let index = nodeToCheckRaws.before.search(LINE_BREAK)

									nodeToCheckRaws.before = index >= 0 ? nodeToCheckRaws.before.slice(index) : context.newline + nodeToCheckRaws.before

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
							}
							: undefined,
					})
				},
			})

			// Restore the `before` of the node next to the comment node.
			for (let [node, before] of backupCommentNextBefores.entries()) node.raws.before = before
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
