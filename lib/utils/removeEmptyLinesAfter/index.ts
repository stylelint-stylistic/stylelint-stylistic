import type { Container } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_EMPTY_LINE_RUN, EVERY_SEMICOLON } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { getBlockTailAsClosed, setBlockTailAsClosed } from "../blockTail/index.ts"

/**
 * Removes the empty lines after a node, in place. The lines come out of the run in front of the closing brace, as `declaration-block-trailing-semicolon` will leave it ({@link getBlockTailAsClosed}). A run is written back as its first break, keeping the file's spelling.
 *
 * A stray semicolon a neighbor takes out in the same run is read as the whitespace it leaves, so a run of breaks around it is one run; it stays in the raw, since taking it is the neighbor's, with its warning and its disable comments. Any other semicolon is a character of the line it stands on and parts two runs.
 * @param syntax - The syntax the rule is built over, which the raw is read and written through.
 * @param node - The node whose block holds the lines.
 * @param result - The Stylelint result, which holds the configuration.
 * @param taken - The indices of the raw's semicolons a neighbor takes out.
 * @returns The node.
 */
export function removeEmptyLinesAfter<T extends Container> (syntax: Syntax, node: T, result: PostcssResult, taken: Set<number> = new Set()): T {
	let blockAfter = getBlockTailAsClosed(syntax, node, result)

	if (!blockAfter) {
		setBlockTailAsClosed(syntax, node, result, ``)

		return node
	}

	// A semicolon staying stands for a character no run crosses; the copy keeps every index
	let masked = blockAfter.replaceAll(EVERY_SEMICOLON, (semicolon, index: number) => (taken.has(index) ? semicolon : `x`))
	let written = ``
	let from = 0

	for (let match of masked.matchAll(EVERY_EMPTY_LINE_RUN)) {
		written += blockAfter.slice(from, match.index) + (match[1] ?? ``) + (match[0].match(EVERY_SEMICOLON) ?? []).join(``)
		from = match.index + match[0].length
	}

	setBlockTailAsClosed(syntax, node, result, written + blockAfter.slice(from))

	return node
}
