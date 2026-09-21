import type { AtRule, ChildNode, Node, Rule } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, LEADING_CSS_WHITESPACE, LINE_BREAK } from "../../regexps.ts"
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
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { nextNonCommentNode } from "../../utils/nextNonCommentNode/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInFrontOf } from "../../utils/runInFrontOf/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"
import { isAtRule } from "../../utils/typeGuards/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { writesBlockAfter } from "../../utils/writesBlockAfter/index.ts"
import { writesTwinRun } from "../../utils/writesTwinRun/index.ts"

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
 * Such a block has that brace where the checked node would stand, so the carry chains onto it: the block's own trailing raw takes the break in front of it exactly as a node's `raws.before` would ([#672](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/672)). The last comment's run is read the way every other is, so a comment carrying no raw is the run PostCSS prints in front of it ([#680](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/680)).
 * @param syntax - The syntax the rule is built over, which the raw is read through.
 * @param statement - The rule or at-rule whose block holds nothing but comments.
 * @returns The trailing raw, or the run carried past the last comment.
 */
function runInFrontOfTheClosingBrace (syntax: Syntax, statement: Rule | AtRule): string {
	let after = getBlockAfter(syntax, statement) ?? ``
	let lastBefore = statement.last ? runInFrontOf(statement.last) : ``

	return (!LINE_BREAK.test(after) && LINE_BREAK.test(lastBefore)) ? lastBefore : after
}

/**
 * Takes the line breaks out of the run in front of a node.
 *
 * A node carrying no raw is written the empty run rather than left alone, since PostCSS prints a run of its own in front of one and `never-multi-line`, the only option that asks for this, wants no whitespace there at all ([#411](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/411)).
 * @param node - The node whose leading run loses its breaks.
 */
function unbreakTheRunInFrontOf (node: Node): void {
	let { before } = node.raws

	if (typeof before !== `string`) node.raws.before = ``
	else if (LINE_BREAK.test(before)) node.raws.before = before.replaceAll(EVERY_LINE_BREAK, ``)
}

/**
 * Spells a run the rule reads: the one in front of the first node that is no comment, or the one in front of the closing brace of a block holding nothing but comments.
 *
 * The rule reads the run's first character, so what it spells is the whitespace the run opens with, and whatever stands behind that whitespace is kept as it is: a stray semicolon is no whitespace, and no write may drop it ([#655](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/655)).
 * @param primary - The primary option.
 * @param standing - The run as it stands.
 * @param lineBreak - Returns the break the file is written with, called only where a break is written.
 * @returns The run to write.
 */
function spellTheRun (primary: PrimaryOption, standing: string, lineBreak: () => string): string {
	let kept = standing.replace(LEADING_CSS_WHITESPACE, ``)

	if (primary === `never-multi-line`) return kept

	let opening = standing.slice(0, standing.length - kept.length)
	let index = opening.search(LINE_BREAK)

	// Trim to the break already there, or add one, as `block-closing-brace-newline-before` spells a run of whitespace alone
	return (index >= 0 ? opening.slice(index) : lineBreak() + opening) + kept
}

/**
 * Spells the run in front of a node a comment's break was carried onto, which the `always` options read in that comment's run and write in front of the node.
 *
 * The break and the whitespace behind it are the comment's run's, and what the node's own run holds behind its whitespace is kept: a stray semicolon standing in either run is no whitespace, so the write neither drops the node's nor copies the comment's (1789998855).
 * @param carried - The comment's run, which holds a break.
 * @param own - The node's own run, or nothing where it carries no raw.
 * @returns The run to write.
 */
function spellTheCarriedRun (carried: string, own: string | undefined): string {
	let fromTheBreak = carried.slice(carried.search(LINE_BREAK))

	return fromTheBreak.slice(0, fromTheBreak.length - fromTheBreak.replace(LEADING_CSS_WHITESPACE, ``).length) + (own ?? ``).replace(LEADING_CSS_WHITESPACE, ``)
}

/**
 * Writes the run in front of the closing brace of a block holding nothing but comments, and takes the breaks out of the comments' own whitespace where the option refuses them, the last of them being the one carried onto that brace.
 * @param syntax - The syntax the rule is built over, which the raw is written through.
 * @param statement - The rule or at-rule whose block holds nothing but comments.
 * @param nodes - The comments it holds.
 * @param written - The run to write.
 * @param takeTheBreaksOut - Whether the comments' whitespace loses its breaks too.
 */
function writeTheTrailingRun (syntax: Syntax, statement: Rule | AtRule, nodes: ChildNode[], written: string, takeTheBreaksOut: boolean): void {
	if (takeTheBreaksOut) {
		for (let node of nodes) unbreakTheRunInFrontOf(node)
	}

	setBlockAfter(syntax, statement, written)
}

/**
 * Asks whether this rule, rather than its space twin, writes the run behind the opening brace ([#704](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/704)).
 *
 * The twin writes that run, the block's first node's, whenever it reports. This rule spells it only where it is the run it checks: its `always` options write a break into the run in front of the first node that is not a comment, and `never-multi-line` takes the whitespace that one opens with off it. Behind a comment it writes the first node's run too, but only by taking the breaks out of it, which leaves a space the twin wrote standing and is left standing by a space the twin writes after.
 * @param statement - The rule or at-rule whose block is checked.
 * @param result - The Stylelint result, which holds the configuration.
 * @param ruleName - This rule's configured name.
 * @param primary - This rule's primary option.
 * @param nodeToCheck - The first non-comment node of the block, or nothing where it holds none.
 * @param problemIndex - Where the opening brace stands in the statement.
 * @returns True where this rule writes it.
 */
function writesTheRunBehindTheBrace (statement: Rule | AtRule, result: PostcssResult, ruleName: string, primary: PrimaryOption, nodeToCheck: Node | null, problemIndex: number): boolean {
	let first = statement.first

	if (!first || first !== nodeToCheck) return true

	return writesTwinRun(shortName, ruleName, statement, result, {
		side: `after`,
		run: runInFrontOf(first),
		lineText: blockString(statement, result),
		runs: () => [runInFrontOf(first)],
		line: statement.rangeBy({ index: problemIndex }).start.line,
		// `ignore: at-rules` passes the twin over an at-rule's brace
		twinWrites: (_twinOption, secondary) => !(isAtRule(statement) && optionsMatches(secondary, `ignore`, `at-rules`)),
	})
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

				let carried = runInFrontOf(comment)

				// PostCSS reads a line feed as a break, with or without a carriage return in front
				if (!LINE_BREAK.test(carried) || LINE_BREAK.test(runInFrontOf(nextNode))) return

				backupCommentNextBefores.set(nextNode, nextNode.raws.before)
				nextNode.raws.before = carried
			}

			/** Puts back the whitespace the carry wrote over, a missing raw missing, so that the check leaves the tree as it found it. */
			function restoreCarriedBreaks (): void {
				for (let [node, before] of backupCommentNextBefores.entries()) {
					if (before === undefined) delete node.raws.before
					else node.raws.before = before
				}

				backupCommentNextBefores.clear()
			}

			// Allow an end-of-line comment
			let nodeToCheck = nextNonCommentNode(statement.first, carryBreakPastComment)
			let problemIndex = beforeBlockString(statement, result, { noRawBefore: true }).length + 1
			// Taking away the break closing an inline comment would put the rest of the block inside it, so the `never-multi-line` warning stands unfixed there. The `always` options never report such a block; the short-circuit mirrors `declaration-block-semicolon-newline-after`, where it is reached and pinned
			let fix = writesTheRunBehindTheBrace(statement, result, ruleName, primary, nodeToCheck, problemIndex) && (primary.startsWith(`always`) || !fixWouldCommentOutTheBlock(syntax, statement, nodeToCheck, result))
				? (nodeToCheck === null ? fixTheTrailingRun() : fixTheCheckedRun(nodeToCheck))
				: undefined

			checker.afterOneOnly({
				// A block closes on `}` in every syntax the plugin reads, and all the check asks of that character is that it is not whitespace
				source: nodeToCheck ? runInFrontOf(nodeToCheck) + nodeString(nodeToCheck, result) : `${runInFrontOfTheClosingBrace(syntax, statement)}}`,
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
			 * @returns The fix, or nothing where the run is not this rule's to write.
			 */
			function fixTheTrailingRun (): (() => void) | undefined {
				let standing = getBlockAfter(syntax, statement)

				if (typeof standing !== `string`) return

				let written = spellTheRun(primary, standing, () => getLineBreak(root, result))
				// The `always` write opens the run with a break; the `never-multi-line` one takes every break out of the block's whitespace in front of what it keeps, so only a comment's own text or a break behind a stray semicolon can leave the block multi-line
				let isSingleLine = primary === `never-multi-line` && !LINE_BREAK.test(written) && nodes.every((node) => isSingleLineString(nodeString(node, result)))

				if (!writesBlockAfter(statement, result, primary, isSingleLine)) return

				return (): void => {
					if (primary === `never-multi-line`) restoreCarriedBreaks()

					writeTheTrailingRun(syntax, statement, nodes, written, primary === `never-multi-line`)
				}
			}

			/**
			 * Builds the fix that spells the run in front of the checked node.
			 *
			 * The run the fix reads is the one the check read, so a node carrying no raw is written the run PostCSS would have printed in front of it, trimmed or opened as the option asks ([#680](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/680)).
			 * @param nodeToFix - The first non-comment node of the block.
			 * @returns The fix.
			 */
			function fixTheCheckedRun (nodeToFix: Node): () => void {
				return (): void => {
					let nodeToFixRaws = nodeToFix.raws

					if (primary.startsWith(`always`)) {
						let standing = runInFrontOf(nodeToFix)

						nodeToFixRaws.before = backupCommentNextBefores.has(nodeToFix)
							? spellTheCarriedRun(standing, backupCommentNextBefores.get(nodeToFix))
							: spellTheRun(primary, standing, () => getLineBreak(root, result))

						backupCommentNextBefores.delete(nodeToFix)

						return
					}

					if (primary === `never-multi-line`) {
						restoreCarriedBreaks()

						// The comments in front lose their breaks; the checked node's run loses the whitespace it opens with, and a stray semicolon behind it stays with whatever follows it (1789998855)
						for (let comment = statement.first; comment && comment !== nodeToFix; comment = comment.next()) unbreakTheRunInFrontOf(comment)

						nodeToFixRaws.before = spellTheRun(primary, nodeToFixRaws.before ?? ``, () => ``)
					}
				}
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
