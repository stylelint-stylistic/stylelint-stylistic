import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, EVERY_SEMICOLON } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { extraSemicolonsAfter, extraSemicolonsBefore } from "../extraSemicolonsAfter/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { neighborCopies, type NeighborRuleSetting } from "../neighborSettings/index.ts"

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
 * Finds the semicolons of a raw that live copies of `no-extra-semicolons` take out: those they find extra where no disable comment on their line keeps the fix off.
 * @param node - The node whose raw it is, whose root the copies read.
 * @param result - The Stylelint result, which holds the configuration.
 * @param raw - The raw.
 * @param endLine - The line of what closes the raw, if it has a place.
 * @param extra - The semicolons a copy reading through a syntax finds extra.
 * @returns The indices in the raw.
 */
export function takenByNoExtra (node: Node, result: PostcssResult, raw: string, endLine: number | undefined, extra: (syntax: Syntax) => number[]): Set<number> {
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
 * Finds the stray semicolons of a node's `raws.before`, or of a block's `raws.after`, that live copies of `no-extra-semicolons` take out in the same run, and nothing of what any other rule takes: the question the rules taking semicolons behind a node ask of that one neighbor, which `declaration-block-trailing-semicolon` asks about the semicolons it reports.
 * @param owner - The node whose raw it is.
 * @param key - Which of its raws: the run in front of it, or the run in front of its closing brace.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The semicolons' indices in the raw.
 */
export function noExtraSemicolonsTaken (owner: Node, key: `before` | `after`, result: PostcssResult): Set<number> {
	let raw = owner.raws[key]

	if (typeof raw !== `string` || !raw.includes(`;`)) return new Set()

	if (key === `before`) return takenByNoExtra(owner, result, raw, owner.source?.start?.line, (syntax) => extraSemicolonsBefore(syntax, owner, result))

	// A free semicolon behind the brace goes into `raws.ownSemicolon`, and PostCSS ends the container behind it
	let end = owner.source?.end?.line
	let braceLine = end === undefined ? undefined : end - (String(owner.raws.ownSemicolon ?? ``).match(EVERY_LINE_BREAK) ?? []).length

	return takenByNoExtra(owner, result, raw, braceLine, (syntax) => extraSemicolonsAfter(syntax, owner, result))
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
