import { type AnyNode, type Container, stringify } from "postcss"
import type { PostcssResult } from "stylelint"

import { hasBlock } from "../hasBlock/index.ts"
import { nodeSyntax } from "../nodeSyntax/index.ts"

/**
 * Returns the string a statement's block opens behind: `raws.before`, the head, and the raw before the brace.
 *
 * The head comes from the syntax's stringifier, since `postcss-scss` prints a second selector, `postcss-less` `raws.identifier` and `raws.important`, and a plain at-rule a missing `raws.afterName` as a space; the `start` part it hands its builder, minus the brace, is the head. A Sass nested property written with a value, the declaration `postcss-scss` gives a block, gets its head the same way, property, value and the run in front of the brace, so that `blockString` of it is the block alone. No block gives an empty string.
 * @param statement - The container.
 * @param result - Holds the syntax.
 * @param options - Whether to drop `raws.before`.
 * @returns The string.
 */
export function beforeBlockString (statement: Container, result?: PostcssResult, options: { noRawBefore?: boolean } = {}): string {
	let { noRawBefore = false } = options

	if (!hasBlock(statement)) return ``

	let head: string | undefined

	let syntax = nodeSyntax(statement, result)

	// Plain CSS has no syntax; PostCSS prints it
	let print = (syntax && syntax.stringify) || stringify

	// The stringifier takes `AnyNode`, which `Container` is not, and the nested property of `postcss-scss`, a container of type `decl`, has no type of its own to narrow to
	print(statement as AnyNode, (part, node, type) => {
		if (head === undefined && node === statement && type === `start`) head = part.slice(0, -1)
	})

	if (head === undefined) return ``

	let before = statement.raws.before

	return (noRawBefore || typeof before !== `string` ? `` : before) + head
}
