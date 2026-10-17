import type { AtRule, ChildNode, Node, Rule } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, LEADING_CSS_WHITESPACE, LINE_BREAK, OPENS_WITH_LINE_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import type { RunWrites } from "../../utils/closingBraceRunWrites/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { nextNonCommentNode } from "../../utils/nextNonCommentNode/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { openingBraceRunWrites } from "../../utils/openingBraceRunWrites/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInFrontOf } from "../../utils/runInFrontOf/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"
import { type LineEdit, releasesAKeptSemicolon, straySemicolonsTaken, straySemicolonsTakenBefore, withoutTaken, writtenAsLeft } from "../../utils/straySemicolonsTaken/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { heldByABreakBeforeTheBrace, writesBlockAfter } from "../../utils/writesBlockAfter/index.ts"

let { utils: { validateOptions } } = stylelint

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
 * Such a block has that brace where the checked node would stand, so the carry chains onto it: the block's own trailing raw takes the break in front of it exactly as a node's `raws.before` would. The last comment's run is read the way every other is, so a comment carrying no raw is the run PostCSS prints in front of it. The carry is asked of the whitespace the raw opens with, since a break behind a stray semicolon is no break after the comment, and of the raw as `no-extra-semicolons` leaves it, so that the verdict is one whichever side of that rule this one is listed.
 * @param syntax - The syntax the rule is built over, which the raw is read through.
 * @param statement - The rule or at-rule whose block holds nothing but comments.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The trailing raw, or the run carried past the last comment.
 */
function runInFrontOfTheClosingBrace (syntax: Syntax, statement: Rule | AtRule, result: PostcssResult): string {
	let after = withoutTaken(getBlockAfter(syntax, statement) ?? ``, straySemicolonsTaken(statement, result))
	let lastBefore = statement.last ? runInFrontOf(statement.last) : ``

	return (!OPENS_WITH_LINE_BREAK.test(after) && LINE_BREAK.test(lastBefore)) ? lastBefore : after
}

/**
 * Reads something of a node against its own run rather than the one a comment's break was carried onto it with.
 * @param node - The node.
 * @param carried - The runs the carry wrote over, by node.
 * @param read - What is read.
 * @returns What it read.
 */
function withOwnRun<T> (node: Node, carried: Map<Node, string | undefined>, read: () => T): T {
	if (!carried.has(node)) return read()

	let written = node.raws.before
	let own = carried.get(node)

	if (typeof own === `string`) node.raws.before = own
	else delete node.raws.before

	try {
		return read()
	}
	finally {
		node.raws.before = written
	}
}

/**
 * Counts the breaks of the whitespace a run opens with.
 * @param run - The run.
 * @returns The count.
 */
function breaksOpening (run: string): number {
	return (run.match(LEADING_CSS_WHITESPACE)?.[0].match(EVERY_LINE_BREAK) ?? []).length
}

/**
 * Counts the breaks of a run.
 * @param run - The run.
 * @returns The count.
 */
function breaksOf (run: string): number {
	return (run.match(EVERY_LINE_BREAK) ?? []).length
}

/**
 * The edits a write of the run in front of the checked node or of the closing brace makes to the breaks at the head of a block: the breaks it adds to the whitespace the run opens with or takes out of it, counted without the semicolons the neighbor takes and filed at the run's start, since nothing but whitespace and such semicolons stands in front of them, and under `never-multi-line` every break of the comments' runs in front, each where it stands, which that write takes out.
 * @param statement - The rule or at-rule.
 * @param primary - The primary option.
 * @param carried - The runs the carry wrote over, by node.
 * @param run - The run as it stands.
 * @param writtenBreaks - The breaks of the whitespace the written run opens with, the semicolons the neighbor takes left out.
 * @param taken - The semicolons of the run the neighbor takes out.
 * @param runEnd - Where the run ends in the file, if it has a place.
 * @param upTo - The node the run stands in front of; the closing brace where none is given.
 * @returns The edits.
 */
function headEdits (statement: Rule | AtRule, primary: string, carried: Map<Node, string | undefined>, run: string, writtenBreaks: number, taken: Set<number>, runEnd: { offset: number | undefined, line: number | undefined } | undefined, upTo?: Node): LineEdit[] {
	let edits: LineEdit[] = []

	/**
	 * Files an edit at the start of a run ending where given.
	 * @param own - The run.
	 * @param end - Where it ends.
	 * @param delta - The breaks added.
	 */
	function edit (own: string, end: { offset: number | undefined, line: number | undefined } | undefined, delta: number): void {
		if (delta !== 0 && end?.offset !== undefined && end.line !== undefined) edits.push({ offset: end.offset - own.length, line: end.line - breaksOf(own), delta })
	}

	if (primary === `never-multi-line`) {
		for (let node = statement.first; node && node !== upTo; node = node.next()) {
			let own = withOwnRun(node, carried, () => node.raws.before)
			let start = node.source?.start

			// Every break of a comment's run goes, each where it stands
			if (typeof own === `string` && start?.offset !== undefined) {
				for (let match of own.matchAll(EVERY_LINE_BREAK)) edits.push({ offset: start.offset - own.length + match.index, line: start.line - breaksOf(own.slice(match.index)), delta: -1 })
			}
		}
	}

	edit(run, runEnd, writtenBreaks - breaksOpening(withoutTaken(run, taken)))

	return edits
}

/**
 * Asks whether a write releases a stray semicolon a disable comment keeps from `no-extra-semicolons` anywhere in the stylesheet, reading the runs a comment's break was carried onto as their own; the author chose to keep such a semicolon, and the write would hand it to that rule after all.
 * @param statement - The rule or at-rule.
 * @param carried - The runs the carry wrote over, by node.
 * @param result - The Stylelint result.
 * @param edits - The write's edits.
 * @returns True where it does.
 */
function releasesAKeptSemicolonAnywhere (statement: Rule | AtRule, carried: Map<Node, string | undefined>, result: PostcssResult, edits: LineEdit[]): boolean {
	let written: Map<Node, string | undefined> = new Map()

	for (let [node, own] of carried) {
		written.set(node, node.raws.before)

		if (typeof own === `string`) node.raws.before = own
		else delete node.raws.before
	}

	try {
		return releasesAKeptSemicolon(statement.root(), result, edits)
	}
	finally {
		for (let [node, run] of written) {
			if (run === undefined) delete node.raws.before
			else node.raws.before = run
		}
	}
}

/**
 * Takes the line breaks out of the run in front of a node.
 *
 * A node carrying no raw is written the empty run rather than left alone, since PostCSS prints a run of its own in front of one and `never-multi-line`, the only option that asks for this, wants no whitespace there at all.
 * @param node - The node whose leading run loses its breaks.
 */
function unbreakTheRunInFrontOf (node: Node): void {
	let { before } = node.raws

	if (typeof before !== `string`) node.raws.before = ``
	else if (LINE_BREAK.test(before)) node.raws.before = before.replaceAll(EVERY_LINE_BREAK, ``)
}

/**
 * Spells the run in front of a node a comment's break was carried onto, which the `always` options read in that comment's run and write in front of the node.
 *
 * The break and the whitespace behind it are the comment's run's, and what the node's own run holds behind its whitespace is kept: a stray semicolon standing in either run is no whitespace, so the write neither drops the node's nor copies the comment's.
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
	if (takeTheBreaksOut) unbreakTheCommentRuns(nodes)

	setBlockAfter(syntax, statement, written)
}

/**
 * Takes the breaks out of the whitespace in front of every comment of a block holding nothing but comments.
 * @param nodes - The comments it holds.
 */
function unbreakTheCommentRuns (nodes: ChildNode[]): void {
	for (let node of nodes) unbreakTheRunInFrontOf(node)
}

/**
 * Writes the run behind the opening brace of a block holding nothing but comments, asked of the first comment the way a block holding a node asks that run of the first node it checks. Only that first comment's run is written, so a run of comments keeps the spaces standing between them and loses nothing else.
 * @param checked - The comment the run behind the opening brace is read from.
 * @param primary - The primary option.
 * @param writes - The runs the options write.
 * @param result - The Stylelint result.
 */
function writeTheRunBehindTheOpeningBrace (checked: ChildNode, primary: string, writes: RunWrites, result: PostcssResult): void {
	checked.raws.before = writtenAsLeft((run) => writes.newline(primary, run), checked.raws.before ?? ``, straySemicolonsTakenBefore(checked, result))
}

/**
 * Asks which comment of a block holding nothing but comments the rule reads the run behind the opening brace from.
 *
 * `never-multi-line` names the run right behind the opening brace and reads it always: the run before the closing brace of a block holding nothing but comments is the last comment's own run, so reading that row reports a whitespace the block does not carry and takes away a break the block does carry — a block whose only comment abuts the opening brace and a break stands before the closing one carries no whitespace after `{` and was reported, while the same block with a space before the closing brace carries one and passed over only because the block came out on one line. It also leaves the pair with a neighbor writing a space into that row standing, since the rule cannot write a row the neighbor holds.
 *
 * The `always` options carry a comment's break onto the node behind it, and a block holding nothing but comments has no such node, so they read the row before the closing brace: that is where the carry would have put the break. Where a neighbor holds that row asking for a break, no spelling of it satisfies both, and the rule judges the run behind the opening brace instead and leaves the row to the neighbor — a comment sitting right behind the opening brace with a break before the closing one satisfies the pair, while the rule writing the row itself would leave the whole block on one line for the neighbor to break up again.
 *
 * No carry of a break along the comments writes over the first one's own run, so the comment handed back is the run's own reader. The block is asked as it stands and not as the write would leave it, since a run left standing is the one the neighbor puts a break in front of.
 * @param syntax - The syntax the rule is built over, which the raw is read through.
 * @param statement - The rule or at-rule whose block holds nothing but comments.
 * @param result - The Stylelint result, which holds the configuration.
 * @param primary - The primary option.
 * @param nodes - The comments the block holds.
 * @returns The first comment of the block, or nothing where the row is this rule's to write.
 */
function judgedBehindTheOpeningBrace (syntax: Syntax, statement: Rule | AtRule, result: PostcssResult, primary: string, nodes: ChildNode[]): ChildNode | undefined {
	if (statement.first === undefined) return
	if (primary === `never-multi-line`) return statement.first

	let standing = getBlockAfter(syntax, statement)

	if (typeof standing !== `string`) return
	if (!heldByABreakBeforeTheBrace(statement, result, primary, !LINE_BREAK.test(standing) && nodes.every((node) => isSingleLineString(nodeString(node, result))), standing)) return

	return statement.first
}

/**
 * Reads the run the rule judges in a block: the one in front of the first node that is not a comment, or, in a block holding nothing but comments, the one behind the opening brace where a neighbor holds the row before the closing brace, and the one before the closing brace otherwise.
 * @param syntax - The syntax the rule is built over, which the raw is read through.
 * @param statement - The rule or at-rule being checked.
 * @param result - The Stylelint result, which holds the configuration.
 * @param nodeToCheck - The first non-comment node of the block, or nothing where it holds none.
 * @param behindBrace - The comment the run behind the opening brace is read from, where a neighbor holds that row.
 * @returns The run.
 */
function runJudgedIn (syntax: Syntax, statement: Rule | AtRule, result: PostcssResult, nodeToCheck: Node | null, behindBrace: ChildNode | undefined): string {
	if (nodeToCheck) return runInFrontOf(nodeToCheck) + nodeString(nodeToCheck, result)
	if (behindBrace) return runInFrontOf(behindBrace) + nodeString(behindBrace, result)

	// A block closes on `}` in every syntax the plugin reads, and all the check asks of that character is that it is not whitespace
	return `${runInFrontOfTheClosingBrace(syntax, statement, result)}}`
}

/**
 * Reports a problem in front of the opening brace, at the character behind it, with the fix riding along where the run may be written.
 * @param message - The message.
 * @param ruleName - The configured name.
 * @param statement - The rule or at-rule being checked.
 * @param problemIndex - Where the run behind the opening brace starts.
 * @param result - The Stylelint result.
 * @param fix - The fix, where there is one.
 */
function reportAfterOpeningBrace (message: string, ruleName: string, statement: Rule | AtRule, problemIndex: number, result: PostcssResult, fix: (() => void) | undefined): void {
	report({ message, ruleName, node: statement, index: problemIndex, endIndex: problemIndex, result, ...(fix && { fix }) })
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

		let writes = openingBraceRunWrites(() => getLineBreak(root, result))

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
			 * A comment at the head of the block may hold the break the option asks for, so its break is moved onto the next node, and the whitespace it replaces is filed in a map the fix reads back and the check restores from before it returns. Over a run of comments the move chains.
			 * @param comment - The comment stepped over.
			 * @param nextNode - The node behind it.
			 */
			function carryBreakPastComment (comment: Node, nextNode: Node | undefined): void {
				if (!nextNode) return

				let carried = runInFrontOf(comment)

				// PostCSS reads a line feed as a break, with or without a carriage return in front; the node's run is asked of the whitespace it opens with, since a break behind a stray semicolon there is no break in front of the node
				// The node's run as `no-extra-semicolons` leaves it, so that the verdict is one whichever side of that rule this one is listed
				if (!LINE_BREAK.test(carried) || OPENS_WITH_LINE_BREAK.test(withoutTaken(runInFrontOf(nextNode), straySemicolonsTakenBefore(nextNode, result)))) return

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
			let behindBrace = nodeToCheck === null ? judgedBehindTheOpeningBrace(syntax, statement, result, primary, nodes) : undefined
			// Taking away the break closing an inline comment would put the rest of the block inside it, so the `never-multi-line` warning stands unfixed there. The `always` options never report such a block; the short-circuit mirrors `declaration-block-semicolon-newline-after`, where it is reached and pinned
			let fix = primary.startsWith(`always`) || !fixWouldCommentOutTheBlock(syntax, statement, nodeToCheck, result)
				? (nodeToCheck === null ? fixTheTrailingRun(behindBrace) : fixTheCheckedRun(nodeToCheck))
				: undefined

			checker.afterOneOnly({
				source: runJudgedIn(syntax, statement, result, nodeToCheck, behindBrace),
				index: -1,
				lineCheckStr: blockString(statement, result),
				err: (m) => reportAfterOpeningBrace(m, ruleName, statement, problemIndex, result, fix),
			})

			restoreCarriedBreaks()

			/**
			 * Builds the fix that spells the run in front of the closing brace of a block holding nothing but comments, or, where the option names the row behind the opening brace or a neighbor holds the one before the closing brace, only that row.
			 * @param judgedBehind - The comment the run behind the opening brace is read from, or nothing where the row is this rule's to write.
			 * @returns The fix, or nothing where the run is not this rule's to write or the write would release a stray semicolon a disable comment keeps.
			 */
			function fixTheTrailingRun (judgedBehind: ChildNode | undefined): (() => void) | undefined {
				let standing = getBlockAfter(syntax, statement)

				if (typeof standing !== `string`) return

				let taken = straySemicolonsTaken(statement, result)
				let written = writtenAsLeft((run) => writes.newline(primary, run), standing, taken)
				// The `always` write opens the run with a break; the `never-multi-line` one takes every break out of the block's whitespace in front of what it keeps, so only a comment's own text or a break behind a stray semicolon can leave the block multi-line
				let isSingleLine = primary === `never-multi-line` && !LINE_BREAK.test(written) && nodes.every((node) => isSingleLineString(nodeString(node, result)))
				// The run the fix spells is the one the check read, so a write takes the row out and leaves the other alone
				let own = judgedBehind ? runInFrontOf(judgedBehind) : standing
				// A run left standing is the one the neighbor puts a break in front of, so the break count is the one standing there
				let writtenBreaks = judgedBehind ? breaksOpening(own) : breaksOpening(writes.newline(primary, withoutTaken(standing, taken)))
				// Where the run stands in front of a comment it ends where that comment starts; a stray semicolon a disable comment keeps from `no-extra-semicolons` is the author's to keep, and where the run stands in front of the closing brace the block's end offset stands behind its brace
				let end = judgedBehind ? judgedBehind.source?.start : statement.source?.end && { offset: statement.source.end.offset === undefined ? undefined : statement.source.end.offset - 1, line: statement.source.end.line }

				if ((!judgedBehind && !writesBlockAfter(statement, result, primary, isSingleLine, standing)) || releasesAKeptSemicolonAnywhere(statement, backupCommentNextBefores, result, headEdits(statement, primary, backupCommentNextBefores, own, writtenBreaks, taken, end, judgedBehind))) return

				return (): void => {
					if (primary === `never-multi-line`) restoreCarriedBreaks()

					if (judgedBehind) writeTheRunBehindTheOpeningBrace(judgedBehind, primary, writes, result)
					else writeTheTrailingRun(syntax, statement, nodes, written, primary === `never-multi-line`)
				}
			}

			/**
			 * Builds the fix that spells the run in front of the checked node.
			 *
			 * The run the fix reads is the one the check read, so a node carrying no raw is written the run PostCSS would have printed in front of it, trimmed or opened as the option asks.
			 * @param nodeToFix - The first non-comment node of the block.
			 * @returns The fix, or nothing where it would move a semicolon a disable comment keeps out of the comment's reach.
			 */
			function fixTheCheckedRun (nodeToFix: Node): (() => void) | undefined {
				let own = withOwnRun(nodeToFix, backupCommentNextBefores, () => runInFrontOf(nodeToFix))
				let taken = withOwnRun(nodeToFix, backupCommentNextBefores, () => straySemicolonsTakenBefore(nodeToFix, result))
				let writtenBreaks = breaksOpening(primary.startsWith(`always`) && backupCommentNextBefores.has(nodeToFix) ? spellTheCarriedRun(runInFrontOf(nodeToFix), backupCommentNextBefores.get(nodeToFix)) : writes.newline(primary, withoutTaken(own, taken)))

				if (releasesAKeptSemicolonAnywhere(statement, backupCommentNextBefores, result, headEdits(statement, primary, backupCommentNextBefores, own, writtenBreaks, taken, nodeToFix.source?.start, nodeToFix))) return

				return (): void => {
					let nodeToFixRaws = nodeToFix.raws

					if (primary.startsWith(`always`)) {
						let standing = runInFrontOf(nodeToFix)

						nodeToFixRaws.before = backupCommentNextBefores.has(nodeToFix)
							? spellTheCarriedRun(standing, backupCommentNextBefores.get(nodeToFix))
							: writtenAsLeft((run) => writes.newline(primary, run), standing, straySemicolonsTakenBefore(nodeToFix, result))

						backupCommentNextBefores.delete(nodeToFix)

						return
					}

					if (primary === `never-multi-line`) {
						restoreCarriedBreaks()

						// The comments in front lose their breaks; the checked node's run loses the whitespace it opens with, and a stray semicolon behind it stays with whatever follows it
						for (let comment = statement.first; comment && comment !== nodeToFix; comment = comment.next()) unbreakTheRunInFrontOf(comment)

						nodeToFixRaws.before = writtenAsLeft((run) => writes.newline(primary, run), nodeToFixRaws.before ?? ``, straySemicolonsTakenBefore(nodeToFix, result))
					}
				}
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
