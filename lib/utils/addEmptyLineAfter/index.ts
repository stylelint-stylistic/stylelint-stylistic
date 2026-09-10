import type { AtRule, Rule } from "postcss"
import type { PostcssResult } from "stylelint"

import { CAPTURED_LINE_BREAK, LINE_BREAK, WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { getBlockAfter } from "../getBlockAfter/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"
import { setBlockAfter } from "../setBlockAfter/index.ts"

/**
 * Adds an empty line after a node's last child, into the block's final raw ({@link getBlockAfter}).
 * @param syntax - The syntax; its namespace names the `linebreaks` rule.
 * @param node - The rule or at-rule whose block gets the empty line.
 * @param result - The Stylelint result.
 * @returns The node, mutated.
 */
export function addEmptyLineAfter<T extends Rule | AtRule> (syntax: Syntax, node: T, result: PostcssResult): T {
	let blockAfter = getBlockAfter(node)

	if (typeof blockAfter !== `string`) return node

	// Behind a stray semicolon
	let start = blockAfter.lastIndexOf(`;`) + 1
	let after = blockAfter.slice(start)

	// Doubling keeps the brace's indentation
	if (LINE_BREAK.test(after)) {
		setBlockAfter(node, blockAfter.slice(0, start) + after.replace(CAPTURED_LINE_BREAK, `$1$1`))

		return node
	}

	// The break `linebreaks` asks for, or the file's, twice
	let lines = getLineBreak(syntax, node, result).repeat(2)

	// A run spelling a break in front of a stray semicolon keeps the lines behind it, where the empty line the option asks for already stands
	if (LINE_BREAK.test(blockAfter)) {
		setBlockAfter(node, blockAfter + lines)

		return node
	}

	// Otherwise the run's whitespace is the closing brace's own indentation and the lines go in front of it, spelled as `block-closing-brace-newline-before` spells its own break into this raw: what stands in front of the run's first whitespace character stays there, so that a rule taking a stray semicolon out leaves the same file whichever side of this one it is listed ([#678](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/678))
	let index = blockAfter.search(WHITESPACE)

	setBlockAfter(node, index >= 0 ? blockAfter.slice(0, index) + lines + blockAfter.slice(index) : blockAfter + lines)

	return node
}
