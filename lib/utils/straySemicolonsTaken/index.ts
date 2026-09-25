import type { Container } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, EVERY_SEMICOLON } from "../../regexps.ts"
import { trailingSemicolonAsked } from "../closedBySemicolon/index.ts"
import { extraSemicolonsAfter } from "../extraSemicolonsAfter/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { lastNonCommentNode } from "../lastNonCommentNode/index.ts"
import { neighborCopies, type NeighborRuleSetting } from "../neighborSettings/index.ts"
import { isAtRule, isDeclaration } from "../typeGuards/index.ts"

/** The rule taking every extra semicolon out. */
const NO_EXTRA_SEMICOLONS: NeighborRuleSetting = {
	name: `no-extra-semicolons`,
	options: [true],
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
		return braceLine === undefined || typeof after !== `string` ? undefined : braceLine - (after.slice(index).match(EVERY_LINE_BREAK) ?? []).length
	}

	// That rule reports on the last semicolon behind the node, the raw's last, and a disable comment is read on that line
	if (last && (isDeclaration(last) || (isAtRule(last) && !hasBlock(last))) && trailingSemicolonAsked(last, result, lineOf(after.lastIndexOf(`;`))) === false) {
		for (let match of after.matchAll(EVERY_SEMICOLON)) taken.add(match.index)

		return taken
	}

	for (let { fixDisabled, name, syntax } of neighborCopies(statement, result, NO_EXTRA_SEMICOLONS)) {
		if (fixDisabled) continue

		for (let index of extraSemicolonsAfter(syntax, statement, result)) {
			let line = lineOf(index)

			if (line === undefined || !fixDisabledOnLine(result, name, line)) taken.add(index)
		}
	}

	return taken
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
