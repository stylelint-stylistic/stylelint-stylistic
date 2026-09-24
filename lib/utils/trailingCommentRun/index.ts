import type { AtRule, Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { LINE_BREAK, TRAILING_BACKSLASHES, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blankComments } from "../blankComments/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { isAtRule, isDeclaration } from "../typeGuards/index.ts"

/** The run a node's text ends on that a trailing semicolon may be written in front of: see {@link trailingCommentRun}. */
export type TrailingCommentRun = {

	/** The run: the whitespace and `//` comments behind the node's code, block comments included where a `//` comment stands behind them. */
	run: string,

	/** Takes the run out of the node's raws and puts it in front of what follows the node, a following node's `raws.before` or the block's `raws.after`, so the semicolon the block's flag prints lands where the run stood. */
	move (): void,
}

/**
 * Finds the run of whitespace and `//` comments a node's text ends on, which a trailing semicolon can stand in front of.
 *
 * `postcss-less` keeps a `//` comment behind a declaration's value or a bodiless at-rule's params in that text, and `postcss-scss` keeps one behind an at-rule's params in `raws.between`, so the semicolon the block's flag prints behind the text would land inside the comment. In front of the comment it closes the code, which is where Less wants it: a mixin call or a declaration compiles the same with it and without, and an `@extend` compiles only with it. A block comment in front of the `//` comment stays with the code, in front of the semicolon, where the compiler prints it; one behind the code with no `//` comment behind it is no such run, since the semicolon has stood behind block comments all along.
 *
 * Nothing is found where a flag's raw stands behind the text: under `postcss-less` a comment in front of the flag makes the flag the comment's text, and a mixin call's flag is printed behind the comment the parser left in the params. Nothing either where the code ends on an odd run of backslashes, which the semicolon would be read with, or where moving the run would put the closing brace or the next node on the comment's line: the comment has to be closed by a line feed in front of them already.
 * @param syntax - The rule's syntax, which reads the text and says which double slashes open a comment.
 * @param node - The declaration or bodiless at-rule closing a block.
 * @param result - The lint result naming the syntax the file was parsed with.
 * @returns The run and the move that writes it, or `null` where the text ends in code or the run cannot move.
 */
export function trailingCommentRun (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult): TrailingCommentRun | null {
	if (hasBlock(node) || typeof node.raws.important === `string` || (isDeclaration(node) && node.important)) return null

	let { parent } = node

	if (!parent) throw new Error(`The node must stand in a block`)

	let afterName = isAtRule(node) ? node.raws.afterName || `` : ``
	let text = syntax.read(node)
	let between = isAtRule(node) ? node.raws.between || `` : ``
	let rest = `${afterName}${text}${between}`
	// Read over the raws joined, since a `//` comment runs to its line's end whichever raw holds the rest of the line: a block comment behind one on its line is filed into `raws.between`, and is comment text
	let spans = syntax.commentSpans(rest, node, result)
	let lastInline = spans.findLast((span) => span.isInline)

	if (!lastInline) return null

	// The `//` comments blanked, the code ends where the whitespace behind it starts; a block comment stays with the code, in front of the semicolon, where the compiler printed it
	let codeLength = blankComments(rest, spans.filter((span) => span.isInline)).replace(TRAILING_CSS_WHITESPACE, ``).length
	let run = rest.slice(codeLength)

	let code = rest.slice(0, codeLength)

	if (!run || (code.length - code.replace(TRAILING_BACKSLASHES, ``).length) % 2 === 1) return null

	let next = node.next()
	let behind = next ? next.raws.before || `` : parent.raws.after || ``

	// The last comment has to be closed by a line feed in front of the brace or the next node: Less closes such a comment on a bare carriage return as well, but `postcss-less` closes a comment node on a line feed alone, and the written file has to be read alike by the two
	if (!LINE_BREAK.test(rest.slice(lastInline.start) + behind)) return null

	return {
		run,
		move (): void {
			/**
			 * Returns a raw of the text cut at the code's end.
			 * @param start - Where the raw opens in the text.
			 * @param end - Where it ends.
			 * @returns The raw, empty where the code ends in front of it.
			 */
			function cut (start: number, end: number): string {
				return rest.slice(start, Math.max(start, Math.min(end, codeLength)))
			}

			let textStart = afterName.length
			let betweenStart = textStart + text.length

			if (isAtRule(node)) {
				if (codeLength < textStart) node.raws.afterName = cut(0, textStart)

				if (codeLength < betweenStart + between.length) node.raws.between = cut(betweenStart, rest.length)
			}

			if (codeLength < betweenStart) syntax.write(node, cut(textStart, betweenStart))

			if (next) next.raws.before = `${run}${behind}`
			else parent.raws.after = `${run}${behind}`
		},
	}
}
