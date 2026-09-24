import { type AnyNode, Input, type Node, type Root, type Stringifier, stringify as postcssStringify } from "postcss"
import postcssTokenize, { type Tokenizer } from "postcss/lib/tokenize"

import type { AddressSpan } from "../../utils/findCommentSpans/index.ts"
import { isRoot } from "../../utils/typeGuards/index.ts"
import { isObject } from "../../utils/validateTypes/index.ts"
import { syntaxTokenizesInlineComments } from "../readsInlineComments/index.ts"
import { scssTokenize } from "../scssTokenize/index.ts"

/** A quotation mark, which only an address's parentheses carry inside a `brackets` token. */
const QUOTATION_MARK = /['"]/u

/** A `(` behind another character, which only an address's parentheses carry inside a `brackets` token. */
const INNER_OPENING_PARENTHESIS = /.\(/u

/** A word the tokenizer pushed, over the one it pushed in front of it: the stack it pops one of at each `(`, kept as a list so that a node's snapshot of it is a single reference. */
type StackedWord = {
	under: StackedWord | undefined,
	word: string,
}

/** What one reading of a root holds: the text it printed as, where each of its nodes opens in that text, and the stack the tokenizer held there. */
type RootReading = {
	stacks: Map<Node, StackedWord | undefined>,
	starts: Map<Node, number>,
	text: string,
}

/** The reading kept per root, so that a file whose at-rules all ask this is read once. */
let readingsByRoot: WeakMap<Root, RootReading> = new WeakMap()

/**
 * Reads a tokenizer out, token by token.
 * @param tokenizer - At the opening of the text.
 * @returns Every token it read.
 */
function tokensOf (tokenizer: Tokenizer): [string, string, number?][] {
	let tokens: [string, string, number?][] = []

	while (!tokenizer.endOfFile()) tokens.push(tokenizer.nextToken({ ignoreUnclosed: true }))

	return tokens
}

/**
 * Reads a text with the tokenizer the syntax's parser reads by: `postcss-scss`'s for SCSS, PostCSS's for CSS and Less. `postcss-scss` throws over an open string or interpolation, which is a text its parser refuses as well, and PostCSS's answers for that one; where the optional package cannot be reached nothing answers, since PostCSS's tokenizer opens no token behind whitespace of the parenthesis and closes one at the first `)` where that one counts parentheses.
 * @param text - The text read.
 * @param [syntax] - The syntax, as `nodeSyntax` gives it.
 * @param [from] - The stylesheet's file.
 * @returns The tokens, or nothing where the parser's own tokenizer is out of reach.
 */
function tokensRead (text: string, syntax?: unknown, from?: string): [string, string, number?][] | undefined {
	if (syntaxTokenizesInlineComments(syntax)) {
		let tokenize = scssTokenize(from)

		if (!tokenize) return undefined

		try {
			return tokensOf(tokenize(new Input(text), { ignoreErrors: true }))
		}
		catch {
			// PostCSS's tokenizer answers instead
		}
	}

	return tokensOf(postcssTokenize(new Input(text), { ignoreErrors: true }))
}

/**
 * Counts the parentheses that popped a word the text read does not hold, which the tokenizer takes off the stack it keeps through the whole file while a text read on its own opens with an empty one.
 * @param tokens - The tokens of the text read.
 * @returns How many words the text owes the stack in front of it.
 */
function popsPastTheStart (tokens: [string, string, number?][]): number {
	let held = 0
	let pops = 0

	for (let [name] of tokens) {
		if (name === `word`) held += 1
		else if (name === `(` || name === `brackets`) {
			if (held === 0) pops += 1
			else held -= 1
		}
	}

	return pops
}

/**
 * Returns the root of the node's own block: a `Document` holds a root per embedded stylesheet, each parsed on its own, so the stack of words opens empty at every one of them.
 * @param node - The node.
 * @returns That root, or nothing where the node stands in none.
 */
function blockRoot (node: Node): Root | undefined {
	let held: Node | undefined = node

	while (held && !isRoot(held)) held = held.parent

	return held
}

/**
 * Prints a root with the stringifier of its syntax, keeping the offset each node opens at.
 * @param root - The root printed.
 * @param [syntax] - The syntax, as `nodeSyntax` gives it.
 * @returns The text and the offset each node opens at in it, the run in front of that node excluded.
 */
function printedRoot (root: Root, syntax?: unknown): { starts: Map<Node, number>, text: string } {
	let starts: Map<Node, number> = new Map()
	let text = ``
	let spelled = isObject(syntax) ? (syntax as { stringify?: Stringifier }).stringify : undefined
	let print: Stringifier = typeof spelled === `function` ? spelled : postcssStringify

	print(root, (part: string, node?: AnyNode, type?: `end` | `start`) => {
		if (node && type !== `end` && !starts.has(node)) starts.set(node, text.length)

		text += part
	})

	return { starts, text }
}

/**
 * Reads the whole root and keeps, for each of its nodes, the stack of words the tokenizer holds where that node opens.
 *
 * The root is printed rather than sliced out of the input: under `postcss-html` and styled the input holds the page while the offsets count the file, and a fix of a rule that ran earlier leaves the source behind.
 * @param root - The root read.
 * @param [syntax] - The syntax, as `nodeSyntax` gives it.
 * @param [from] - The stylesheet's file.
 * @returns What the root said, or nothing where the parser's own tokenizer is out of reach.
 */
function rootRead (root: Root, syntax?: unknown, from?: string): RootReading | undefined {
	let { starts, text } = printedRoot(root, syntax)
	let tokens = tokensRead(text, syntax, from)

	if (!tokens) return undefined

	let marks = [...starts].toSorted(([, one], [, other]) => one - other)
	let stacks: Map<Node, StackedWord | undefined> = new Map()
	let next = 0
	let top: StackedWord | undefined

	for (let [name, content, openIndex] of tokens) {
		// A whitespace run carries no index of its own, and no node opens inside one
		if (openIndex !== undefined) {
			for (let mark = marks[next]; mark && mark[1] <= openIndex; mark = marks[next]) {
				stacks.set(mark[0], top)
				next += 1
			}
		}

		if (name === `word`) top = { under: top, word: content }
		else if (name === `(` || name === `brackets`) top = top?.under
	}

	for (let [held] of marks.slice(next)) stacks.set(held, top)

	return { stacks, starts, text }
}

/**
 * Reads the words the tokenizer carried into a node from the text standing in front of it.
 *
 * One root is read once: a file whose every at-rule asks this would otherwise be read once per at-rule. The reading is kept while the node's own text still stands where it stood in it, and the root is read again where it does not.
 * @param node - The node the text belongs to.
 * @param read - The node's own text, as the caller reads it, which says whether the reading kept for its root still holds.
 * @param limit - How many words are asked for, counted from the top of the stack.
 * @param [syntax] - The syntax, as `nodeSyntax` gives it.
 * @param [from] - The stylesheet's file.
 * @returns The words, in the order the tokenizer pushed them, or nothing where the parser's own tokenizer is out of reach.
 */
function wordsCarriedIn (node: Node, read: string, limit: number, syntax?: unknown, from?: string): string[] | undefined {
	let root = blockRoot(node)

	if (!root) return []

	let reading = readingsByRoot.get(root)
	let start = reading && reading.starts.get(node)

	if (!reading || start === undefined || !reading.text.startsWith(read, start)) {
		reading = rootRead(root, syntax, from)

		if (!reading) return undefined

		readingsByRoot.set(root, reading)
	}

	let words: string[] = []

	for (let stacked = reading.stacks.get(node); stacked && words.length < limit; stacked = stacked.under) words.unshift(stacked.word)

	return words
}

/**
 * Reads a text again with the words the file left on the tokenizer's stack in front of it, as a text of their own.
 *
 * A word the prefix brings closes a token over a `(` the text read held on its own, and opens one where a string had swallowed the rest of the text, so what the text owes is counted again at each round; the prefix grows until the text owes nothing or the stack in front of it runs out.
 * @param read - The text the spans are sought in, with what the node spells in front of it.
 * @param tokens - The tokens of that text read on its own.
 * @param node - The node the text belongs to.
 * @param [syntax] - The syntax, as `nodeSyntax` gives it.
 * @param [from] - The stylesheet's file.
 * @returns The prefix and the tokens of the text read behind it, or nothing where the parser's own tokenizer is out of reach.
 */
function carriedRead (read: string, tokens: [string, string, number?][], node: Node, syntax?: unknown, from?: string): { prefix: string, tokens: [string, string, number?][] } | undefined {
	let carried: string[] = []
	let held = tokens
	let prefix = ``

	for (let owed = popsPastTheStart(held); owed > 0; owed = popsPastTheStart(held)) {
		let words = wordsCarriedIn(node, read, carried.length + owed, syntax, from)

		if (!words) return undefined

		// The stack in front of the text is out, and the parenthesis the file pops there pops nothing either
		if (words.length <= carried.length) break

		carried = words
		// A word holds no character the tokenizer ends one on, so a space between two of them leaves the words themselves as they were
		prefix = `${carried.join(` `)} `

		let carriedTokens = tokensRead(`${prefix}${read}`, syntax, from)

		if (!carriedTokens) return undefined

		held = carriedTokens
	}

	return { prefix, tokens: held }
}

/**
 * Finds the parentheses of the `brackets` tokens holding what a pattern matches, in the coordinates of the text the spans are asked about.
 * @param tokens - The tokens of the text read.
 * @param start - Where the text opens inside what was read.
 * @param holding - What a token must hold to be returned.
 * @returns The spans, in source order.
 */
function spansOf (tokens: [string, string, number?][], start: number, holding: RegExp): AddressSpan[] {
	let spans: AddressSpan[] = []

	for (let [name, content, openIndex] of tokens) {
		if (name !== `brackets` || openIndex === undefined || !holding.test(content)) continue

		let spanStart = openIndex - start
		let end = spanStart + content.length

		if (end > 0) spans.push({ start: Math.max(spanStart, 0), end })
	}

	return spans
}

/**
 * Reads a text with the tokenizer and finds its `brackets` tokens holding what a pattern matches.
 * @param before - Read but not answered for.
 * @param text - The text the spans are sought in.
 * @param holding - What a token must hold, and the text too for the tokenizer to be asked at all.
 * @param [syntax] - The syntax.
 * @param [from] - The stylesheet's file.
 * @param [node] - The node the text belongs to.
 * @returns The spans, or nothing where the tokenizer is out of reach.
 */
function tokenSpans (before: string, text: string, holding: RegExp, syntax?: unknown, from?: string, node?: Node): AddressSpan[] | undefined {
	let read = `${before}${text}`

	if (!holding.test(text) || !read.includes(`(`)) return []

	let tokens = tokensRead(read, syntax, from)

	if (!tokens) return undefined

	let carried = node ? carriedRead(read, tokens, node, syntax, from) : { prefix: ``, tokens }

	if (!carried) return undefined

	return spansOf(carried.tokens, carried.prefix.length + before.length, holding)
}

/**
 * Finds the parentheses the syntax's tokenizer takes as one token behind the word `url`, whose quotation marks are characters of an address and no strings.
 *
 * The tokenizer keeps a stack of the words it reads and pops one at each `(`; the parentheses open a token where the word popped there is `url` itself. Whitespace and a comment push no word, so `url (`, `url\t(`, `url\n(` and `url/*c*\/(` open one as `url(` does, and so does a property named `url` in front of a value opening on a `(`. `postcss-value-parser` opens its own address mode behind a lowercase `url` glued to the `(` alone, and reads a quotation mark in every other spelling as a string; closing such a string leaves a text the parser refuses.
 *
 * Only a token holding a quotation mark is returned, which is the only one this answers for: both tokenizers give a plain pair of parentheses up as `brackets` the moment its content holds a mark, so a `brackets` token carrying one can only be an address's.
 *
 * The text in front is read for the tokenizer's state, which a word of its own carries into the text asked about, and no span is answered for it; a token opening there and reaching into the text is cut at the text's start. A text holding no parenthesis holds no such token and is answered without a tokenizer at all.
 *
 * That stack runs through the whole file, and an at-rule's name pushes no word, so a `(` of its params pops what a node in front left there. Where the text read pops a word it does not hold, the node's own root is read for as many words as it owes and they are put in front as a text of their own, so that the tokenizer opens the text with the stack the file leaves it.
 * @param before - Read but not answered for: the property and what stands between it and the value, or the at-rule's name and what stands behind it.
 * @param text - The value or params the spans are sought in, standing right behind `before`.
 * @param [syntax] - The syntax, as `nodeSyntax` gives it.
 * @param [from] - The stylesheet's file.
 * @param [node] - The node the text belongs to; where none is handed over the text answers for itself.
 * @returns The spans, in the text's coordinates, in source order, or nothing where the text may hold such a token and the parser's own tokenizer is out of reach.
 */
export function addressTokenSpans (before: string, text: string, syntax?: unknown, from?: string, node?: Node): AddressSpan[] | undefined {
	return tokenSpans(before, text, QUOTATION_MARK, syntax, from, node)
}

/**
 * Finds the parentheses the syntax's tokenizer takes as one token behind the word `url` where they hold a `(` past the opening one, which is a character of the address and opens no call: PostCSS's tokenizer closes the token on the first `)` no backslash escapes, `postcss-scss`'s at the count of parentheses. Both tokenizers give a plain pair of parentheses up as `brackets` only where no `(` stands inside, so such a token can only be an address's. The rest reads as {@link addressTokenSpans} does.
 * @param before - Read but not answered for.
 * @param text - The text the spans are sought in, standing right behind `before`.
 * @param [syntax] - The syntax, as `nodeSyntax` gives it.
 * @param [from] - The stylesheet's file.
 * @param [node] - The node the text belongs to.
 * @returns The spans, in the text's coordinates, in source order, or nothing where the parser's own tokenizer is out of reach.
 */
export function parenthesizedAddressTokenSpans (before: string, text: string, syntax?: unknown, from?: string, node?: Node): AddressSpan[] | undefined {
	return tokenSpans(before, text, INNER_OPENING_PARENTHESIS, syntax, from, node)
}
