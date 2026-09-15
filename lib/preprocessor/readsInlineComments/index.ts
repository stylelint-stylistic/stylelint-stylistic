import type { Document, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import type { CommentReading } from "../../utils/findCommentSpans/index.ts"
import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import { isSyntax } from "../../utils/typeGuards/index.ts"
import { isInlineComment } from "../isInlineComment/index.ts"

/** What a syntax makes of a `//` comment: whether it spells one, whether it keeps one in the value a rule reads, whether its own tokenizer reads one, whether a form feed closes one, and whether it answered for itself rather than getting the default, which reads a comment as a comment; a gate refusing a file on the syntax's own account must not refuse one on the default. */
export type InlineCommentReading = CommentReading & {
	keeps: boolean,
	answered: boolean,
}

/** The reading of {@link probeSyntax}, per syntax. */
let inlineCommentSyntaxes: WeakMap<object, InlineCommentReading> = new WeakMap()

/** A stylesheet with an inline comment in both places the answers turn on. */
const INLINE_COMMENT_PROBE = `a {}\n// comment\na { b: 'x', // comment\n  'y'; }\n`

/** A stylesheet with a form feed in the middle of an inline comment and a rule of its own written behind it. A syntax closing a comment on the character has two rules here; one reading it as the comment's text has one, and the second is that comment's text ([#333](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/333)). */
const FORM_FEED_PROBE = `a {}\n// c\fb {}\n`

/**
 * Asks a syntax whether a form feed closes a `//` comment in it, by handing it one such comment with a rule behind the character.
 *
 * It is the one break the two languages disagree about: `postcss-scss` reads a line in it, as dart-sass does, while Less normalises `\r\n?` to `\n` before parsing and reads no line in the character at all, so `postcss-less` keeps it as the comment's text. A syntax that makes nothing of this stylesheet is answered no, which is the reading every syntax got before they were told apart; so is one that made nothing of the first probe, whose answer about a form feed would be the only thing it had said.
 * @param syntax - What parsed the file.
 * @returns True where a form feed closes such a comment.
 */
function probeFormFeed (syntax: { parse: (css: string, opts: { from: undefined }) => Document | Root }): boolean {
	try {
		let probe = syntax.parse(FORM_FEED_PROBE, { from: undefined })
		let endsOnFormFeed = false

		probe.walk((node) => {
			// The rule behind the form feed came back a rule, which the syntax can only have done by closing the comment on that character
			if (node.type === `rule` && node.selector === `b`) endsOnFormFeed = true
		})

		return endsOnFormFeed
	}
	catch {
		// A syntax that cannot parse this stylesheet has said nothing about the character
		return false
	}
}

/**
 * Parses the probes with a syntax and reads the answers off the trees.
 *
 * The form feed is handed over in a stylesheet of its own under a `try` of its own, so a syntax stumbling over the character says nothing about it rather than unsaying the answers the first probe has already given.
 * @param syntax - What parsed the file: a syntax object, or nothing for plain CSS.
 * @returns What it made of the probes.
 */
function probeSyntax (syntax?: unknown): InlineCommentReading {
	// No syntax is plain CSS, which spells no `//` comment, so no break closes one
	if (!syntax) return { spells: false, keeps: false, answered: true, tokenizes: false, endsOnFormFeed: false }

	// A syntax that cannot be asked says nothing
	if (!isSyntax(syntax)) return { spells: true, keeps: false, answered: false, tokenizes: false, endsOnFormFeed: false }

	let known = inlineCommentSyntaxes.get(syntax)

	if (known !== undefined) return known

	// The default: nothing said, and a comment read as a comment
	let reading: InlineCommentReading = { spells: true, keeps: false, answered: false, tokenizes: false, endsOnFormFeed: false }

	try {
		let probe: Root | Document = syntax.parse(INLINE_COMMENT_PROBE, { from: undefined })
		let readsTheProbe = false

		probe.walk((node) => {
			if (node.type === `rule` || node.type === `decl`) readsTheProbe = true
		})

		if (readsTheProbe) {
			reading.answered = true
			reading.spells = false

			probe.walkComments((comment) => {
				if (isInlineComment(comment)) reading.spells = true
			})
		}
		// `keeps` turns on a `//` surviving in the raw, the copy a rule reads
		probe.walkDecls((decl) => {
			let raws = decl.raws

			if (((raws.value && raws.value.raw) || decl.value).includes(`//`)) reading.keeps = true
		})
	}
	catch {
		// A syntax that cannot parse the probe has said nothing
	}

	reading.tokenizes = reading.answered && reading.spells && !reading.keeps
	reading.endsOnFormFeed = reading.answered && reading.spells && probeFormFeed(syntax)

	inlineCommentSyntaxes.set(syntax, reading)

	return reading
}

/**
 * Asks whether a `//` in a node's text opens a comment.
 *
 * The text cannot answer: in plain CSS a `//` is code, most often an address such as `myurl(//a)`, and reading it as a comment silences the rest of the line. The probe is parsed once per syntax object. A caller in front of a fix asks {@link inlineCommentReading} for the whole reading.
 * @param node - The node whose syntax is asked.
 * @param result - The Stylelint result naming the syntax where the root does not.
 * @returns True where it does.
 */
export function readsInlineComments (node: Node, result: PostcssResult): boolean {
	return syntaxSpellsInlineComments(nodeSyntax(node, result))
}

/**
 * What the syntax that parsed a node makes of a `//` comment.
 * @param node - The node whose syntax is asked.
 * @param result - The Stylelint result naming the syntax where the root does not.
 * @returns The reading.
 */
export function inlineCommentReading (node: Node, result: PostcssResult): InlineCommentReading {
	return probeSyntax(nodeSyntax(node, result))
}

/**
 * Asks whether `//` opens a comment in a syntax, by parsing a probe with it; naming the syntaxes would miss every custom one. A syntax that makes nothing of the probe is answered `true`, or a fix could write the rest of a line into a comment.
 * @param syntax - The syntax to probe, or nothing for plain CSS.
 * @returns True where it does.
 */
export function syntaxSpellsInlineComments (syntax?: unknown): boolean {
	return probeSyntax(syntax).spells
}

/**
 * Asks whether the syntax's own tokenizer reads an inline comment, which only `postcss-scss` does. A syntax that said nothing is answered no: reading a construct the file's parser never saw is worse than missing one it did.
 * @param syntax - The syntax to probe, or nothing for plain CSS.
 * @returns True where it does.
 */
export function syntaxTokenizesInlineComments (syntax?: unknown): boolean {
	return probeSyntax(syntax).tokenizes
}

/**
 * Asks whether a `//` left standing in a value is a comment; a syntax that rewrites inline comments into block ones leaves none there, so a surviving `//` is part of an address.
 * @param syntax - The syntax to probe, or nothing for plain CSS.
 * @returns True where it does.
 */
export function syntaxKeepsInlineComments (syntax?: unknown): boolean {
	let reading = probeSyntax(syntax)

	return reading.spells && reading.keeps
}
