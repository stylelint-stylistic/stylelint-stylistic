import type { Container, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { ENABLE_COMMAND, EVERY_LINE_BREAK, EVERY_SEMICOLON, LINE_DISABLE_COMMAND } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { trailingSemicolonAsked } from "../closedBySemicolon/index.ts"
import { extraSemicolonsAfter, extraSemicolonsBefore } from "../extraSemicolonsAfter/index.ts"
import { type DisabledRange, fixDisabledOnLine, fixDisabledRanges } from "../fixDisabledOnLine/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { lastNonCommentNode } from "../lastNonCommentNode/index.ts"
import { neighborCopies, type NeighborRuleSetting } from "../neighborSettings/index.ts"
import { isAtRule, isComment, isDeclaration } from "../typeGuards/index.ts"

/** The rule taking every extra semicolon out. */
const NO_EXTRA_SEMICOLONS: NeighborRuleSetting = {
	name: `no-extra-semicolons`,
	options: [true],
}

/**
 * Counts the line a character of a raw stands on back from the line the raw ends on.
 * @param raw - The raw.
 * @param index - The character's index in the raw.
 * @param endLine - The line of what closes the raw, if it has a place.
 * @returns The line, or nothing where the raw's end has no place.
 */
function lineInRaw (raw: string, index: number, endLine: number | undefined): number | undefined {
	return endLine === undefined ? undefined : endLine - (raw.slice(index).match(EVERY_LINE_BREAK) ?? []).length
}

/**
 * Finds the semicolons of a raw that live copies of `no-extra-semicolons` take out: those they find extra where no disable comment on their line keeps the fix off.
 * @param node - The node whose raw it is, whose root the copies read.
 * @param result - The Stylelint result, which holds the configuration.
 * @param raw - The raw.
 * @param endLine - The line of what closes the raw, if it has a place.
 * @param extra - The semicolons a copy reading through a syntax finds extra.
 * @returns The indices in the raw.
 */
function takenByNoExtra (node: Node, result: PostcssResult, raw: string, endLine: number | undefined, extra: (syntax: Syntax) => number[]): Set<number> {
	let taken: Set<number> = new Set()

	for (let { fixDisabled, name, syntax } of neighborCopies(node, result, NO_EXTRA_SEMICOLONS)) {
		if (fixDisabled) continue

		for (let index of extra(syntax)) {
			let line = lineInRaw(raw, index, endLine)

			if (line === undefined || !fixDisabledOnLine(result, name, line)) taken.add(index)
		}
	}

	return taken
}

/**
 * Finds the stray semicolons of a block's `raws.after`, the run in front of its closing brace, that a neighbor takes out in the same run, so that a rule reading that run reads it as it will stand whichever side of the neighbor it is listed.
 *
 * Two rules take them. `declaration-block-trailing-semicolon` takes every one where it leaves no semicolon behind the node closing the block, a declaration or a bodiless at-rule, its disable comments read on the line of the last semicolon, where it reports. `no-extra-semicolons` takes those {@link extraSemicolonsAfter} finds, each where no disable comment keeps its fix off the semicolon's line. A semicolon staying is a character of the run as much as its whitespace is.
 * @param statement - The node carrying the block.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The semicolons' indices in the raw.
 */
export function straySemicolonsTaken (statement: Container, result: PostcssResult): Set<number> {
	let after = statement.raws.after
	let taken: Set<number> = new Set()

	if (typeof after !== `string` || !after.includes(`;`)) return taken

	let braceLine = statement.source?.end?.line
	let last = lastNonCommentNode(statement)

	/**
	 * Counts the line a character of the raw stands on back from the brace, which closes the raw.
	 * @param index - The character's index in the raw.
	 * @returns The line, or nothing where the brace has no place.
	 */
	function lineOf (index: number): number | undefined {
		return typeof after === `string` ? lineInRaw(after, index, braceLine) : undefined
	}

	// That rule reports on the last semicolon behind the node, the raw's last, and a disable comment is read on that line
	if (last && (isDeclaration(last) || (isAtRule(last) && !hasBlock(last))) && trailingSemicolonAsked(last, result, lineOf(after.lastIndexOf(`;`))) === false) {
		for (let match of after.matchAll(EVERY_SEMICOLON)) taken.add(match.index)

		return taken
	}

	return takenByNoExtra(statement, result, after, braceLine, (syntax) => extraSemicolonsAfter(syntax, statement, result))
}

/**
 * Returns a run with the characters at the given indices taken out.
 * @param run - The run.
 * @param taken - The indices.
 * @returns The rest.
 */
export function withoutTaken (run: string, taken: Set<number>): string {
	if (taken.size === 0) return run

	let rest = ``

	for (let index = 0; index < run.length; index += 1) if (!taken.has(index)) rest += run.charAt(index)

	return rest
}

/**
 * Finds the stray semicolons of a node's `raws.before` that `no-extra-semicolons` takes out in the same run, each where no disable comment keeps its fix off the semicolon's line, so that a rule reading that run reads it as it will stand whichever side of the neighbor it is listed.
 *
 * `declaration-block-trailing-semicolon` takes none of them: the semicolons it takes stand behind the node closing the block.
 * @param node - The node.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The semicolons' indices in the raw.
 */
export function straySemicolonsTakenBefore (node: Node, result: PostcssResult): Set<number> {
	let before = node.raws.before

	if (typeof before !== `string` || !before.includes(`;`)) return new Set()

	return takenByNoExtra(node, result, before, node.source?.start?.line, (syntax) => extraSemicolonsBefore(syntax, node, result))
}

/** A write's change to the breaks at one place of the file: `delta` breaks added at `offset`, which stands on `line`, taken out where negative. */
export type LineEdit = {
	offset: number,
	line: number,
	delta: number,
}

/**
 * Counts the lines what stands at an offset moves by: every edit in front of it.
 * @param edits - The write's edits.
 * @param offset - The offset in the file.
 * @returns The lines, negative for a move up.
 */
function shiftAt (edits: LineEdit[], offset: number): number {
	let shift = 0

	for (let edit of edits) if (edit.offset < offset) shift += edit.delta

	return shift
}

/**
 * Counts the lines a line moves by where only the line is known: every edit on a line in front of it.
 * @param edits - The write's edits.
 * @param line - The line.
 * @returns The lines, negative for a move up.
 */
function shiftBeforeLine (edits: LineEdit[], line: number): number {
	let shift = 0

	for (let edit of edits) if (edit.line < line) shift += edit.delta

	return shift
}

/**
 * Asks whether a `stylelint-enable` comment closes a rule's range: it names the rule, or no rule at all.
 * @param text - The comment's text.
 * @param ruleName - The rule's registered name.
 * @returns True where it does.
 */
function enables (text: string, ruleName: string): boolean {
	let command = text.match(ENABLE_COMMAND)

	if (!command) return false

	let rules = (command[1] ?? ``).split(`,`).map((rule) => rule.trim()).filter(Boolean)

	return rules.length === 0 || rules.includes(ruleName)
}

/**
 * Finds the offset of the comment closing a rule's range: Stylelint keeps the line alone, so the one `stylelint-enable` comment on it closing that rule is taken, and none where the line holds another number of them. A comment Stylelint reads inside a node's raws is not a comment node, and a range Stylelint read off merged `//` comments carries a detached copy, so both are missed and the end falls back to the lines.
 * @param root - The root the ranges were read from.
 * @param line - The range's last line.
 * @param ruleName - The rule's registered name.
 * @returns The offset, or nothing.
 */
function closingOffset (root: Node | undefined, line: number, ruleName: string): number | undefined {
	let offsets: number[] = []

	if (root && `walkComments` in root) {
		(root as Container).walkComments((comment) => {
			let start = comment.source?.start

			if (start?.line === line && start.offset !== undefined && enables(comment.text, ruleName)) offsets.push(start.offset)
		})
	}

	return offsets.length === 1 ? offsets[0] : undefined
}

/**
 * Moves a disabled range as the write moves the comments bounding it: its start with the node Stylelint files it with, the whole of a range a `-line` or `-next-line` comment opens with that comment, its end with the comment closing it where {@link closingOffset} finds one, the whole of a one-line range none closes with its start, and else its end by the edits on the lines in front of it, which reads an edit on the end's own line as leaving the end where it is — a range read narrower than it may be.
 * @param range - The range.
 * @param edits - The write's edits.
 * @param ruleName - The rule's registered name.
 * @returns The range as the write leaves it.
 */
function movedRange (range: DisabledRange, edits: LineEdit[], ruleName: string): { start: number, end: number | undefined } {
	let opening = range.node?.source?.start?.offset
	let start = range.start + (opening === undefined ? shiftBeforeLine(edits, range.start) : shiftAt(edits, opening))

	if (range.end === undefined) return { start, end: undefined }

	if (range.node && isComment(range.node) && LINE_DISABLE_COMMAND.test(range.node.text)) return { start, end: start }

	let closing = closingOffset(range.node?.root(), range.end, ruleName)

	// A `-line` comment Stylelint read inside a node's raws files the range with the node; with no comment closing a one-line range, it moves whole
	if (closing === undefined && range.end === range.start) return { start, end: start }

	return { start, end: range.end + (closing === undefined ? shiftBeforeLine(edits, range.end) : shiftAt(edits, closing)) }
}

/**
 * Asks whether a range reaches a line.
 * @param range - The range.
 * @param range.start - Its first line.
 * @param range.end - Its last, nothing where it runs to the end of the file.
 * @param line - The line.
 * @returns True where it does.
 */
function reaches ({ start, end }: { start: number, end?: number | undefined }, line: number): boolean {
	return start <= line && (end === undefined || end >= line)
}

/**
 * Places a raw in the file: the offset it starts at and the line it ends on.
 * @param owner - The node whose `raws.before`, or the container whose `raws.after`, it is.
 * @param key - Which of the two raws.
 * @param raw - The raw.
 * @returns The place, each half nothing where the node has none.
 */
function placeOf (owner: Node, key: `before` | `after`, raw: string): { rawStart: number | undefined, endLine: number | undefined } {
	let end = key === `before` ? owner.source?.start : owner.source?.end

	// A block's end offset stands behind its brace
	return { rawStart: end?.offset === undefined ? undefined : end.offset - (key === `after` ? 1 : 0) - raw.length, endLine: end?.line }
}

/**
 * Finds the stray semicolons of a raw that `no-extra-semicolons` finds extra but a disable comment keeps from its fix, and that a write moves out of every such comment's reach, the comments moving with the text around them; such a write would hand them to that rule after all. Where the raw has no place in the file, every one a comment keeps is counted.
 * @param owner - The node whose `raws.before`, or the container whose `raws.after`, is read.
 * @param key - Which of the two raws.
 * @param result - The Stylelint result, which holds the configuration.
 * @param edits - The write's edits.
 * @returns The semicolons' indices in the raw.
 */
export function straySemicolonsReleased (owner: Node, key: `before` | `after`, result: PostcssResult, edits: LineEdit[]): Set<number> {
	let raw = owner.raws[key]
	let released: Set<number> = new Set()

	if (typeof raw !== `string` || !raw.includes(`;`) || edits.every((edit) => edit.delta === 0)) return released

	let { rawStart, endLine } = placeOf(owner, key, raw)
	let taken: Set<number> = new Set()

	for (let { fixDisabled, name, syntax } of neighborCopies(owner, result, NO_EXTRA_SEMICOLONS)) {
		if (fixDisabled) continue

		let ranges = fixDisabledRanges(result, name)

		for (let index of key === `before` ? extraSemicolonsBefore(syntax, owner, result) : extraSemicolonsAfter(syntax, owner, result)) {
			let line = lineInRaw(raw, index, endLine)

			if (line === undefined || !ranges.some((range) => reaches(range, line))) taken.add(index)
			else if (rawStart === undefined || !ranges.some((range) => reaches(movedRange(range, edits, name), line + shiftAt(edits, rawStart + index)))) released.add(index)
		}
	}

	for (let index of taken) released.delete(index)

	return released
}
