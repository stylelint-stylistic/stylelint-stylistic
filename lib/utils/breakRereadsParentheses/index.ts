import { PARENTHESES_READ_AS_CODE } from "../../regexps.ts"

/**
 * Asks whether the content of parentheses, read as code, opens a group nothing closes before the `)`: a `[`, or a `{` in a custom property's value, each closed by its own bracket alone. The parser pushes either on its stack and refuses the file over what is left on it at the end of the declaration.
 * @param content - The text between the `(` and the `)`.
 * @param inCustomProperty - Whether a `{` opens a group too, as in a custom property's value and in an at-rule's params.
 * @returns True where a group is left open.
 */
function leavesAGroupOpen (content: string, inCustomProperty: boolean): boolean {
	let closers: string[] = []

	for (let character of content) {
		if (character === `[`) closers.push(`]`)
		else if (character === `{` && inCustomProperty) closers.push(`}`)
		else if (character === closers.at(-1)) closers.pop()
	}

	return closers.length > 0
}

/**
 * Asks whether a line break written inside a call's parentheses makes the tokenizer read them as code rather than as one token, where the two readings part.
 *
 * PostCSS's tokenizer, which `postcss-less` reads by and `postcss-scss` copies with patches of its own, takes parentheses as one `brackets` token where nothing from the `(` to the first `)` is a line break, a quotation mark, a `(`, a solidus or a backslash; the token is opaque to the parser, while code is read for groups, and a `[` nothing closes before the `)`, or a `{` in a custom property's value or an at-rule's params, is a group the parser finds open at the end of the declaration and refuses the file over, or at the end of the params, where the at-rule gets no block and they run to the end of the file. A break written into the token switches the reading. A group a `]` behind that `)` closes counts as open, though a stray `)` then balances the call. Not modeled, since such parentheses holding an open group are a file the parser refused, or an at-rule's params it swallowed the file into, before any rule ran: PostCSS reads a `(` standing in front of the first `)` behind an earlier `(` it read as code the same way whatever it holds, which `postcss-scss` does not; the fix refused over such params changes nothing. Nor is the `#{` `postcss-scss` reads as an interpolation in code and refuses unclosed, since Sass refuses such a file itself.
 * @param text - The text the call stands in.
 * @param openIndex - The call's `(`.
 * @param inCustomProperty - Whether the text is a custom property's value or an at-rule's params, where a `{` opens a group too.
 * @returns True where the break switches the reading of parentheses whose two readings part.
 */
export function breakRereadsParentheses (text: string, openIndex: number, inCustomProperty: boolean): boolean {
	let closeIndex = text.indexOf(`)`, openIndex + 1)

	if (closeIndex === -1) return false

	let parentheses = text.slice(openIndex, closeIndex + 1)

	if (PARENTHESES_READ_AS_CODE.test(parentheses)) return false

	return leavesAGroupOpen(parentheses.slice(1, -1), inCustomProperty)
}

/**
 * Asks the same of the parentheses the tokenizer would hold an index in: the last `(` in front of it, where its first `)` stands behind the index, and no parentheses at all where it does not. No earlier `(` can be the token, since it holds this one, which makes it code.
 * @param text - The text the index is in.
 * @param index - The index the break is written beside.
 * @param inCustomProperty - Whether the text is a custom property's value or an at-rule's params, where a `{` opens a group too.
 * @returns True where the break switches the reading of the parentheses holding the index and their two readings part.
 */
export function breakAtRereadsParentheses (text: string, index: number, inCustomProperty: boolean): boolean {
	let openIndex = text.lastIndexOf(`(`, index)

	return openIndex !== -1 && text.indexOf(`)`, openIndex + 1) > index && breakRereadsParentheses(text, openIndex, inCustomProperty)
}
