import type { Document, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import { isSyntax } from "../../utils/typeGuards/index.ts"
import { isInlineComment } from "../isInlineComment/index.ts"

/** What a syntax makes of a `//` comment: whether it spells one, whether it keeps one in the value a rule reads, and whether it answered for itself rather than getting the default, which reads a comment as a comment; a gate refusing a file on the syntax's own account must not refuse one on the default. Which break closes a comment is PostCSS's question. */
export type InlineCommentReading = {
	spells: boolean,
	keeps: boolean,
	answered: boolean,
}

/** The reading of {@link probeSyntax}, per syntax. */
let inlineCommentSyntaxes: WeakMap<object, InlineCommentReading> = new WeakMap()

/** A stylesheet with an inline comment in both places the answers turn on. */
const INLINE_COMMENT_PROBE = `a {}\n// comment\na { b: 'x', // comment\n  'y'; }\n`

/**
 * Parses the probe with a syntax and reads the answers off the tree.
 * @param syntax - What parsed the file: a syntax object, or nothing for plain CSS.
 * @returns What it made of the probe.
 */
function probeSyntax (syntax?: unknown): InlineCommentReading {
	// No syntax is plain CSS, which spells no `//` comment
	if (!syntax) return { spells: false, keeps: false, answered: true }

	// A syntax that cannot be asked says nothing
	if (!isSyntax(syntax)) return { spells: true, keeps: false, answered: false }

	let known = inlineCommentSyntaxes.get(syntax)

	if (known !== undefined) return known

	// The default: nothing said, and a comment read as a comment
	let reading: InlineCommentReading = { spells: true, keeps: false, answered: false }

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
	let reading = probeSyntax(syntax)

	return reading.answered && reading.spells && !reading.keeps
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
