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
 * Asks whether the `never-multi-line` fix would take the checked node into an inline comment.
 *
 * The fix takes every line break out of the whitespace in front of each node of the run up to the checked node, so each node of the run is asked about the text behind it; a block comment between an inline one and the declaration is carried into the inline comment. The brace is asked about nothing, since a brace inside an inline comment opens no block.
 * @param syntax - The syntax asked about each node of the run.
 * @param statement - The rule or at-rule whose block is checked.
 * @param nodeToCheck - The first non-comment node of the block.
 * @param result - The Stylelint result.
 * @returns True where a node of the run leaves an inline comment open.
 */
function fixWouldCommentOutTheBlock (syntax: Syntax, statement: Rule | AtRule, nodeToCheck: Node, result: PostcssResult): boolean {
	for (let node = statement.first; node && node !== nodeToCheck; node = node.next()) {
		if (syntax.writesIntoInlineComment(node, result)) return true
	}

	return false
}

/** `always` a newline after the opening brace; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line block only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/** The secondary options. */
export type SecondaryOptions = {

	/** `rules` passes the opening brace of a rule over. */
	ignore?: `rules` | `rules`[],
}

/**
 * Requires a newline after the opening brace of blocks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions): RuleCheck {
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

		if (!optionsMatches(secondaryOptions, `ignore`, `rules`)) root.walkRules(check)

		root.walkAtRules(check)

		/**
		 * Checks the opening brace of one statement.
		 * @param statement - The rule or at-rule.
		 */
		function check (statement: Rule | AtRule): void {
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			let backupCommentNextBefores = (new Map())

			/**
			 * Carries the line break in front of a comment onto the node behind it.
			 *
			 * A comment at the head of the block may hold the break the option asks for, so its break is moved onto the next node, and the whitespace it replaces is filed in a map the fix reads back and the check restores from; a block of comments alone reaches neither restore, and the carried break stays written ([#410](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/410)). Over a run of comments the move chains.
			 * @param comment - The comment stepped over.
			 * @param nextNode - The node behind it.
			 */
			function carryBreakPastComment (comment: Node, nextNode: Node | undefined): void {
				if (!nextNode) return

				// PostCSS reads a line feed as a break, with or without a carriage return in front
				if (!LINE_BREAK.test(comment.raws.before || ``) || LINE_BREAK.test(nextNode.raws.before || ``)) return

				backupCommentNextBefores.set(nextNode, nextNode.raws.before)
				nextNode.raws.before = comment.raws.before
			}

			// Allow an end-of-line comment
			let nodeToCheck = nextNonCommentNode(statement.first, carryBreakPastComment)

			if (!nodeToCheck) return

			let problemIndex = beforeBlockString(statement, result, { noRawBefore: true }).length + 1
			// Taking away the break closing an inline comment would put the rest of the block inside it, so the `never-multi-line` warning stands unfixed there. The `always` options never report such a block; the short-circuit mirrors `declaration-block-semicolon-newline-after`, where it is reached and pinned
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
									// Trim to the break already there, or add one
									let index = nodeToCheckRaws.before.search(LINE_BREAK)

									nodeToCheckRaws.before = index >= 0 ? nodeToCheckRaws.before.slice(index) : getLineBreak(syntax, root, result) + nodeToCheckRaws.before

									backupCommentNextBefores.delete(nodeToCheck)

									return
								}

								if (primary === `never-multi-line`) {
									// Restore the carried breaks
									for (let [node, before] of backupCommentNextBefores.entries()) node.raws.before = before

									backupCommentNextBefores.clear()

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

			// Restore the carried breaks
			for (let [node, before] of backupCommentNextBefores.entries()) node.raws.before = before
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
