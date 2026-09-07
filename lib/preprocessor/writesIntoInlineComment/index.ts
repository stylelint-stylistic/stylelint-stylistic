import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { hasBlock } from "../../utils/hasBlock/index.ts"
import { isAtRule, isComment, isDeclaration } from "../../utils/typeGuards/index.ts"
import { endsWithInlineComment } from "../endsWithInlineComment/index.ts"
import { isInlineComment } from "../isInlineComment/index.ts"
import { printedText } from "../printedText/index.ts"
import { inlineCommentReading } from "../readsInlineComments/index.ts"

/** Written behind a spelled run, which is not room as trailing whitespace is. */
const A_WRITTEN_CHARACTER = `;`

/**
 * Returns the text a write behind a node follows.
 *
 * A declaration is its value and its `!important` raw, which may open with the break closing a `//` comment or, under `postcss-less`, be more of one. A bodiless at-rule ends with `raws.between`; a `//` comment runs to its line's end; a closing brace ends every comment.
 * @param node - The comment, declaration or at-rule a write follows.
 * @returns That text.
 */
function textAWriteFollows (node: Node): string {
	if (isComment(node)) return isInlineComment(node) ? `//` : ``

	if (isDeclaration(node)) return printedText(node) + (node.raws.important || ``)

	if (isAtRule(node)) return hasBlock(node) ? `` : printedText(node) + (node.raws.between || ``)

	return ``
}

/**
 * Asks whether a fix writing behind a node lands inside a `//` comment, which only a break closes.
 *
 * The caller names the node alone; picking a text is how [#211](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/211) came about. A fix over trailing whitespace spells no run, and that whitespace is room; a fix elsewhere spells the run between node and write, none of it room: a semicolon in front of what `never-multi-line` removes ([#248](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248)), or what a closing brace follows once a block's final raw is rewritten ([#231](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/231)).
 * @param node - The node the fix writes behind.
 * @param result - Holds the syntax.
 * @param spelledBetween - The run between node and write after the fix, if not trailing whitespace.
 * @returns True where it does.
 */
export function writesIntoInlineComment (node: Node, result: PostcssResult, spelledBetween?: string): boolean {
	let text = textAWriteFollows(node)
	let reading = inlineCommentReading(node, result)

	// No run: trailing whitespace is room
	if (spelledBetween === undefined) return endsWithInlineComment(text, reading)

	return endsWithInlineComment(`${text}${spelledBetween}${A_WRITTEN_CHARACTER}`, reading)
}
