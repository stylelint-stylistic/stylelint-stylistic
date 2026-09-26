import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, EVERY_SEMICOLON } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { closingOffset } from "../closingOffset/index.ts"
import { extraSemicolonsAfter, extraSemicolonsBefore } from "../extraSemicolonsAfter/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { neighborCopies, type NeighborRuleSetting } from "../neighborSettings/index.ts"
import { semicolonOffset } from "../semicolonOffset/index.ts"
import { semicolonsTakenAlreadyIn } from "../semicolonsTakenAlready/index.ts"

/** The rule taking every extra semicolon out. */
export const NO_EXTRA_SEMICOLONS: NeighborRuleSetting = {
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
export function lineInRaw (raw: string, index: number, endLine: number | undefined): number | undefined {
	return endLine === undefined ? undefined : endLine - (raw.slice(index).match(EVERY_LINE_BREAK) ?? []).length
}

/**
 * Finds the line a semicolon of a raw stands on in the file, read at its place ({@link semicolonOffset}) past the semicolons `semicolonsTakenAlreadyIn` finds a rule listed earlier took out — where the neighbor places its warning, as far as that reading finds them.
 * @param node - The node whose raw it is, whose root holds the file.
 * @param key - Which of its raws.
 * @param index - The semicolon's index in the raw.
 * @param rawEnd - Where the raw ends in the root's text, if it has a place.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The line, or nothing where the file does not answer.
 */
export function semicolonLine (node: Node, key: `before` | `after` | `ownSemicolon`, index: number, rawEnd: number | undefined, result: PostcssResult): number | undefined {
	let root = node.root()
	let input = root.source?.input
	let raw = node.raws[key]

	if (rawEnd === undefined || input === undefined || typeof raw !== `string` || rawEnd > input.css.length) return undefined

	let offset = semicolonOffset(input.css, rawEnd, raw, index, semicolonsTakenAlreadyIn(node, key, input.css, result))
	let line = offset === undefined ? undefined : input.fromOffset(offset)?.line

	return line === undefined ? undefined : (root.source?.start?.line ?? 1) + line - 1
}

/**
 * Finds the semicolons of a raw that live copies of `no-extra-semicolons` take out: those they find extra where no disable comment on their line keeps the fix off. The line is read from the file where it answers ({@link semicolonLine}), and back from the line the raw ends on otherwise.
 * @param node - The node whose raw it is, whose root the copies read.
 * @param result - The Stylelint result, which holds the configuration.
 * @param key - Which of its raws.
 * @param endLine - The line of what closes the raw, if it has a place.
 * @param rawEnd - Where the raw ends in the root's text, if it has a place.
 * @param extra - The semicolons a copy reading through a syntax finds extra.
 * @returns The indices in the raw.
 */
export function takenByNoExtra (node: Node, key: `before` | `after` | `ownSemicolon`, result: PostcssResult, endLine: number | undefined, rawEnd: number | undefined, extra: (syntax: Syntax) => number[]): Set<number> {
	let raw = String(node.raws[key] ?? ``)
	let taken: Set<number> = new Set()

	for (let { fixDisabled, name, syntax } of neighborCopies(node, result, NO_EXTRA_SEMICOLONS)) {
		if (fixDisabled) continue

		for (let index of extra(syntax)) {
			let line = semicolonLine(node, key, index, rawEnd, result) ?? lineInRaw(raw, index, endLine)

			if (line === undefined || !fixDisabledOnLine(result, name, line)) taken.add(index)
		}
	}

	return taken
}

/**
 * Finds where a container's tail ends in its root's text: a root's own ends its text, a document's block and a styled template alike, and a block's at its closing brace, in front of `raws.ownSemicolon`.
 * @param owner - The container.
 * @param ownLength - The length of its `raws.ownSemicolon`.
 * @param rootStart - Where its root starts.
 * @returns The offset, nothing where it has no place: a block the parser's end is not trusted for.
 */
function tailEnd (owner: Node, ownLength: number, rootStart: number): number | undefined {
	if (owner.type === `root`) return owner.source?.input.css.length

	let closing = closingOffset(owner)

	return closing === undefined ? undefined : closing - ownLength - 1 - rootStart
}

/**
 * Finds the stray semicolons of a node's `raws.before`, or of a block's `raws.after`, that live copies of `no-extra-semicolons` take out in the same run, and nothing of what any other rule takes: the question the rules taking semicolons behind a node ask of that one neighbor, which `declaration-block-trailing-semicolon` asks about the semicolons it reports.
 * @param owner - The node whose raw it is.
 * @param key - Which of its raws: the run in front of it, or the run in front of its closing brace.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The semicolons' indices in the raw.
 */
export function noExtraSemicolonsTaken (owner: Node, key: `before` | `after`, result: PostcssResult): Set<number> {
	let raw = owner.raws[key]

	if (typeof raw !== `string` || !raw.includes(`;`)) return new Set()

	let rootStart = owner.root().source?.start?.offset ?? 0

	if (key === `before`) {
		let start = owner.source?.start?.offset

		return takenByNoExtra(owner, key, result, owner.source?.start?.line, start === undefined ? undefined : start - rootStart, (syntax) => extraSemicolonsBefore(syntax, owner, result))
	}

	// A free semicolon behind the brace goes into `raws.ownSemicolon`, and PostCSS ends the container behind it
	let own = String(owner.raws.ownSemicolon ?? ``)
	let end = owner.source?.end?.line
	let braceLine = end === undefined ? undefined : end - (own.match(EVERY_LINE_BREAK) ?? []).length
	return takenByNoExtra(owner, key, result, braceLine, tailEnd(owner, own.length, rootStart), (syntax) => extraSemicolonsAfter(syntax, owner, result))
}

/**
 * Finds the last semicolon of a raw a neighbor leaves.
 * @param raw - The raw.
 * @param taken - The indices of the semicolons it takes out.
 * @returns The index, or nothing where it leaves none.
 */
export function lastSemicolonLeft (raw: string, taken: Set<number>): number | undefined {
	return [...raw.matchAll(EVERY_SEMICOLON)].map((match) => match.index).findLast((index) => !taken.has(index))
}
