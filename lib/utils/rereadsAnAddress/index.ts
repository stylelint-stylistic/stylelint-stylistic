import type { AtRule, Declaration, Rule } from "postcss"

import { MEDIA_QUERY_COMBINATORS } from "../../reference/mediaQueries.ts"
import { ENDS_WITH_ASCII_LETTER, ENDS_WITH_ESCAPE, EVERY_COMMA, IDENTIFIER_CODE_POINT, INLINE_COMMENT_BREAK_OR_FORM_FEED, LEADING_WORDLESS_TOKEN, OPENS_NO_IDENTIFIER, OPENS_WITH_QUOTE_OR_CSS_WHITESPACE, PARENTHESES_READ_AS_CODE, PARENTHESIS_OR_SQUARE_BRACKET, POSTCSS_WORD_END, QUOTE_OR_SOLIDUS, SCSS_WORD_END, SEMICOLON_OR_BRACE, TRAILING_BACKSLASHES, TRAILING_IDENTIFIER_RUN, VALUE_PARSER_WORD_END } from "../../regexps.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import type { CommentReading } from "../findCommentSpans/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"
import { joinsTheName } from "../joinsTheName/index.ts"
import { skipString } from "../skipString/index.ts"

/**
 * Reads a word as the tokenizer does: its first character is its own whatever it is, and it ends in front of the next character that opens a token.
 * @param text - The text holding the word.
 * @param index - The word's first character.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @returns Behind the word.
 */
function wordEnd (text: string, index: number, reading: Pick<CommentReading, `tokenizes`>): number {
	let ahead = text.slice(index + 1).search(reading.tokenizes ? SCSS_WORD_END : POSTCSS_WORD_END)

	return ahead === -1 ? text.length : index + 1 + ahead
}

/**
 * Reads the token at a position that pushes no word: whitespace, a comment, a string, an at-word, an escape, a `)` and a character read as a token of its own, with a comma, an interpolation and a `//` comment among them under `postcss-scss`'s tokenizer.
 * @param text - The text holding the token.
 * @param index - The token's first character.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @returns Behind the token, nothing where a word stands there, or -1 where a comment nothing closes does.
 */
function wordlessTokenEnd (text: string, index: number, reading: Pick<CommentReading, `tokenizes`>): number | undefined {
	let character = text[index]
	let rest = text.slice(index)

	if (character === `"` || character === `'`) return reading.tokenizes ? skipScssString(text, index) : skipString(text, index)

	if (rest.startsWith(`/*`)) {
		let commentEnd = text.indexOf(`*/`, index + 2)

		return commentEnd === -1 ? -1 : commentEnd + 2
	}

	if (reading.tokenizes && rest.startsWith(`//`)) {
		let breakIndex = rest.search(INLINE_COMMENT_BREAK_OR_FORM_FEED)

		return breakIndex === -1 ? -1 : index + breakIndex
	}

	if (reading.tokenizes && rest.startsWith(`#{`)) return skipScssInterpolation(text, index)

	if (character === `)` || (reading.tokenizes && character === `,`)) return index + 1

	let token = rest.match(LEADING_WORDLESS_TOKEN)

	return token === null ? undefined : index + token[0].length
}

/**
 * Asks whether what stands right behind a `(` keeps the parentheses code where the word popped there is `url`: a quotation mark under either tokenizer, and whitespace under PostCSS's alone, which `postcss-less` reads by and `postcss-scss` parted from.
 * @param text - The text holding the parentheses.
 * @param openIndex - The `(`.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @returns True where the parentheses stay code.
 */
function keepsParenthesesCode (text: string, openIndex: number, reading: Pick<CommentReading, `tokenizes`>): boolean {
	let behind = text[openIndex + 1]

	return reading.tokenizes ? behind === `"` || behind === `'` : OPENS_WITH_QUOTE_OR_CSS_WHITESPACE.test(text.slice(openIndex + 1))
}

/**
 * Reads the parentheses at which the tokenizer popped a word, or found none to pop: it passes over them where it takes them as one token, and steps inside where it reads them as code, whose own words it pushes in their turn.
 *
 * A `url` popped here opens a token of its own, closed by the first `)` no backslash escapes under PostCSS and by the count of parentheses under `postcss-scss`, unless a quotation mark right behind the `(` keeps the parentheses code — under PostCSS's tokenizer whitespace keeps them code as well. Other parentheses are one token only while the text to their first `)` holds no character breaking it, and PostCSS reads every `(` to that text's end as code once one of them is read that way (`lastBadParen`), where `postcss-scss` asks afresh at each one.
 * @param text - The text holding the parentheses.
 * @param openIndex - The `(`.
 * @param popped - The word the `(` popped, or nothing where the stack held none.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @param codeEnd - How far the run of parentheses PostCSS reads as code reaches.
 * @returns Where the walk goes on and how far that run then reaches, or nothing where no `)` closes a token the tokenizer opened.
 */
function readPoppedParentheses (text: string, openIndex: number, popped: string | undefined, reading: Pick<CommentReading, `tokenizes`>, codeEnd: number): { codeEnd: number, index: number } | undefined {
	if (popped === `url` && !keepsParenthesesCode(text, openIndex, reading)) {
		let tokenEnd = reading.tokenizes ? scssTokenClosingIndex(text, openIndex + 1) : closingParenthesisIndex(text, openIndex + 1)

		return tokenEnd === -1 ? undefined : { codeEnd, index: tokenEnd + 1 }
	}

	let closeIndex = text.indexOf(`)`, openIndex + 1)
	let readsAsCode = openIndex <= codeEnd || closeIndex === -1 || PARENTHESES_READ_AS_CODE.test(text.slice(openIndex, closeIndex + 1))

	if (!readsAsCode) return { codeEnd, index: closeIndex + 1 }

	return { codeEnd: reading.tokenizes || openIndex <= codeEnd ? codeEnd : (closeIndex === -1 ? text.length : closeIndex), index: openIndex + 1 }
}

/**
 * Walks a text as the tokenizer does, up to the `(` the caller asks about.
 *
 * The tokenizer pushes every word it reads and pops one word at each `(`, and the word popped there is the one deciding whether the parentheses open a token: a word popped by one `(` is gone from the next, so `url x(y)(a` opens a token at the second `(`. The tokens pushing no word are {@link wordlessTokenEnd}'s, while any other is a word.
 *
 * The whole text is read, from its opening rather than from the parenthesis, since both the stack and the reading of parentheses carry state ({@link readPoppedParentheses}). The text is read as it is spelled, so that a break written into a token is asked about too. A `(` the walk passes over inside a token is never asked about: the parser reads no parentheses there.
 * @param text - The text read.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @param isAsked - Asked at each `(` the parser reads, with its index and the word popped there.
 * @returns The `(` and the word popped at it, or nothing where the walk reaches no such parenthesis.
 */
function walkToParenthesis (text: string, reading: Pick<CommentReading, `tokenizes`>, isAsked: (openIndex: number, popped: { end: number, text: string } | undefined) => boolean): { openIndex: number, popped: string | undefined } | undefined {
	let stack: { end: number, text: string }[] = []
	let codeEnd = -1
	let index = 0

	while (index < text.length) {
		if (text[index] === `(`) {
			let popped = stack.pop()

			if (isAsked(index, popped)) return { openIndex: index, popped: popped?.text }

			let read = readPoppedParentheses(text, index, popped?.text, reading, codeEnd)

			if (!read) return undefined

			codeEnd = read.codeEnd
			index = read.index

			continue
		}

		let step = wordlessTokenEnd(text, index, reading)

		if (step === -1) return undefined

		if (step === undefined) {
			let end = wordEnd(text, index, reading)

			stack.push({ end, text: text.slice(index, end) })
			index = end
		}
		else index = step
	}

	return undefined
}

/**
 * Finds the `(` at which the tokenizer pops the name itself off the stack of words it keeps.
 *
 * The name is the word a `(` pops only where that word ends right behind the name: a letter there joins the name into a longer word, and a plain token holding the name never pushes it at all.
 * @param text - The text holding the name.
 * @param nameEnd - Behind the name.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @returns Behind the `(`, or -1 where nothing pops the name.
 */
function openingParenthesisBehind (text: string, nameEnd: number, reading: Pick<CommentReading, `tokenizes`>): number {
	let read = walkToParenthesis(text, reading, (_openIndex, popped) => popped?.end === nameEnd)

	return read ? read.openIndex + 1 : -1
}

/**
 * Asks whether the word the tokenizer pops at a `(` is `url` itself, which is what opens a token there. The comparison is the tokenizer's, which knows no escape and no other case: `\75 rl(` and `URL(` open none, however Sass and `lightningcss` read them.
 * @param text - The text holding the parentheses.
 * @param openIndex - The `(`.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @returns True where the parentheses are an address's to the parser.
 */
function popsTheAddressName (text: string, openIndex: number, reading: Pick<CommentReading, `tokenizes`>): boolean {
	return walkToParenthesis(text, reading, (index) => index === openIndex)?.popped === `url`
}

/**
 * Finds the first `)` no backslash escapes, where PostCSS's tokenizer closes a bare address.
 * @param text - The text holding the address.
 * @param openIndex - Behind the `(`.
 * @returns Its index, or -1 where none stands.
 */
function closingParenthesisIndex (text: string, openIndex: number): number {
	for (let index = text.indexOf(`)`, openIndex); index !== -1; index = text.indexOf(`)`, index + 1)) {
		let backslashes = 0

		while (text[index - 1 - backslashes] === `\\`) backslashes += 1

		if (backslashes % 2 === 0) return index
	}

	return -1
}

/**
 * Finds the `)` closing the parentheses `postcss-scss`'s tokenizer takes as one token behind `url`: it counts parentheses alone, through strings, comments, interpolations and escapes.
 * @param text - The text holding the address.
 * @param openIndex - Behind the `(`.
 * @returns The `)` at which the count returns to zero, or -1 where it never does.
 */
function scssTokenClosingIndex (text: string, openIndex: number): number {
	let depth = 1

	for (let index = openIndex; index < text.length; index += 1) {
		if (text[index] === `(`) depth += 1
		else if (text[index] === `)`) depth -= 1

		if (depth === 0) return index
	}

	return -1
}

/**
 * Skips a Sass interpolation as `postcss-scss`'s tokenizer reads one: a string inside it, with its escapes, and a nested interpolation are its text.
 * @param text - The text holding the interpolation.
 * @param openIndex - The `#`.
 * @returns Behind its closing brace, or the text's length where nothing closes it.
 */
function skipScssInterpolation (text: string, openIndex: number): number {
	let depth = 1
	let index = openIndex + 2

	while (index < text.length) {
		let character = text[index]

		if (character === `"` || character === `'`) {
			index = skipString(text, index)

			continue
		}

		if (character === `}`) {
			depth -= 1

			if (depth === 0) return index + 1
		}
		else if (character === `#` && text[index + 1] === `{`) {
			depth += 1
		}

		index += 1
	}

	return text.length
}

/**
 * Skips a string as `postcss-scss`'s tokenizer reads one: an escaped quotation mark closes nothing, and an interpolation inside it is its text, strings of its own included.
 * @param text - The text holding the string.
 * @param openIndex - The opening quote.
 * @returns Behind the closing quote, or one past the text's end where no quote closes it.
 */
function skipScssString (text: string, openIndex: number): number {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) {
		if (text[index] === `\\`) index += 2
		else if (text[index] === `#` && text[index + 1] === `{`) index = skipScssInterpolation(text, index)
		else index += 1
	}

	return index + 1
}

/** A span of the text by where it opens and where it closes. */
type Span = [start: number, end: number]

/** What a text is to the parser and to the rules reading its commas and colons, by the node it is read from: a custom property's value holds braces as brackets and no colon it refuses, and an at-rule's params hold colons no parser asks about, which the media feature rules read. */
type TextPlace = `custom property` | `declaration` | `params` | `selector`

/**
 * Names what a node's text is to the parser and the rules.
 * @param node - The node the text is read from.
 * @returns The place.
 */
function placeOf (node: AtRule | Declaration | Rule): TextPlace {
	if (node.type === `atrule`) return `params`

	if (node.type === `rule`) return `selector`

	return isCustomProperty(node.prop) ? `custom property` : `declaration`
}

/** What a `(` the parser reads as code opens to the rules that pass over a call's arguments, `style-search` behind an ASCII letter and `findFunctionArgumentSpans` behind a name: a `call`, parentheses no name opens, `bare`, or, outside params, `unknown` where the two read it apart ({@link openingOf}). */
type Opening = `bare` | `call` | `unknown`

/** A cut of the text ({@link ParseReading}). */
type Cut = {

	/** Whether a call the rules skip the arguments of stands around it: `inside` where one does, `outside` where every parenthesis around it opens none, `unknown` where the rules read one of them apart. */
	call: `inside` | `outside` | `unknown`,

	/** The character. */
	character: string,

	/** The count of groups the parser holds open around it. */
	groups: number,

	/** Its index. */
	index: number,

	/** Whether the count of `(` and `)` tokens the parser keeps for its colon stands at zero there. */
	top: boolean,
}

/** What the tokenizer and the parser make of a text, as far as the nodes built out of it go. */
type ParseReading = {

	/** The semicolons and braces outside every group, which end a declaration, open a block or close one; every comma, which tells the plugin's comma rules whose list it is an item of; the colons where the count of `(` and `)` tokens stands at zero, which the value of a declaration other than a custom property refuses as a missed semicolon, and in an at-rule's params every colon, which the media feature rules read outside a call's arguments. */
	cuts: Cut[],

	/** Something the parser is left holding at the end: a `group`, which an at-rule's params take the rest of the file into, or a `token` nothing closes — a string, a comment or an address. PostCSS's tokenizer refuses the file over such a token; `postcss-scss`'s reads a `//` comment or an address to the end of the text without complaint and refuses an interpolation nothing closes, which the walk reads to the end as closed, so under it a `token` is only a text the walk does not model. */
	open: `group` | `token` | undefined,

	/** The strings and comments. */
	spans: Span[],

	/** The parentheses the tokenizer takes as one token, an address's or a plain one, whose text the parser reads nothing of. */
	tokens: Span[],
}

/** Where a walk over the text stands: the tokenizer's stack of words and how far its run of parentheses read as code reaches, the groups the parser holds open and the count of `(` and `)` tokens, and what has been read. */
type ParseWalk = {

	/** What every `(` read as code opens to the rules ({@link Opening}), paired with a `)` as the rules pair them, the innermost last. */
	calls: Opening[],

	/** The closer of every group the parser holds open, the innermost last. */
	closers: string[],

	/** How far PostCSS's run of parentheses read as code reaches ({@link readPoppedParentheses}). */
	codeEnd: number,

	/** The count of `(` and `)` tokens the parser keeps for its colon, which a stray `)` takes down too. */
	parentheses: number,

	/** What the text is to the parser and the rules. */
	place: TextPlace,

	/** What has been read. */
	read: ParseReading,

	/** The tokenizer's stack of words, each with where it ends. */
	stack: { end: number, text: string }[],
}

/**
 * Reads what a `(` the parser reads as code opens to the rules that skip a call's arguments, over the copy they search, where an escape is written as letters.
 *
 * `findFunctionArgumentSpans` opens a call behind a run of identifier characters that is no number, no lone hyphen and, as the media rules filter it, no media query combinator, or behind a `%` no run closes on; `style-search` opens one behind an ASCII letter. In params the media rules read the first alone, so its answer is the opening; elsewhere the list rules read the second, and a `(` the two read apart is `unknown`. Where neither reads a call, the `(` is `bare`.
 * @param text - The text read.
 * @param openIndex - The `(`.
 * @param place - What the text is to the parser and the rules.
 * @returns The opening.
 */
function openingOf (text: string, openIndex: number, place: TextPlace): Opening {
	let behind = text.slice(0, openIndex)
	let name = behind.match(TRAILING_IDENTIFIER_RUN)?.[0] ?? ``
	let inFront = behind.slice(0, behind.length - name.length)
	// An escape the run opens on, or one closing right in front of it, is letters of the copy that lengthen the name
	let escapeLengthens = ENDS_WITH_ESCAPE.test(inFront) || (inFront.match(TRAILING_BACKSLASHES)?.[0].length ?? 0) % 2 === 1
	let percentNames = name === `` && behind.endsWith(`%`) && !IDENTIFIER_CODE_POINT.test(behind.at(-2) ?? ``) && !ENDS_WITH_ESCAPE.test(behind.slice(0, -1))
	let runNames = name !== `` && !OPENS_NO_IDENTIFIER.test(name) && !(place === `params` && MEDIA_QUERY_COMBINATORS.has(name.toLowerCase()))
	let spansArguments = escapeLengthens || percentNames || runNames

	if (place === `params`) return spansArguments ? `call` : `bare`

	let lettered = ENDS_WITH_ASCII_LETTER.test(behind) || ENDS_WITH_ESCAPE.test(behind)

	if (spansArguments !== lettered) return `unknown`

	return spansArguments ? `call` : `bare`
}

/**
 * Reads a parenthesis or a square bracket: the parentheses the tokenizer hands over as code are a group the parser closes at their own `)`, and a `[` opens one it closes at a `]`; the parentheses it hands over as one token, an address's or a plain one, are opaque, and what they hold opens nothing. The parser counts every `(` and `)` token for its colon, a stray `)` too, and the rules pair a `)` with the last `(` they hold open, a square bracket or none between.
 * @param text - The text read.
 * @param index - The character.
 * @param walk - Where the walk stands, which the reading moves on.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @returns Behind what was read, or -1 where no `)` closes a token the tokenizer opened.
 */
function readBracket (text: string, index: number, walk: ParseWalk, reading: Pick<CommentReading, `tokenizes`>): number {
	let character = text.charAt(index)

	if (character === `(`) {
		let pair = readPoppedParentheses(text, index, walk.stack.pop()?.text, reading, walk.codeEnd)

		if (!pair) return -1

		// The walk steps inside only where the tokenizer read the parentheses as code, which is where the parser takes them for a group
		if (pair.index === index + 1) {
			walk.closers.push(`)`)
			walk.calls.push(openingOf(text, index, walk.place))
			walk.parentheses += 1
		}
		else walk.read.tokens.push([index, pair.index])

		walk.codeEnd = pair.codeEnd

		return pair.index
	}

	if (character === `[`) walk.closers.push(`]`)
	else if (walk.closers.at(-1) === character) walk.closers.pop()

	if (character === `)`) {
		walk.parentheses -= 1
		walk.calls.pop()
	}

	return index + 1
}

/**
 * Builds a cut where the walk stands.
 * @param character - The character.
 * @param index - Its index.
 * @param walk - Where the walk stands.
 * @returns The cut.
 */
function cutAt (character: string, index: number, walk: ParseWalk): Cut {
	let call: Cut[`call`] = walk.calls.includes(`call`) ? `inside` : (walk.calls.every((opening) => opening === `bare`) ? `outside` : `unknown`)

	return { call, character, groups: walk.closers.length, index, top: walk.parentheses === 0 }
}

/**
 * Reads a character the tokenizer reads as a token of its own that is no parenthesis or square bracket: a brace, which opens or closes a group in a custom property's value and cuts the text outside every group, a semicolon cutting it there too, a colon and a comma.
 * @param character - The character.
 * @param index - Its index.
 * @param walk - Where the walk stands, which the reading moves on.
 * @param place - What the text is to the parser and the rules.
 */
function readDelimiter (character: string, index: number, walk: ParseWalk, place: TextPlace): void {
	if (character === `{` && place === `custom property`) walk.closers.push(`}`)
	else if (character === `}` && walk.closers.at(-1) === `}`) walk.closers.pop()
	else if (SEMICOLON_OR_BRACE.test(character) && walk.closers.length === 0) walk.read.cuts.push(cutAt(character, index, walk))

	// The parser refuses a colon in the value of a declaration other than a custom property alone, and the media feature rules read one in params
	if (character === `:` && (place === `params` || (place !== `custom property` && walk.parentheses === 0))) walk.read.cuts.push(cutAt(character, index, walk))

	// A comma `postcss-scss`'s tokenizer reads as a token of its own
	if (character === `,`) walk.read.cuts.push(cutAt(character, index, walk))
}

/**
 * Walks a text as the tokenizer does and reads what the parser builds its nodes by ({@link ParseReading}).
 *
 * A brace opens a group in a custom property's value alone, where the parser reads braces as brackets; elsewhere the walk opens none on a brace and reads one as a cut only outside every group, which is where the parser reads one in params too, a brace inside a group there being text of the params either way.
 * @param text - The text read.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @param place - What the text is to the parser and the rules.
 * @returns What the walk read up to where it stopped.
 */
function readTheParse (text: string, reading: Pick<CommentReading, `tokenizes`>, place: TextPlace): ParseReading {
	let walk: ParseWalk = { calls: [], closers: [], codeEnd: -1, parentheses: 0, place, read: { cuts: [], open: undefined, spans: [], tokens: [] }, stack: [] }
	let { read } = walk
	let index = 0

	while (index < text.length) {
		let character = text.charAt(index)

		if (PARENTHESIS_OR_SQUARE_BRACKET.test(character)) {
			index = readBracket(text, index, walk, reading)

			if (index === -1) return { ...read, open: `token` }

			continue
		}

		readDelimiter(character, index, walk, place)

		let step = wordlessTokenEnd(text, index, reading)

		// A comment nothing closes, or a string nothing closes, which `skipString` walks one past the end of
		if (step === -1 || (step !== undefined && step > text.length)) return { ...read, open: `token` }

		if (step === undefined) {
			let end = wordEnd(text, index, reading)
			let word = text.slice(index, end)

			// PostCSS's tokenizer reads a comma into the word around it
			for (let comma of word.matchAll(EVERY_COMMA)) read.cuts.push(cutAt(`,`, index + comma.index, walk))

			walk.stack.push({ end, text: word })
			index = end

			continue
		}

		if (QUOTE_OR_SOLIDUS.test(character)) read.spans.push([index, step])

		index = step
	}

	return { ...read, open: walk.closers.length > 0 ? `group` : undefined }
}

/**
 * Moves an index of the text edits apply to into the text they leave, or an index of the text they leave back.
 * @param edits - The edits, indexed in the text they apply to.
 * @param isBackward - Whether the index is one of the text they leave.
 * @returns The mover. An index inside a replaced span shifts by what the edits in front of that span shift, so inside a deletion longer than one character it lands on the text behind the span; that costs nothing while the edits replace whitespace alone.
 */
function indexMover (edits: Edit[], isBackward: boolean): (index: number) => number {
	let steps: { boundary: number, shift: number }[] = []
	let offset = 0

	for (let { start, end, text } of edits.toSorted((a, b) => a.start - b.start)) {
		let shift = text.length - (end - start)

		steps.push(isBackward ? { boundary: start + offset + text.length, shift: -shift } : { boundary: end, shift })
		offset += shift
	}

	return (index) => {
		let moved = index

		for (let { boundary, shift } of steps) if (index >= boundary) moved += shift

		return moved
	}
}

/**
 * Asks whether a string or a comment one reading holds is lost to the other: it stands there neither at the same place nor inside parentheses the other takes as one token in front of the `)` closing them, where the token swallows it whole. One holding that `)` is lost, since the token then closes inside it, and a comment the parser read is taken into an address.
 * @param spans - The strings and comments of the one reading.
 * @param other - The other reading.
 * @param move - Moves an index of the one reading's text into the other's ({@link indexMover}).
 * @returns True where one of them is lost.
 */
function losesASpan (spans: Span[], other: ParseReading, move: (index: number) => number): boolean {
	return spans.some(([start, end]) => {
		let [movedStart, movedEnd] = [move(start), move(end)]

		return !other.spans.some(([otherStart, otherEnd]) => otherStart === movedStart && otherEnd === movedEnd) && !other.tokens.some(([tokenStart, tokenEnd]) => tokenStart < movedStart && movedEnd < tokenEnd)
	})
}

/**
 * Leaves out of a reading's cuts every comma the other reading takes into a token, which no comma rule reads as an item of a list there, while the one reading holds it inside a group the rules read as a call's, and every colon of params the other reading takes into a token where the one holds it inside parentheses.
 * @param read - The one reading.
 * @param other - The other reading.
 * @param move - Moves an index of the one reading's text into the other's ({@link indexMover}).
 * @returns The cuts left.
 */
function cutsOutsideTokens (read: ParseReading, other: ParseReading, move: (index: number) => number): ParseReading[`cuts`] {
	return read.cuts.filter(({ character, index, top }) => {
		let moved = move(index)

		return !(character === `,` || (character === `:` && !top)) || !other.tokens.some(([tokenStart, tokenEnd]) => tokenStart < moved && moved < tokenEnd)
	})
}

/**
 * Asks whether two readings read one cut alike. A semicolon and a brace are the parser's, read alike wherever both readings hold them.
 *
 * A comma and a colon of params are the media rules', which read one outside a call's arguments alone, so they are read alike where both readings stand them inside a call or both outside every one; under `postcss-scss` a comma is read alike where the count of groups around it holds and a colon where the count of parentheses in front of it holds. A comma elsewhere is read alike where the count of groups holds, or where a call stands around it in both readings and `postcss-value-parser`, which the call comma rules read by, reads the same calls in both: no list rule reads it then, whereas `style-search`, which the value and selector list rules read by, holds a call's arguments open to the end of the outermost parentheses around it, so parentheses no name opens tell nothing.
 * @param one - The cut of the one reading.
 * @param other - The cut of the other.
 * @param place - What the text is to the parser and the rules.
 * @param callsHold - Whether `postcss-value-parser` reads the same calls in both texts.
 * @param tokenizes - Whether the parser reads by a tokenizer of its own, `postcss-scss`'s, whose address token the media rules' copy reads apart from the walk.
 * @returns True where the two read it alike.
 */
function readsTheCutAlike (one: Cut, other: Cut, place: TextPlace, callsHold: boolean, tokenizes: boolean): boolean {
	if (place === `params` && !tokenizes && (one.character === `,` || one.character === `:`)) return one.call === other.call

	if (one.character === `,`) return one.groups === other.groups || (callsHold && one.call === `inside` && other.call === `inside`)

	return one.character !== `:` || one.top === other.top
}

/**
 * Asks whether the parser builds other nodes out of the text edits leave than out of the text they apply to ({@link readTheParse}): where the written text leaves the tokenizer refusing the file, the parser holding a group open where it held none or the other way round, a cut at another place, or a string or a comment lost ({@link losesASpan}).
 *
 * A string or a comment one reading takes whole into a token in front of its `)` costs nothing: the raw reads back the same, and so does every cut, while `decl.value` may drop a comment the one reading holds as code.
 *
 * A comma the write moves out of the group code holds it in is a cut too: the parser builds the same nodes, but the plugin's comma rules then read it as an item of the list around the address, and a second `--fix` writes behind it; a comma one reading takes into a token is read by no rule there and is left out ({@link cutsOutsideTokens}), and one the rules read alike under both is no parting ({@link readsTheCutAlike}). The cut is counted for every writer, since what reads the comma otherwise is the next run of the comma rules, whichever rule wrote the run in front of the name.
 * @param text - The text the edits apply to.
 * @param edited - The text they leave.
 * @param edits - The edits, indexed in the first text.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @param place - What the text is to the parser and the rules.
 * @param callsHold - Whether `postcss-value-parser` reads the same calls in both texts.
 * @returns True where the two parses part.
 */
function parsesPart (text: string, edited: string, edits: Edit[], reading: Pick<CommentReading, `tokenizes`>, place: TextPlace, callsHold: boolean): boolean {
	let standing = readTheParse(text, reading, place)
	let rewritten = readTheParse(edited, reading, place)
	let [forward, backward] = [indexMover(edits, false), indexMover(edits, true)]

	// A text PostCSS's tokenizer refuses either way is refused whatever is written; under `postcss-scss`'s such a text is one the walk does not model, and the write is refused
	if (standing.open === `token` && rewritten.open === `token`) return reading.tokenizes

	if (standing.open !== rewritten.open) return true

	let standingCuts = cutsOutsideTokens(standing, rewritten, forward)
	let rewrittenCuts = cutsOutsideTokens(rewritten, standing, backward)

	if (standingCuts.length !== rewrittenCuts.length || standingCuts.some((cut, cutIndex) => {
		let other = rewrittenCuts[cutIndex]

		return other === undefined || other.character !== cut.character || other.index !== forward(cut.index) || !readsTheCutAlike(cut, other, place, callsHold, reading.tokenizes)
	})) return true

	return losesASpan(standing.spans, rewritten, forward) || losesASpan(rewritten.spans, standing, backward)
}

/**
 * Asks whether an edit makes the tokenizer read the parentheses of a `url(` right behind it the other way, where the parser then builds other nodes.
 *
 * PostCSS's tokenizer, which `postcss-less` reads by too, takes the parentheses as one token where the word it pops at the `(` is `url` itself ({@link openingParenthesisBehind}), and as code where that word is longer; `1,url(` and `1/url(` are one word to it, so filling or emptying the run in front of the name switches the reading. A quotation mark or whitespace right behind the `(` makes the parentheses code under both words.
 *
 * `postcss-scss`'s tokenizer ends a word on a comma outside an at-word, so such a comma's run switches nothing under it, and a comma, an interpolation or a `//` comment between the name and the `(` pushes no word under it either. Its token opens behind whitespace too, a quotation mark right behind the `(` alone keeping the parentheses code, and closes by the count of parentheses.
 *
 * Where the reading switches, both texts are walked whole ({@link parsesPart}), and the edit is refused only where the output reads otherwise: it stops parsing, a group is left open or closed, a `)` closing the token in front of the one code closes the parentheses at lets a `;` or a brace out of the group code holds it in, or a colon or a comma the parser or the rules then read otherwise ({@link readsTheCutAlike}), or a string or a comment is lost ({@link losesASpan}). A group code reads inside the parentheses costs nothing by itself, since the parser passes over the `)` the token leaves unpaired.
 * @param text - The text the edit applies to.
 * @param edit - The edit, indexed in that text.
 * @param edit.start - Where the span it replaces opens.
 * @param edit.end - Where that span closes.
 * @param edit.text - What it writes there.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @param node - The node the text is read from, which says what the parser and the rules read in it.
 * @returns True where the edit switches the reading of parentheses and the parser builds other nodes out of the output.
 */
export function rereadsAnAddress (text: string, { start, end, text: written }: Edit, reading: Pick<CommentReading, `tokenizes`>, node: AtRule | Declaration | Rule): boolean {
	if (!text.startsWith(`url`, end)) return false

	let edited = text.slice(0, start) + written + text.slice(end)
	let editedEnd = start + written.length
	let openIndex = openingParenthesisBehind(text, end + 3, reading)
	let editedOpenIndex = openingParenthesisBehind(edited, editedEnd + 3, reading)

	// The name is the last word at the `(` under a spelling where nothing joins it and no plain token in front holds it, and a break written into such a token breaks it
	let isLastWord = openIndex !== -1 && !joinsTheName(text.slice(0, end), reading)
	let editedIsLastWord = editedOpenIndex !== -1 && !joinsTheName(edited.slice(0, editedEnd), reading)

	if (isLastWord === editedIsLastWord) return false

	if (openIndex === -1) openIndex = editedOpenIndex - (editedEnd - end)

	if (reading.tokenizes) {
		if (text[openIndex] === `"` || text[openIndex] === `'`) return false

		// The parentheses the tokenizer reads as one plain token under either word, since nothing inside them opens a string, a comment, an escape or a group
		if (!PARENTHESES_READ_AS_CODE.test(text.slice(openIndex, text.indexOf(`)`, openIndex) + 1))) return false
	}
	else if (OPENS_WITH_QUOTE_OR_CSS_WHITESPACE.test(text.slice(openIndex))) return false

	// `postcss-value-parser` keeps a sign such as `!` in the word in front of the `(`, where a name so lengthened opens a call of its own rather than the address
	let callsHold = VALUE_PARSER_WORD_END.test(text[end - 1] ?? ` `) && VALUE_PARSER_WORD_END.test(edited[editedEnd - 1] ?? ` `)

	return parsesPart(text, edited, [{ end, start, text: written }], reading, placeOf(node), callsHold)
}

/**
 * Asks whether the edits of a fix make the tokenizer read the parentheses of a call the other way, where the two readings part.
 *
 * The parentheses a `(` pops `url` at are one token, and what stands right behind that `(` is what keeps them code instead ({@link keepsParenthesesCode}), so the run written there is the one that can switch the reading and the run in front of the `)` is not. The call is the parser's rather than the compilers': `\61 url(` and `x\9 url(` name one call, `aurl` and `xurl`, to Sass and to `lightningcss`, and the value-parser rules read them as one ({@link opensAnAddress}), while the tokenizer sees the three characters `url` right against the `(` and takes the parentheses for an address's.
 *
 * Where the reading switches, both texts are walked whole ({@link parsesPart}), as {@link rereadsAnAddress} walks them, and the edits are refused where the model of cuts reads the output otherwise: a `)` closing the token in front of the one code closes the parentheses at lets a `;` or a brace out of the group code holds it in, or a colon or a comma the parser or the rules then read otherwise ({@link readsTheCutAlike}), a group or a token is left open or closed, or a string or a comment is lost. Otherwise the two readings part only in how far the call reaches, which changes no text the parser reads back.
 * @param text - The text the edits apply to.
 * @param openIndex - The call's `(`.
 * @param edits - The edits the fix writes inside those parentheses, indexed in that text.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @param node - The node the text is read from, which says what the parser and the rules read in it.
 * @returns True where the edits switch the reading of the parentheses and the parser builds other nodes out of the output.
 */
export function editsRereadAnAddress (text: string, openIndex: number, edits: Edit[], reading: Pick<CommentReading, `tokenizes`>, node: AtRule | Declaration | Rule): boolean {
	if (!popsTheAddressName(text, openIndex, reading)) return false

	let edited = applyEditsFromEnd(text, edits)

	if (keepsParenthesesCode(text, openIndex, reading) === keepsParenthesesCode(edited, openIndex, reading)) return false

	// The run behind the `(` of an address is whitespace `postcss-value-parser` leaves out of the address whatever it holds
	return parsesPart(text, edited, edits, reading, placeOf(node), true)
}
