import type { Node } from "postcss-value-parser"

import { IDENTIFIER_CODE_POINT, LEADING_CSS_WHITESPACE, LINE_BREAK, TRAILING_CSS_WHITESPACE, TRAILING_HEX_ESCAPE, WHITESPACE_ONLY } from "../../regexps.ts"
import { findInlineCommentEnd } from "../findInlineCommentEnd/index.ts"
import { isOnlyWhitespace } from "../isOnlyWhitespace/index.ts"
import { namesAnAddress } from "../namesAnAddress/index.ts"
import { type Address, readAddress } from "../readAddress/index.ts"
import { readEscapedCharacter } from "../readEscapedCharacter/index.ts"
import { readIdentifierCharacter } from "../readIdentifierCharacter/index.ts"
import { skipString } from "../skipString/index.ts"

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
 * The name must stand alone, since `image-url(` is a call. What the parentheses hold is {@link readAddress}'s reading: a quoted address leaves the rest of them code, so the walk reads on from behind the string and finds every comment written there ([#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378), [#557](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/557)); a bare one runs to the first `)` no escape holds and no comment or string covers, a quotation mark inside it a character of it wherever no comment is read there ([#504](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/504)). A comment inside such an address ends the room the address had, an address being one span ([#660](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/660)). `\61 \75 rl(` is a call.
 * @param text - The text walked for comments and addresses.
 * @param openIndex - Where it would start.
 * @param behindIdentifier - True behind a name: a {@link IDENTIFIER_CODE_POINT} code point, a `}` or an escape.
 * @param reading - What the syntax makes of a `//` comment.
 * @param spans - The comments the parentheses hold are added.
 * @param addresses - This one is added.
 * @param strings - The string of a quoted address is added.
 * @returns Where the walk reads on — behind the string of a quoted address, behind the `)` of a bare one — or `openIndex`.
 */
function skipUrl (text: string, openIndex: number, behindIdentifier: boolean, reading: CommentReading, spans: CommentSpan[], addresses: AddressSpan[], strings: StringSpan[]): number {
	if (behindIdentifier) return openIndex

	let behindName = skipUrlName(text, openIndex)

	if (behindName === openIndex) return openIndex

	let address = readAddress(text, behindName, text.slice(openIndex, behindName - 1), reading)

	if (address.isQuoted) {
		let end = skipString(text, address.index)

		strings.push({ start: address.index, end: Math.min(end, text.length) })
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

/** What the syntax makes of a `//` comment, as far as the walk asks: whether one opens, and whether the parser's own tokenizer reads one, which is `postcss-scss` reading Sass. */
export type CommentReading = {
	spells: boolean,
	tokenizes: boolean,
}

/** A syntax that spells a `//` comment and says nothing more. */
const SPELLS_INLINE_COMMENTS: CommentReading = { spells: true, tokenizes: false }

/** The span a `url()` address occupies. */
export type AddressSpan = {
	start: number,
	end: number,
}

/** The span a string occupies, its quotation marks included. */
export type StringSpan = {
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
 * @param reading - What the syntax makes of a `//` comment ({@link inlineCommentReading}).
 * @returns The spans of both, and of the strings the walk stepped over.
 */
function scan (text: string, reading: CommentReading): { comments: CommentSpan[], addresses: AddressSpan[], strings: StringSpan[] } {
	let spans: CommentSpan[] = []
	let addresses: AddressSpan[] = []
	let strings: StringSpan[] = []
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
			let behindUrl = skipUrl(text, index, behindIdentifier, reading, spans, addresses, strings)

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

			strings.push({ start: index, end: Math.min(end, text.length) })

			if (awaitsImportAddress) pushQuotedAddress(text, index, end, addresses)

			index = end
			behindIdentifier = false
			awaitsImportAddress = false
		}
		else if (character === `u` || character === `U`) {
			let behindUrl = skipUrl(text, index, behindIdentifier, reading, spans, addresses, strings)

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
		else if (character === `/` && next === `/` && reading.spells) {
			// The comment runs to the break PostCSS ends a line on; a bare `\r` and a form feed are text of it (#566).
			let end = findInlineCommentEnd(text, index)

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

	return { comments: spans, addresses, strings }
}

/**
 * Finds a text's comment spans; {@link scan} says what the walk reads.
 * @param text - The raw walked for comments.
 * @param reading - What the syntax makes of a `//` comment ({@link inlineCommentReading}).
 * @returns The spans.
 */
export function findCommentSpans (text: string, reading: CommentReading = SPELLS_INLINE_COMMENTS): CommentSpan[] {
	return scan(text, reading).comments
}

/**
 * Finds the spans of a text's addresses — a `url()`'s as {@link pushBareAddress} and {@link pushQuotedAddress} measure it, an `@import`'s as {@link pushQuotedAddress} does. The comment walk finds them, since one inside a comment is no address and each letter of a name may be an escape ([#344](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/344), [#427](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/427), [#552](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/552)).
 * @param text - The raw walked for addresses.
 * @param reading - What the syntax makes of a `//` comment ({@link inlineCommentReading}).
 * @returns The spans, in source order.
 */
export function findAddressSpans (text: string, reading: CommentReading = SPELLS_INLINE_COMMENTS): AddressSpan[] {
	return scan(text, reading).addresses
}

/**
 * Finds the spans of a text's strings: a quotation mark inside a comment or inside a bare address as {@link skipUrl} reads one opens none, and one behind an escape closes none. PostCSS reads a bare address only behind a lowercase `url(` with no whitespace inside it, so a quotation mark behind `url( ` or `URL(` opens a string to it and none here. A string the text never closes runs to its end.
 * @param text - The raw walked for strings.
 * @param reading - What the syntax makes of a `//` comment ({@link inlineCommentReading}).
 * @returns The spans, in source order.
 */
export function findStringSpans (text: string, reading: CommentReading = SPELLS_INLINE_COMMENTS): StringSpan[] {
	return scan(text, reading).strings
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
