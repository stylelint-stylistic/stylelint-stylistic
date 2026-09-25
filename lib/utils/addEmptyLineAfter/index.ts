import type { Container } from "postcss"
import type { PostcssResult } from "stylelint"

import { CAPTURED_LINE_BREAK, EVERY_SEMICOLON, LINE_BREAK, WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { getBlockTail, setBlockTail } from "../blockTail/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"

/**
 * Adds an empty line after a node's last child, into the run in front of the closing brace ({@link getBlockTail}).
 * @param syntax - The syntax the rule is built over, which the raw is read and written through.
 * @param node - The node whose block gets the empty line.
 * @param result - The Stylelint result.
 * @param taken - The indices of the raw's semicolons a neighbor takes out.
 * @returns The node, mutated.
 */
export function addEmptyLineAfter<T extends Container> (syntax: Syntax, node: T, result: PostcssResult, taken: Set<number> = new Set()): T {
	let blockAfter = getBlockTail(syntax, node)

	if (typeof blockAfter !== `string`) return node

	// A semicolon no neighbor takes keeps its line, which a disable comment may be read on, so the break closing the line of the last one is doubled
	let staying = [...blockAfter.matchAll(EVERY_SEMICOLON)].findLast((match) => !taken.has(match.index))?.index

	if (staying !== undefined && LINE_BREAK.test(blockAfter.slice(staying))) {
		setBlockTail(syntax, node, blockAfter.slice(0, staying) + blockAfter.slice(staying).replace(CAPTURED_LINE_BREAK, `$1$1`))

		return node
	}

	// Doubling the run's first break keeps the brace's indentation and leaves everything else of the run where it stands, a stray semicolon behind the break included: a neighbor taking the semicolon out leaves the two breaks an empty line, so the same file comes out whichever side of this one it is listed
	if (LINE_BREAK.test(blockAfter)) {
		setBlockTail(syntax, node, blockAfter.replace(CAPTURED_LINE_BREAK, `$1$1`))

		return node
	}

	// The break `linebreaks` asks for, or the file's, twice
	let lines = getLineBreak(node, result).repeat(2)

	// Otherwise the run's whitespace is the closing brace's own indentation and the lines go in front of it, spelled as `block-closing-brace-newline-before` spells its own break into this raw: what stands in front of the run's first whitespace character stays there, so that a rule taking a stray semicolon out leaves the same file whichever side of this one it is listed
	let index = blockAfter.search(WHITESPACE)

	setBlockTail(syntax, node, index >= 0 ? blockAfter.slice(0, index) + lines + blockAfter.slice(index) : blockAfter + lines)

	return node
}
