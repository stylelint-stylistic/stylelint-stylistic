import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_CHARACTER_BUT_A_BREAK, EVERY_PARENTHESIS } from "../../regexps.ts"
import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import { parenthesizedAddressTokenSpans } from "../addressTokenSpans/index.ts"

/**
 * Asks whether a text holds as many closing parentheses as opening ones.
 * @param text - The text.
 * @returns True where it does.
 */
function isBalanced (text: string): boolean {
	let depth = 0

	for (let [parenthesis] of text.matchAll(EVERY_PARENTHESIS)) depth += parenthesis === `(` ? 1 : -1

	return depth === 0
}

/**
 * Writes the content of every address token a scan would misread as `?` in a copy of a text, so `style-search` finds nothing inside it.
 *
 * PostCSS's tokenizer reads `url(x(y)` as one token closed by the first `)` no backslash escapes, while `style-search` reads the `(` of `x(` as opening a call and the `)` as closing it, and holds everything behind the address inside the `url(` it then never sees closed: a comma of the list behind `url(x(y),c` was skipped as an argument. Behind `url` and a space or a comment the tokenizer takes the same token, where CSS reads a group of parentheses and no address: the comma of `url (a(b,c).png)` stands among the arguments of `a(`, which the scan skipped, and a mask of the parentheses alone made it a comma of the list, so the whole content goes, as {@link maskStrings} masks a string whole. The line breaks stay, since `indentation` and `max-empty-lines` count the file's lines over the copy.
 *
 * The address is the one the tokenizer reads, behind the word `url` alone: `URL(`, an escaped name and a name glued to a word in front open plain parentheses to it. A token whose parentheses balance in the copy, as `postcss-scss` closes its token at their count, is closed where `style-search` closes it, and a call inside it stays one: to Sass `url( "a", f(1) )` is a call. The copy's escapes are masked already, so a `\)` the tokenizer skips does not balance one there. The copy is as long as the text.
 * @param copy - The copy of the text the search runs over.
 * @param text - The text, which the addresses are found in.
 * @param node - The node the text belongs to.
 * @param [result] - The Stylelint result, which names the syntax where the root does not.
 * @returns The copy.
 */
export function maskAddressTokens (copy: string, text: string, node: Node, result?: PostcssResult): string {
	if (!text.includes(`url`)) return copy

	let spans = parenthesizedAddressTokenSpans(``, text, nodeSyntax(node, result), node.source?.input.file, node) ?? []
	let pieces = []
	let index = 0

	for (let { start, end } of spans) {
		let token = copy.slice(start, end)

		if (isBalanced(token)) continue

		// The `(` opening the token stays, and so does a `)` closing it: a token the tokenizer left open runs to the end of the text
		let closed = token.endsWith(`)`)

		pieces.push(copy.slice(index, start + 1), token.slice(1, closed ? -1 : undefined).replaceAll(EVERY_CHARACTER_BUT_A_BREAK, `?`))
		index = closed ? end - 1 : end
	}

	pieces.push(copy.slice(index))

	return pieces.join(``)
}
