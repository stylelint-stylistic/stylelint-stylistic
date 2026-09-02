import type { Node } from "postcss-value-parser"

import { IDENTIFIER_CODE_POINT, WHITESPACE_ONLY } from "../../regexps.ts"
import { namesAnAddress } from "../namesAnAddress/index.ts"
import { readIdentifierCharacter } from "../readIdentifierCharacter/index.ts"

/**
 * Finds the break that closes an inline comment opened at the given index: the line feed, or the carriage return of the Windows pair in front of one.
 * @param text - The string being scanned.
 * @param openIndex - The index the comment opens at.
 * @returns The index the break opens at, or the end of the string where the comment runs to it.
 */
function findLineBreak (text: string, openIndex: number): number {
	let index = text.indexOf(`\n`, openIndex)

	if (index === -1) return text.length

	return text[index - 1] === `\r` ? index - 1 : index
}

/**
 * Skips the name of a `url()` and the parenthesis it opens on, whose three letters CSS lets a stylesheet spell with an escape wherever it likes.
 *
 * Three characters of an identifier are read off whatever they spell, and what they spelled is put to {@link namesAnAddress}, the one reading of that question the plugin holds. Reading them first and asking afterwards costs a step on a name that is no address and saves the helper from having to find where the name ends, which the caller of a scan knows and the reader of a name does not.
 * @param text - The string being scanned.
 * @param openIndex - The index the name would open at.
 * @returns The index behind the opening parenthesis, or the given one where no `url(` is spelled from there.
 */
function skipUrlName (text: string, openIndex: number): number {
	let index = openIndex

	for (let step = 0; step < 3; step += 1) index = readIdentifierCharacter(text, index).end

	if (text[index] !== `(`) return openIndex

	return namesAnAddress(text.slice(openIndex, index)) ? index + 1 : openIndex
}

/**
 * Skips a `url()` token, whose address carries its double slashes as ordinary characters whether it is quoted or bare. The name has to stand on its own — `image-url(`, `image-\75 rl(` and `@{prefix}url(` all end in a name spelling `url` while being ordinary calls, whose arguments may hold a comment — and the parentheses are counted rather than searched for, since an interpolated address brings its own. A parenthesis that is escaped is none, and neither is one standing between the quotation marks of a quoted address or of a string whitespace parts from the opening parenthesis; inside a bare address every parenthesis counts, quotation marks or not. A token left open is taken for no token at all, so that a comment standing behind it is still seen.
 *
 * What a `/*` inside the parentheses opens turns on what follows the opening one, and the tokenizers of PostCSS, `postcss-scss` and `postcss-less` are asked (#378). A bare address — one opening on anything but a quotation mark or whitespace — holds no comment at all: all three read `url(a/* x)` as one token closed on its parenthesis, and Less itself compiles `url(a/* x) 1PX /* c *\/ 3PX` with the address intact and the second comment a comment. The scan used to skip such a `/*` to the next `*\/` of the text, or to its end, and where that lay past the parenthesis the token was left open, the address was read again as a call, and a comment standing nowhere in the file ran from that `/*` and took the code between for its text. Beside a quoted address a comment is a comment to all three, so one found there is kept and handed out with the token — a double slash beside a quoted address stays code, which it is to PostCSS and to `postcss-less`, the file being no Less at all. Where whitespace parts the parenthesis from the address the tokenizers disagree: PostCSS reads a comment there and lets it carry the parenthesis, `postcss-scss` reads one bracket token closed on the first parenthesis whatever a comment says, and Less keeps the comment as text of the address. The scan reads no comment there and lets the first parenthesis close the token, since that is the one reading under which such a text reaches a rule at all — a comment reaching past the parenthesis leaves PostCSS's parenthesis unclosed, and PostCSS refuses the file. Which reading is the right one where the comment closes inside the parentheses is #427's question; none of the three hands the scan a span for it, as none did before.
 *
 * A quotation mark inside a bare address is a character of the address, and the first closing parenthesis closes the token whatever the mark did — the first behind no backslash to PostCSS and `postcss-less`, the first wherever it stands to `postcss-scss`, which reads no escape there: PostCSS, `postcss-scss` and `postcss-less` all read `url(a"b)c" /* " *\/ "d"` as the token `url(a"b)`, the word `c` and the string `" /* "`, and no comment at all. The scan used to skip such a mark to the next one as a string, take the parenthesis inside for the string's, and, where no parenthesis was left behind it, give the token up and read the mark again as a string of the value — one mark late, so that the slash and the star standing inside the string `" /* "` opened a comment to it that no tokenizer reads (#504). A mark inside a quoted address or one whitespace parts from its parenthesis is still a string's, as it is to PostCSS and to `postcss-less`, which read `url( "a)b" )` down to the string's own closing mark and the parenthesis behind it.
 *
 * Whether a name stands in front of this one is a question the scan answers as it goes rather than by looking back a character, since an escape spells a character of a name with several and the last of those tells nothing: the `\61 ` opening `\61 \75 rl(` closes on a space and the `\\` opening `\\\75 rl(` on a backslash, while both spell a name and both leave an ordinary call — `aurl(` and `\url(` — which is what `lightningcss` reads there.
 *
 * The loop inside steps two characters at a backslash where the loop outside steps the whole escape, and needs no more: behind those two only hexadecimal digits and the one whitespace closing them can still belong to the escape, and none of those is a parenthesis, a quotation mark or a slash.
 * @param text - The string being scanned.
 * @param openIndex - The index the token would start at.
 * @param behindIdentifier - True where the character run in front of the index is one this scan reads as part of a name: a code point {@link IDENTIFIER_CODE_POINT} names, a closing brace, or an escape spelling anything at all. The code points are the ones the grammar names and not the ASCII ones alone, so `éurl(http://x)` and `日本url(http://x)` are the ordinary calls `lightningcss` reads there rather than addresses.
 * @param spans - The spans found so far, which the comments beside a quoted address are added to once the token is known to close.
 * @returns The index behind the closing parenthesis, or the given one if no `url()` starts and ends there.
 */
function skipUrl (text: string, openIndex: number, behindIdentifier: boolean, spans: CommentSpan[]): number {
	if (behindIdentifier) return openIndex

	let behindName = skipUrlName(text, openIndex)

	if (behindName === openIndex) return openIndex

	let opening = text.charAt(behindName)
	let isQuoted = opening === `"` || opening === `'`
	let isBare = !isQuoted && !WHITESPACE_ONLY.test(opening)
	let found: CommentSpan[] = []
	let depth = 1
	let index = behindName

	while (index < text.length && depth > 0) {
		let character = text.charAt(index)

		if (character === `\\`) {
			index += 2
		}
		else if (!isBare && (character === `"` || character === `'`)) {
			index = skipString(text, index)
		}
		else if (isQuoted && character === `/` && text[index + 1] === `*`) {
			let closeIndex = text.indexOf(`*/`, index + 2)
			let end = closeIndex === -1 ? text.length : closeIndex + 2

			found.push({ start: index, end, isInline: false })
			index = end
		}
		else {
			if (character === `(`) depth += 1
			else if (character === `)`) depth -= 1

			index += 1
		}
	}

	if (depth > 0) return openIndex

	spans.push(...found)

	return index
}

/**
 * Skips a quoted string, from its opening quote to the character behind its closing one. An escaped quotation mark closes nothing, and a string mistaken for closed here would leave the text of the next one exposed to the scan.
 * @param text - The string being scanned.
 * @param openIndex - The index of the opening quote.
 * @returns The index behind the closing quote, or the end of the scanned string.
 */
function skipString (text: string, openIndex: number): number {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) index += text[index] === `\\` ? 2 : 1

	return index + 1
}

/** The span a comment occupies in a text, in the coordinates of that text, and which of the two kinds it is. */
export type CommentSpan = {
	start: number,
	end: number,
	isInline: boolean,
}

/**
 * Finds the spans the comments of a text occupy in it, block comments and inline ones alike. A double slash belonging to an address opens no comment, whether the address is quoted or bare inside `url()`, and neither does a slash an escape spells wherever it stands; a block comment runs to its `*\/` and an inline one to the end of its line.
 *
 * The span of a block comment holds its delimiters, since the two of them are as much the comment as its text is. The span of an inline comment ends where the break that closes it begins, the break itself staying outside: a caller taking the comment out of the text keeps the line it stood on. A syntax that spells no comment with a double slash — plain CSS is one — has none to find, and the caller says so. The pair is then two characters of code like any other, and the second of them opens a block comment where a `*` follows it: `//*c*\/` holds one comment in such a file and none of the other kind, which is the reading that keeps `1px //*c,d*\/,2px` in one piece.
 * @param text - The text to scan.
 * @param spellsInlineComments - False where the syntax that spelled the text writes no comment with a double slash, which {@link readsInlineComments} answers for a node.
 * @returns The spans, in the coordinates of the scanned text.
 */
export function findCommentSpans (text: string, spellsInlineComments: boolean = true): CommentSpan[] {
	let spans: CommentSpan[] = []
	let index = 0
	// Whether what the loop has just stepped over is spelled the way a name is, which is what `skipUrl` needs to know about the run in front of the address it is offered. It opens false, an address opening the text having no name in front of itself.
	let behindIdentifier = false

	while (index < text.length) {
		let character = text.charAt(index)
		let next = text[index + 1]

		if (character === `\\`) {
			// A backslash spells the character behind it into an ordinary one everywhere code stands, and not only inside the `url()` and the quoted string whose own loops already step over one. `a\//b` opens no comment — Less compiles it to `a\/ / b`, and Sass hands it back as it came — and neither does `a\"b`, whose quotation mark used to open a string that ran to the end of the text and took every comment behind it with it. Inside the text of a comment no syntax reads an escape, and none is read here either: a block comment is skipped to its closing delimiter and an inline one to its break, so the loop never reaches a backslash standing in either.
			//
			// An escape spells a letter of a name as readily as it takes the meaning from a delimiter, so an address is looked for from the backslash rather than from behind it: `\75 rl(http://x)` and `\url(http://x)` are the token that `url(http://x)` is. Where no address is spelled there the escape is stepped over whole, so that the first backslash of `\\//` escapes the second rather than the slash, and so that the next question about a name is put behind the whole of this escape rather than in the middle of it.
			let behindUrl = skipUrl(text, index, behindIdentifier, spans)

			if (behindUrl === index) {
				let escaped = readIdentifierCharacter(text, index)

				index = escaped.end
				behindIdentifier = escaped.character !== undefined
			}
			else {
				index = behindUrl
				behindIdentifier = false
			}
		}
		else if (character === `"` || character === `'`) {
			index = skipString(text, index)
			behindIdentifier = false
		}
		else if (character === `u` || character === `U`) {
			let behindUrl = skipUrl(text, index, behindIdentifier, spans)

			if (behindUrl === index) {
				index += 1
				behindIdentifier = true
			}
			else {
				index = behindUrl
				behindIdentifier = false
			}
		}
		else if (character === `/` && next === `*`) {
			let closeIndex = text.indexOf(`*/`, index + 2)
			let end = closeIndex === -1 ? text.length : closeIndex + 2

			spans.push({ start: index, end, isInline: false })
			index = end
			behindIdentifier = false
		}
		else if (character === `/` && next === `/` && spellsInlineComments) {
			// The comment runs to the break PostCSS reads a line in, a line feed with or without the carriage return of a Windows pair in front of it; a bare carriage return and a form feed are whitespace of the comment's text, as they are whitespace everywhere else
			let end = findLineBreak(text, index)

			spans.push({ start: index, end, isInline: true })
			index = end
			behindIdentifier = false
		}
		else {
			// A closing brace is no code point of an identifier and is counted here all the same, since the interpolation it closes stands where a run of a name stands: `@{prefix}url(` and `#{$p}url(` each spell one name, the way `image-url(` does. `findFunctionArgumentSpans` puts the same predicate to the same text and leaves the brace out, because the question there is what a call is named — and an interpolation names nothing that can be looked up.
			behindIdentifier = character === `}` || IDENTIFIER_CODE_POINT.test(character)
			index += 1
		}
	}

	return spans
}

/**
 * Finds the span of the comment holding a position of a text, where one holds it.
 *
 * The position is one of the text the spans were found in, whatever a caller reads there — the opening of a node, which {@link findCommentSpanHolding} asks about, or a character the parser put a meaning on, such as the parenthesis a call was closed on.
 * @param index - The position, counted in the text the spans were found in.
 * @param spans - The spans {@link findCommentSpans} found in that text.
 * @returns The span holding the position, or nothing where no comment does.
 */
export function findCommentSpanAt (index: number, spans: CommentSpan[]): CommentSpan | undefined {
	return spans.find(({ start, end }) => index >= start && index < end)
}

/**
 * Finds the span of the comment holding a node of a value parse, where one holds it.
 *
 * `postcss-value-parser` has a node for a block comment and none for a comment opened by a double slash, so the text of an inline one reaches a rule as ordinary words, functions and divs, and a rule walking that parse works on the text of the comment as it works on the value, reporting about it and writing into it, unless it asks this (#271). A block comment reaches the rule as a node of its own — but only where the parser closes it where CSS does. CSS closes a comment on the first `*\/` behind its opening, and the parser looks for that delimiter from the opening slash itself, letting the star of the opening serve as the star of the closing: a comment opening `/*\/` closes three characters in to the parser, and everything the file wrote behind that slash comes back as words, strings and calls of the value. So the question is put to every comment the file spells, block and inline alike, the way #275 put it for the commas: a span the scan lays over a block comment is exactly the text CSS reads as that comment, and no node of the value can open inside one (#378).
 *
 * The question is put to the position the node opens at, and says nothing about where the node ends. A node opening inside a comment is a node of that comment's text however far it reaches: a call opened there and closed on the line below, or behind the delimiter that closes a block comment, is handed back whole, and what the parser made of it is a reading of a comment rather than anything the file spells. A node opening outside one is a node of the value however far it reaches, and a call is the one that reaches far — whether the parser closed it on a parenthesis standing inside a comment is a second question, put to that parenthesis through {@link findCommentSpanAt} and answered the same way (#320).
 *
 * A caller therefore refuses the node and goes on walking what it holds, asking the same of each: a node standing behind the comment is code the file spells, wherever the parser filed it. The node the parser makes of a block comment opens on the comment's own first character, and is answered "inside" like everything else the span holds — which is the answer every caller gives such a node anyway.
 * @param valueNode - The node the walk has reached.
 * @param spans - The spans {@link findCommentSpans} found in the text the node was parsed from, which the node's positions count in.
 * @returns The span holding the node, or nothing where the node is one of the value.
 */
export function findCommentSpanHolding (valueNode: Node, spans: CommentSpan[]): CommentSpan | undefined {
	return findCommentSpanAt(valueNode.sourceIndex, spans)
}

/**
 * Finds the span of a comment whose text a node of a value parse carries any of, where one does.
 *
 * This is the question a caller writing a node back has to put, and it is not the one {@link findCommentSpanHolding} answers. That one says what a node *is* — a node of the comment's text or a node of the value — and is put to the position the node opens at alone. A node opening outside a comment and reaching past its opening is a node of the value all the same, and yet the text it carries holds the comment, so writing it back by any means other than the file's own characters rewrites that comment.
 *
 * A call is the node that reaches: `postcss-value-parser` closes one on a parenthesis wherever it finds one, the text of a comment included, so `f( // c` and a closing parenthesis on the line below is one call carrying a whole comment inside it. A string reaches the same way, pairing the quotation mark it opens on with the next one the text holds, wherever that one stands.
 * @param valueNode - The node about to be written back, of which only its span is read.
 * @param spans - The spans {@link findCommentSpans} found in the text the node was parsed from, which the node's positions count in.
 * @returns The span the node overlaps, or nothing where the node carries no comment's text.
 */
export function findCommentSpanTouching (valueNode: Pick<Node, `sourceIndex` | `sourceEndIndex`>, spans: CommentSpan[]): CommentSpan | undefined {
	return spans.find(({ start, end }) => valueNode.sourceIndex < end && valueNode.sourceEndIndex > start)
}
