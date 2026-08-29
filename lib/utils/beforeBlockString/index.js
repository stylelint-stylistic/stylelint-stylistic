import { stringify } from "postcss"

import { hasBlock } from "../hasBlock/index.js"
import { nodeSyntax } from "../nodeSyntax/index.js"
import { isAtRule, isRule } from "../typeGuards/index.js"

/**
 * Gets the string a statement's block opens behind: its `raws.before`, its head, and the raw standing between that head and the opening brace.
 *
 * The head is taken from the stringifier of the syntax the file was opened with rather than built here, since building it means spelling that stringifier's grammar out a second time: `postcss-scss` prints a second copy of the selector and of the parameters, `postcss-less` prints the `.` of a mixin call out of `raws.identifier` and the flag out of `raws.important`, and a plain at-rule spells a space of its own where `raws.afterName` is missing. A stringifier hands its builder `start + between + "{"` as the first thing it says about a container, marked `start`, and that string without its final brace is exactly what is wanted here.
 *
 * A statement with no block has nothing to stand in front of, and a nested Sass property — a declaration carrying a block — is no part of what the callers of this util measure. Both are answered with an empty string. For the nested property that is what this util always said; for the blockless statement it is not, since the head used to come back whole from `@import "a";`, and no caller reaches either — all four guard with `hasBlock` — so nothing turns on which of the two is answered.
 * @param {import('postcss').Container} statement - The PostCSS container node.
 * @param {import('stylelint').PostcssResult} [result] - The Stylelint result, which holds the syntax the file was opened with.
 * @param {{ noRawBefore?: boolean }} [options] - Whether to leave the statement's `raws.before` out of the result.
 * @returns {string} The string before the block.
 */
export function beforeBlockString (statement, result, { noRawBefore = false } = {}) {
	if (!hasBlock(statement)) return ``
	if (!isRule(statement) && !isAtRule(statement)) return ``

	let head

	let syntax = nodeSyntax(statement, result)

	// A file read as plain CSS has no syntax of its own, and PostCSS's own stringifier is the one that prints it
	let print = (syntax && syntax.stringify) || stringify

	print(statement, (part, node, type) => {
		if (head === undefined && node === statement && type === `start`) head = part.slice(0, -1)
	})

	if (head === undefined) return ``

	let before = statement.raws.before

	return (noRawBefore || typeof before !== `string` ? `` : before) + head
}
