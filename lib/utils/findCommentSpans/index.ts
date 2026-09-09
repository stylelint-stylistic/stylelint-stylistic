import type { Node } from "postcss-value-parser"

import { IDENTIFIER_CODE_POINT, LEADING_CSS_WHITESPACE, LINE_BREAK, TRAILING_CSS_WHITESPACE, TRAILING_HEX_ESCAPE, WHITESPACE_ONLY } from "../../regexps.ts"
import { isOnlyWhitespace } from "../isOnlyWhitespace/index.ts"
import { namesAnAddress } from "../namesAnAddress/index.ts"
import { type Address, readAddress } from "../readAddress/index.ts"
import { readEscapedCharacter } from "../readEscapedCharacter/index.ts"
import { readIdentifierCharacter } from "../readIdentifierCharacter/index.ts"

/**
 * Finds the break closing a `//` comment: the line feed, or the `\r` in front of it.
 * @param text - The text the comment opened in.
 * @param openIndex - Where the comment opens.
 * @returns The break, or the text's length.
 */
function findLineBreak (text: string, openIndex: number): number {
	let index = text.indexOf(`\n`, openIndex)

	if (index === -1) return text.length

	return text[index - 1] === `\r` ? index - 1 : index
}

/**
 * Skips the name of an `@import`, whose letters may be escapes as a `url(`'s are: `@\69 mport` and `@IMPORT` name the same at-rule, `@imports` another word. Nothing in front is asked about, since `@` is no identifier code point and ends whatever name stands there.
 * @param text - The text the name is read out of.
 * @param openIndex - The `@`.
 * @returns Behind the name, or `openIndex`.
 */
function skipImportName (text: string, openIndex: number): number {
	let index = openIndex + 1

	for (let letter of `import`) {
		let { character, end } = readIdentifierCharacter(text, index)

		if (character?.toLowerCase() !== letter) return openIndex

		index = end
	}

	let next = text[index]

	if (next === `\\` || (next !== undefined && IDENTIFIER_CODE_POINT.test(next))) return openIndex

	return index
}

/**
 * Skips a `url(`; each letter may be an escape, so three identifier characters go to {@link namesAnAddress}.
 * @param text - The text the name is read out of.
 * @param openIndex - Where it would open.
 * @returns Behind the `(`, or `openIndex`.
 */
function skipUrlName (text: string, openIndex: number): number {
	let index = openIndex

	for (let step = 0; step < 3; step += 1) index = readIdentifierCharacter(text, index).end

	if (text[index] !== `(`) return openIndex

	return namesAnAddress(text.slice(openIndex, index)) ? index + 1 : openIndex
}

/**
 * Skips a `url()` token, whose bare address carries `//` and `/*` as ordinary characters.
 *
 * The name must stand alone, since `image-url(` is a call. What the parentheses hold is {@link readAddress}'s reading: a quoted address leaves the rest of them code, so the walk reads on from behind the string and finds every comment written there ([#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378), [#557](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/557)); a bare one runs to the first `)` no escape holds and no comment covers, a quotation mark inside it a character of it ([#504](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/504)). A comment inside such an address ends the room the address had, an address being one span ([#660](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/660)). `\61 \75 rl(` is a call.
 * @param text - The text walked for comments and addresses.
 * @param openIndex - Where it would start.
 * @param behindIdentifier - True behind a name: a {@link IDENTIFIER_CODE_POINT} code point, a `}` or an escape.
 * @param spans - The comments the parentheses hold are added.
 * @param addresses - This one is added.
 * @returns Where the walk reads on — behind the string of a quoted address, behind the `)` of a bare one — or `openIndex`.
 */
function skipUrl (text: string, openIndex: number, behindIdentifier: boolean, spans: CommentSpan[], addresses: AddressSpan[]): number {
	if (behindIdentifier) return openIndex

	let behindName = skipUrlName(text, openIndex)

	if (behindName === openIndex) return openIndex

	let address = readAddress(text, behindName)

	if (address.isQuoted) {
		let end = skipString(text, address.index)

		pushQuotedAddress(text, address.index, end, addresses)

		return end
	}

	let [start, end] = bareAddressRoom(text, behindName, address)

	spans.push(...address.comments)
	pushBareAddress(text, start, end, addresses)

	return address.index + 1
}

/**
 * Finds the room a bare address stands in: the first run of code the parentheses hold that is not whitespace alone, since an address is one span and a comment inside them parts what they hold ([#660](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/660)).
 * @param text - The text holding the `url()` token.
 * @param openIndex - Behind the `(`.
 * @param address - What {@link readAddress} read of the parentheses.
 * @returns The room, from behind the `(` or from behind a comment.
 */
function bareAddressRoom (text: string, openIndex: number, address: Address): [number, number] {
	let start = openIndex

	for (let comment of address.comments) {
		if (!isOnlyWhitespace(text.slice(start, comment.start))) return [start, comment.start]

		start = comment.end
	}

	return [start, address.index]
}

/**
 * Skips a quoted string; an escaped quote closes nothing.
 * @param text - The text holding the string.
 * @param openIndex - The opening quote.
 * @returns Behind the closing quote.
 */
function skipString (text: string, openIndex: number): number {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) index += text[index] === `\\` ? 2 : 1

	return index + 1
}

/**
 * Measures the trailing whitespace of a text, less what an escape owns: `a\\ ` is `a` and a space.
 * @param text - What the parentheses of a `url()` hold.
 * @returns The length of the run.
 */
function trailingWhitespaceLength (text: string): number {
	let run = text.match(TRAILING_CSS_WHITESPACE)?.[0].length ?? 0

	if (run === 0) return 0

	let runStart = text.length - run
	let head = text.slice(0, runStart)
	let escape = head.match(TRAILING_HEX_ESCAPE)?.[0] ?? (head.endsWith(`\\`) ? `\\` : undefined)

	if (escape === undefined) return run

	let openIndex = runStart - escape.length
	let backslashes = 0

	while (head[openIndex - backslashes] === `\\`) backslashes += 1

	if (backslashes % 2 === 0) return run

	return run - (readIdentifierCharacter(text, openIndex).end - runStart)
}

/**
 * Records the bare address a `url()` holds: the code its parentheses open on, whitespace off. A no-break space is part of it ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)); a run reaching past a line, whose `)` may be lines below, is none; empty parentheses hold none.
 * @param text - The text holding the `url()` token.
 * @param openIndex - Behind the `(`.
 * @param closeIndex - The `)`, or where the comment ending the address's room opens.
 * @param addresses - This one is added.
 */
function pushBareAddress (text: string, openIndex: number, closeIndex: number, addresses: AddressSpan[]): void {
	let held = text.slice(openIndex, closeIndex)
	let start = openIndex + (held.match(LEADING_CSS_WHITESPACE)?.[0].length ?? 0)
	let end = closeIndex - trailingWhitespaceLength(held)

	if (start < end && !LINE_BREAK.test(text.slice(start, end))) addresses.push({ start, end })
}

/**
 * Records a quoted address, its quotation marks part of the span: the string behind an `@import`'s name, and the one a `url()`'s parentheses open on. A string closed by no mark is none, and so is one holding a break the caller counts a line by, which reaches past that line.
 * @param text - The text holding the string.
 * @param openIndex - The opening quotation mark.
 * @param end - Behind the closing one, as {@link skipString} read it.
 * @param addresses - This one is added.
 */
function pushQuotedAddress (text: string, openIndex: number, end: number, addresses: AddressSpan[]): void {
	if (end <= text.length && !LINE_BREAK.test(text.slice(openIndex, end))) addresses.push({ start: openIndex, end })
}

/** The span a `url()` address occupies. */
export type AddressSpan = {
	start: number,
	end: number,
}

/** The span a comment occupies, and which kind it is. */
export type CommentSpan = {
	start: number,
	end: number,
	isInline: boolean,
}

/**
 * Walks a text once for its comments and addresses, each the other's exception: a protocol's `//` opens no comment, a `url(` inside a comment no address ([#427](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/427)). A block comment's span holds its delimiters, a `//` comment's stops at the break.
 *
 * The address of an `@import` is the string standing behind the name, which only the walk can find: a pattern over the text cannot say where that string closes, nor whether the `@import` it matched is code rather than the text of a comment or of another string ([#552](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/552)). Whitespace and comments stand between the name and the string; anything else ends the wait.
 * @param text - The value, selector or params walked.
 * @param spellsInlineComments - False where the syntax spells none ({@link readsInlineComments}).
 * @returns The spans of both.
 */
function scan (text: string, spellsInlineComments: boolean): { comments: CommentSpan[], addresses: AddressSpan[] } {
	let spans: CommentSpan[] = []
	let addresses: AddressSpan[] = []
	let index = 0
	// Whether the run just stepped over is part of a name
	let behindIdentifier = false
	// Whether an `@import` name has been read and its address not yet
	let awaitsImportAddress = false

	while (index < text.length) {
		let character = text.charAt(index)
		let next = text[index + 1]

		if (character === `\\`) {
			// A backslash makes the next character ordinary: `a\//b` opens no comment. An escape can spell a letter of `url`, so an address is looked for first.
			let behindUrl = skipUrl(text, index, behindIdentifier, spans, addresses)

			if (behindUrl === index) {
				let escaped = readEscapedCharacter(text, index)

				index = escaped.end
				behindIdentifier = escaped.character !== undefined
			}
			else {
				index = behindUrl
				behindIdentifier = false
			}

			awaitsImportAddress = false
		}
		else if (character === `"` || character === `'`) {
			let end = skipString(text, index)

			if (awaitsImportAddress) pushQuotedAddress(text, index, end, addresses)

			index = end
			behindIdentifier = false
			awaitsImportAddress = false
		}
		else if (character === `u` || character === `U`) {
			let behindUrl = skipUrl(text, index, behindIdentifier, spans, addresses)

			if (behindUrl === index) {
				index += 1
				behindIdentifier = true
			}
			else {
				index = behindUrl
				behindIdentifier = false
			}

			awaitsImportAddress = false
		}
		else if (character === `@`) {
			let behindName = skipImportName(text, index)

			awaitsImportAddress = behindName !== index
			index = awaitsImportAddress ? behindName : index + 1
			behindIdentifier = false
		}
		else if (character === `/` && next === `*`) {
			let closeIndex = text.indexOf(`*/`, index + 2)
			let end = closeIndex === -1 ? text.length : closeIndex + 2

			spans.push({ start: index, end, isInline: false })
			index = end
			behindIdentifier = false
		}
		else if (character === `/` && next === `/` && spellsInlineComments) {
			// The comment runs to the break PostCSS ends a line on; a bare `\r` and a form feed are text of it (#566).
			let end = findLineBreak(text, index)

			spans.push({ start: index, end, isInline: true })
			index = end
			behindIdentifier = false
		}
		else {
			// `@{prefix}url(` spells a name, so `}` counts as one
			behindIdentifier = character === `}` || IDENTIFIER_CODE_POINT.test(character)
			index += 1

			if (!WHITESPACE_ONLY.test(character)) awaitsImportAddress = false
		}
	}

	return { comments: spans, addresses }
}

/**
 * Finds a text's comment spans; {@link scan} says what the walk reads.
 * @param text - The raw walked for comments.
 * @param spellsInlineComments - False where the syntax spells none ({@link readsInlineComments}).
 * @returns The spans.
 */
export function findCommentSpans (text: string, spellsInlineComments: boolean = true): CommentSpan[] {
	return scan(text, spellsInlineComments).comments
}

/**
 * Finds the spans of a text's addresses — a `url()`'s as {@link pushBareAddress} and {@link pushQuotedAddress} measure it, an `@import`'s as {@link pushQuotedAddress} does. The comment walk finds them, since one inside a comment is no address and each letter of a name may be an escape ([#344](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/344), [#427](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/427), [#552](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/552)).
 * @param text - The raw walked for addresses.
 * @param spellsInlineComments - False where the syntax spells none ({@link readsInlineComments}).
 * @returns The spans, in source order.
 */
export function findAddressSpans (text: string, spellsInlineComments: boolean = true): AddressSpan[] {
	return scan(text, spellsInlineComments).addresses
}

/**
 * Finds the comment span holding a position: a node's opening, or the `)` a call was closed on.
 * @param index - The position.
 * @param spans - The spans found in the text.
 * @returns The span, or nothing.
 */
export function findCommentSpanAt<Span extends Pick<CommentSpan, `start` | `end`>> (index: number, spans: Span[]): Span | undefined {
	return spans.find(({ start, end }) => index >= start && index < end)
}

/**
 * Finds the comment span holding a node of a value parse. `postcss-value-parser` has no node for a `//` comment ([#271](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271)) and closes a block comment on the first `*\/` ([#275](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275), [#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378)). Only the opening is read: a node opening inside a comment is text of it; a call closed on a `)` inside one is {@link findCommentSpanAt}'s question ([#320](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320)).
 * @param valueNode - The node of the parse whose opening is asked about.
 * @param spans - The spans {@link findCommentSpans} found.
 * @returns The span, or nothing.
 */
export function findCommentSpanHolding (valueNode: Node, spans: CommentSpan[]): CommentSpan | undefined {
	return findCommentSpanAt(valueNode.sourceIndex, spans)
}

/**
 * Finds the comment span a node of a value parse overlaps: the writer's question, unlike {@link findCommentSpanHolding}'s, since a node opening outside a comment and reaching into one is a node of the value, yet writing it back rewrites the comment. A call reaches, since the parser closes it on any `)`; so does a string.
 * @param valueNode - The node about to be written back.
 * @param spans - The spans {@link findCommentSpans} found.
 * @returns The span, or nothing.
 */
export function findCommentSpanTouching (valueNode: Pick<Node, `sourceIndex` | `sourceEndIndex`>, spans: CommentSpan[]): CommentSpan | undefined {
	return spans.find(({ start, end }) => valueNode.sourceIndex < end && valueNode.sourceEndIndex > start)
}
