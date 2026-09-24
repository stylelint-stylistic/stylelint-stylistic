import type { Container } from "postcss"
import type { PostcssResult } from "stylelint"

import { CAPTURED_LINE_BREAK, LINE_BREAK, WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { getBlockAfter } from "../getBlockAfter/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"
import { setBlockAfter } from "../setBlockAfter/index.ts"

/**
 * Adds an empty line after a node's last child, into the block's final raw ({@link getBlockAfter}).
 * @param syntax - The syntax the rule is built over, which the raw is read and written through.
 * @param node - The node whose block gets the empty line.
 * @param result - The Stylelint result.
 * @returns The node, mutated.
 */
export function addEmptyLineAfter<T extends Container> (syntax: Syntax, node: T, result: PostcssResult): T {
	let blockAfter = getBlockAfter(syntax, node)

	if (typeof blockAfter !== `string`) return node

	// Doubling the run's first break keeps the brace's indentation and leaves everything else of the run where it stands, a stray semicolon behind the break included: the readers measure the run with its first run of semicolons taken out, so the empty line counts wherever the semicolon is, and a rule taking the semicolon out leaves the same file whichever side of this one it is listed
	if (LINE_BREAK.test(blockAfter)) {
		setBlockAfter(syntax, node, blockAfter.replace(CAPTURED_LINE_BREAK, `$1$1`))

		return node
	}

	// The break `linebreaks` asks for, or the file's, twice
	let lines = getLineBreak(node, result).repeat(2)

	// Otherwise the run's whitespace is the closing brace's own indentation and the lines go in front of it, spelled as `block-closing-brace-newline-before` spells its own break into this raw: what stands in front of the run's first whitespace character stays there, so that a rule taking a stray semicolon out leaves the same file whichever side of this one it is listed
	let index = blockAfter.search(WHITESPACE)

	setBlockAfter(syntax, node, index >= 0 ? blockAfter.slice(0, index) + lines + blockAfter.slice(index) : blockAfter + lines)

	return node
}
