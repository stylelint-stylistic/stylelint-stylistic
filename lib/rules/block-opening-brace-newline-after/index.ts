import type { AtRule, ChildNode, Node, Rule } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, LINE_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { isOnlyWhitespace } from "../../utils/isOnlyWhitespace/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { nextNonCommentNode } from "../../utils/nextNonCommentNode/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { rawNodeString } from "../../utils/rawNodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { writesBlockAfter } from "../../utils/writesBlockAfter/index.ts"

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
 * The fix takes every line break out of the whitespace in front of each node of the run up to the checked node, so each node of the run is asked about the text behind it; a block comment between an inline one and the declaration is carried into the inline comment. Where the block holds nothing but comments the run reaches the closing brace, and the last comment is asked about it too.
 * @param syntax - The syntax asked about each node of the run.
 * @param statement - The rule or at-rule whose block is checked.
 * @param nodeToCheck - The first non-comment node of the block, or nothing where it holds none.
 * @param result - The Stylelint result.
 * @returns True where a node of the run leaves an inline comment open.
 */
function fixWouldCommentOutTheBlock (syntax: Syntax, statement: Rule | AtRule, nodeToCheck: Node | null, result: PostcssResult): boolean {
	for (let node = statement.first; node && node !== nodeToCheck; node = node.next()) {
		if (syntax.writesIntoInlineComment(node, result)) return true
	}

	return false
}

/**
 * The run the closing brace of a block holding nothing but comments stands behind.
 *
 * Such a block has that brace where the checked node would stand, so the carry chains onto it: the block's own trailing raw takes the break in front of it exactly as a node's `raws.before` would ([#672](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/672)).
 * @param statement - The rule or at-rule whose block holds nothing but comments.
 * @returns The trailing raw, or the run carried past the last comment.
 */
function runInFrontOfTheClosingBrace (statement: Rule | AtRule): string {
	let after = getBlockAfter(statement) ?? ``
	let lastBefore = statement.last?.raws.before ?? ``

	return (!LINE_BREAK.test(after) && LINE_BREAK.test(lastBefore)) ? lastBefore : after
}

/**
 * Writes the run in front of the closing brace of a block holding nothing but comments, and takes the breaks out of the comments' own whitespace where the option refuses them, the last of them being the one carried onto that brace.
 * @param statement - The rule or at-rule whose block holds nothing but comments.
 * @param nodes - The comments it holds.
 * @param written - The run to write.
 * @param takeTheBreaksOut - Whether the comments' whitespace loses its breaks too.
 */
function writeTheTrailingRun (statement: Rule | AtRule, nodes: ChildNode[], written: string, takeTheBreaksOut: boolean): void {
	if (takeTheBreaksOut) {
		for (let node of nodes) {
			let before = node.raws.before

			if (typeof before === `string`) node.raws.before = before.replaceAll(EVERY_LINE_BREAK, ``)
		}
	}

	setBlockAfter(statement, written)
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

			let { nodes } = statement
			let backupCommentNextBefores = (new Map())

			/**
			 * Carries the line break in front of a comment onto the node behind it.
			 *
			 * A comment at the head of the block may hold the break the option asks for, so its break is moved onto the next node, and the whitespace it replaces is filed in a map the fix reads back and the check restores from before it returns ([#410](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/410)). Over a run of comments the move chains.
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

			/** Puts back the whitespace the carry wrote over. */
			function restoreCarriedBreaks (): void {
				for (let [node, before] of backupCommentNextBefores.entries()) node.raws.before = before

				backupCommentNextBefores.clear()
			}

			// Allow an end-of-line comment
			let nodeToCheck = nextNonCommentNode(statement.first, carryBreakPastComment)
			let problemIndex = beforeBlockString(statement, result, { noRawBefore: true }).length + 1
			// Taking away the break closing an inline comment would put the rest of the block inside it, so the `never-multi-line` warning stands unfixed there. The `always` options never report such a block; the short-circuit mirrors `declaration-block-semicolon-newline-after`, where it is reached and pinned
			let fix = primary.startsWith(`always`) || !fixWouldCommentOutTheBlock(syntax, statement, nodeToCheck, result)
				? (nodeToCheck === null ? fixTheTrailingRun() : fixTheCheckedRun(nodeToCheck))
				: undefined

			checker.afterOneOnly({
				// A block closes on `}` in every syntax the plugin reads, and all the check asks of that character is that it is not whitespace
				source: nodeToCheck ? rawNodeString(nodeToCheck, result) : `${runInFrontOfTheClosingBrace(statement)}}`,
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
						...(fix && { fix }),
					})
				},
			})

			restoreCarriedBreaks()

			/**
			 * Builds the fix that spells the run in front of the closing brace of a block holding nothing but comments.
			 *
			 * A run holding anything the plugin does not read as whitespace is left alone. The four rules reading it part on a stray semicolon — two measure the run with it cut out, one reads the character in front of the brace, and this one the run's first character — so no one spelling answers them all; and a vertical tab or a no-break space is a word to the tokenizer that no write may drop ([#655](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/655)).
			 * @returns The fix, or nothing where the run is not this rule's to write.
			 */
			function fixTheTrailingRun (): (() => void) | undefined {
				let standing = getBlockAfter(statement)

				if (typeof standing !== `string` || !isOnlyWhitespace(standing)) return

				let index = standing.search(LINE_BREAK)
				// Trim to the break already there, or add one, as `block-closing-brace-newline-before` spells the same raw
				let written = primary.startsWith(`always`)
					? (index >= 0 ? standing.slice(index) : getLineBreak(syntax, root, result) + standing)
					: ``
				// The `always` write opens the run with a break; the `never-multi-line` one takes every break out of the block's whitespace, so only a comment's own text can leave the block multi-line
				let isSingleLine = primary === `never-multi-line` && nodes.every((node) => isSingleLineString(nodeString(node, result)))

				if (!writesBlockAfter(syntax, result, primary, isSingleLine)) return

				return (): void => {
					if (primary === `never-multi-line`) restoreCarriedBreaks()

					writeTheTrailingRun(statement, nodes, written, primary === `never-multi-line`)
				}
			}

			/**
			 * Builds the fix that spells the run in front of the checked node.
			 * @param nodeToFix - The first non-comment node of the block.
			 * @returns The fix.
			 */
			function fixTheCheckedRun (nodeToFix: Node): () => void {
				return (): void => {
					let nodeToFixRaws = nodeToFix.raws

					if (typeof nodeToFixRaws.before !== `string`) return

					if (primary.startsWith(`always`)) {
						// Trim to the break already there, or add one
						let index = nodeToFixRaws.before.search(LINE_BREAK)

						nodeToFixRaws.before = index >= 0 ? nodeToFixRaws.before.slice(index) : getLineBreak(syntax, root, result) + nodeToFixRaws.before

						backupCommentNextBefores.delete(nodeToFix)

						return
					}

					if (primary === `never-multi-line`) {
						restoreCarriedBreaks()

						let fixTarget = statement.first

						while (fixTarget) {
							let fixTargetRaws = fixTarget.raws

							if (typeof fixTargetRaws.before !== `string`) continue

							if (LINE_BREAK.test(fixTargetRaws.before || ``)) fixTargetRaws.before = fixTargetRaws.before.replaceAll(EVERY_LINE_BREAK, ``)

							if (fixTarget.type !== `comment`) break

							fixTarget = fixTarget.next()
						}

						nodeToFixRaws.before = ``
					}
				}
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
