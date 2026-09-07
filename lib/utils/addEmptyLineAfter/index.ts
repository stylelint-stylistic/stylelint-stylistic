import type { AtRule, Rule } from "postcss"
import type { PostcssResult } from "stylelint"

import { CAPTURED_LINE_BREAK, LINE_BREAK } from "../../regexps.ts"
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

	// The break `linebreaks` asks for, or the file's
	setBlockAfter(node, blockAfter + getLineBreak(syntax, node, result).repeat(2))

	return node
}
