import valueParser from "postcss-value-parser"

import { TOKENIZER_WORD_END } from "../../regexps.ts"
import { type CommentSpan, findCommentSpanAt, findCommentSpans } from "../findCommentSpans/index.ts"
import type { InlineCommentSpan } from "../findInlineCommentSpans/index.ts"
import { isWhitespace } from "../isWhitespace/index.ts"
import { namesAnAddress } from "../namesAnAddress/index.ts"
import { readCallName } from "../readCallName/index.ts"
import { readIdentifierCharacter } from "../readIdentifierCharacter/index.ts"

/** The mask, as {@link hideQuotesInComments} writes it: `?` opens and closes nothing. */
const MASK = `?`

/** A character to write over, and the one written. */
type Mask = {
	index: number,
	text: string,
}

/**
 * Skips a string as PostCSS's tokenizer reads one: to the next mark of its kind no escape holds, or to the end of the text.
 * @param text - The text holding the string.
 * @param openIndex - The opening mark.
 * @returns Behind the closing mark, or the text's length.
 */
function skipString (text: string, openIndex: number): number {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) index += text[index] === `\\` ? 2 : 1

	return Math.min(index + 1, text.length)
}

/**
 * Skips a block comment: to behind its closing delimiter, or to the end of the text.
 * @param text - The text holding the comment.
 * @param openIndex - The solidus opening it.
 * @returns Behind the comment.
 */
function skipBlockComment (text: string, openIndex: number): number {
	let closeIndex = text.indexOf(`*/`, openIndex + 2)

	return closeIndex === -1 ? text.length : closeIndex + 2
}

/**
 * Tells whether PostCSS's tokenizer takes the name of a call as a word of its own, which is where it reads the parentheses of a `url(` as a bare address.
 * @param text - The value parsed.
 * @param nameIndex - Where the name begins.
 * @param spans - The comment spans found in the value, both kinds.
 * @returns True where nothing glues to the name's front.
 */
function standsAloneAsWord (text: string, nameIndex: number, spans: (CommentSpan | InlineCommentSpan)[]): boolean {
	if (nameIndex === 0) return true

	let before = nameIndex - 1

	return Boolean(findCommentSpanAt(before, spans)) || TOKENIZER_WORD_END.test(text.charAt(before))
}

/**
 * Finds every `)` inside a string or a comment that holds the `)` the parser closes the parentheses of a `url( ` on, in walk order.
 * @param text - The value parsed.
 * @param spans - The comment spans found in the value, both kinds.
 * @returns The indices.
 */
function findHeldParentheses (text: string, spans: (CommentSpan | InlineCommentSpan)[]): number[] {
	let held: number[] = []

	valueParser(text).walk((node) => {
		if (node.type !== `function` || node.value !== `url` || node.unclosed) return

		let openIndex = node.sourceIndex + node.value.length + 1
		let closeIndex = node.sourceEndIndex - 1

		// A comment behind the `(` may stand blanked to spaces, and the tokenizer reads none of it as whitespace
		let spaceBehindParenthesis = isWhitespace(text.charAt(openIndex)) && !findCommentSpanAt(openIndex, spans)

		// The tokenizer reads a bare address behind a `url` of its own word, where no whitespace of its follows the `(`
		if (!spaceBehindParenthesis && standsAloneAsWord(text, node.sourceIndex, spans)) return

		let index = openIndex

		while (index < closeIndex) {
			let comment = findCommentSpanAt(index, spans)

			// A comment running to the end of the text leaves no `)` behind it to close the address on
			if (comment && comment.end >= text.length) break

			let end = index + 1

			if (comment) end = comment.end
			else if (text[index] === `\\`) end = index + 2
			else if (text[index] === `"` || text[index] === `'`) end = skipString(text, index)
			// A comment the spans handed in do not hold
			else if (text[index] === `/` && text[index + 1] === `*`) end = skipBlockComment(text, index)

			if (end > closeIndex) {
				for (let at = index; at < end; at += 1) {
					if (text[at] === `)`) held.push(at)
				}
			}

			index = end
		}
	})

	return held
}

/**
 * Finds the backslash of every divider in the name of a call the part of which behind the last divider spells `url`, with the mask each takes. A backslash in front of a line break spells nothing and is a word of its own to PostCSS, the break behind it whitespace, so the name opens behind the two as it does behind a plain `url(`; the parser steps over whatever a backslash stands in front of, keeps both inside the name, and reads the parentheses as code ([#588](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/588)). The name is read as the file spells it, welded to the hex-escaped words in front of the call, since the parser hands `\<LF>\75 rl(` back as a word holding the divider, a space and a call named `rl` (1789570277). A divider in the run opening the name takes the mask, which is no boundary to the parser and leaves no whitespace beside what stands in front; one behind a character of a word takes a space, which ends that word as the grammar does, where the mask would read as a character of it.
 * @param text - The value parsed.
 * @param spans - The comment spans found in the value, both kinds.
 * @returns The indices and their masks.
 */
function findDividersInUrlNames (text: string, spans: (CommentSpan | InlineCommentSpan)[]): Mask[] {
	let dividers: Mask[] = []

	valueParser(text).walk((node, index, siblings) => {
		// A `//` comment the break closes may hold the backslash, and the name behind it is code all the same
		if (node.type !== `function` || findCommentSpanAt(node.sourceIndex + node.value.length, spans)) return

		let { name, sourceIndex } = readCallName(node, index, siblings)
		let found: Mask[] = []
		let opening = 0
		let behindWord = false

		for (let at = 0; at < name.length;) {
			let { character, end } = readIdentifierCharacter(name, at)

			if (character !== undefined) {
				behindWord = true
				at = end
				continue
			}

			found.push({ index: sourceIndex + at, text: behindWord ? ` ` : MASK })
			// The break the backslash stands in front of is the value's whitespace, no character of the name
			at += 2
			opening = at
		}

		if (found.length > 0 && namesAnAddress(name.slice(opening))) dividers.push(...found)
	})

	return dividers
}

/**
 * Writes the masks over the characters at their indices.
 * @param text - The text to mask.
 * @param masks - The indices, in code units, as the parse counts, and the character each takes.
 * @returns The masked text, as long as the text.
 */
function maskAt (text: string, masks: Mask[]): string {
	if (masks.length === 0) return text

	let characters = text.split(``)

	for (let { index, text: mask } of masks) characters[index] = mask

	return characters.join(``)
}

/**
 * Masks the `)` inside a string or a comment that the parentheses of a `url( ` hold, so that `postcss-value-parser` closes them where PostCSS does, and first the backslash of a divider the parser took into such a call's name, or into the word it welds the name onto across the space closing a hexadecimal escape, so that it opens them where PostCSS does.
 *
 * The parser reads everything behind `url(` to the first `)` as one word wherever no quotation mark opens the parentheses. PostCSS reads the parentheses as code, where a string holds its `)`, on two triggers this asks about: whitespace of its own behind the `(`, and a name its tokenizer does not take as a word of its own, which is every boundary of the parser's the tokenizer does not share — a comma, a solidus, a star inside `calc()` and every code point of 32 and under outside its five whitespaces. A quotation mark behind the `(` is a third trigger of the tokenizer's and is not asked about: the parser reads no address there either. The rules skipping the address read the string's tail as code of the value and wrote into it. A comment holds its `)` there too, whether the spans handed in hold it or a block comment they do not: the parser closed the address on it, and the rules checking the parentheses of the call around read the address's own `)` as that call's.
 *
 * A divider is a backslash in front of a line break, which spells nothing and leaves the name behind the break a name of its own; the mask, or a space behind a character of a word, stands in for the backslash alone, the break staying the whitespace it is to PostCSS, so the parser reads the name behind the break as it reads one standing alone.
 *
 * The parse is remade after each pass of either mask, since the parser reads on to the next `)`, which another string may hold, and a string's parenthesis once masked may bring a divider to light, as a divider may an address holding such a string. The mask keeps the width, so parse indexes count in the file's text.
 * @param text - The value or params to mask.
 * @param spans - Its comment spans, from either scan.
 * @returns The masked text.
 */
export function hideParenthesesInUrlStrings (text: string, spans: (CommentSpan | InlineCommentSpan)[] = findCommentSpans(text)): string {
	let masked = text

	// Either mask may bring to light what the other reads: a string's parenthesis may hide a divider, and a divider an address holding one
	for (let found = true; found;) {
		let dividers = masked.includes(`\\`) ? findDividersInUrlNames(masked, spans) : []

		masked = maskAt(masked, dividers)

		let held = findHeldParentheses(masked, spans)

		masked = maskAt(masked, held.map((index) => ({ index, text: MASK })))
		found = dividers.length > 0 || held.length > 0
	}

	return masked
}
