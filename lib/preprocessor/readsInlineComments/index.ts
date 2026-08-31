import type { Document, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import { isSyntax } from "../../utils/typeGuards/index.ts"

/** What the probe of a syntax says about a comment opened by a double slash: whether the syntax spells one at all, whether it leaves one standing in the value a rule reads, and whether those two answers are the syntax's own. A syntax that read the probe as the stylesheet it is has answered for itself; one that threw, read nothing out of it, or could not be asked at all is given the default that reads a comment as a comment, and `answered` says which of the two a caller is holding — a gate refusing a file on the syntax's own account must not refuse one on the default. Which break closes one is no question of the syntax's: a line break is what PostCSS reads as one, a line feed with or without a carriage return in front of it, and every scan of a text closes such a comment there. */
export type InlineCommentReading = {
	spells: boolean,
	keeps: boolean,
	answered: boolean,
}

/** The reading of {@link probeSyntax}, per syntax. */
let inlineCommentSyntaxes: WeakMap<object, InlineCommentReading> = new WeakMap()

/** A stylesheet holding an inline comment in both of the places the first two answers turn on. */
const INLINE_COMMENT_PROBE = `a {}\n// comment\na { b: 'x', // comment\n  'y'; }\n`

/**
 * Hands a syntax the stylesheet spelling an inline comment in the places the answers turn on, and reads them off what comes back.
 * @param syntax - The syntax the stylesheet was parsed with.
 * @returns What that syntax made of the probes.
 */
function probeSyntax (syntax?: unknown): InlineCommentReading {
	// No syntax at all is plain CSS, which spells no comment with a double slash, so no break of any kind closes one
	if (!syntax) return { spells: false, keeps: false, answered: true }

	// Something is there that cannot be asked, so it is answered as anything else that says nothing
	if (!isSyntax(syntax)) return { spells: true, keeps: false, answered: false }

	let known = inlineCommentSyntaxes.get(syntax)

	if (known !== undefined) return known

	// A syntax that makes nothing of the probe has said nothing, and the answer that costs nothing is the one that reads a comment as a comment
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
				if ((`inline` in comment && comment.inline) || comment.raws.inline) reading.spells = true
			})
		}
		// The raw is the copy a syntax rewrites the comments of a value in, and the second question is asked only where that copy is the one the rule reads, so a double slash surviving there is what it turns on — not one the syntax has left standing in a copy beside it
		probe.walkDecls((decl) => {
			let raws = decl.raws

			if (((raws.value && raws.value.raw) || decl.value).includes(`//`)) reading.keeps = true
		})
	}
	catch {
		// A syntax that cannot parse the probe has said nothing about it, and the reading standing is the one that reads a comment as a comment
	}

	inlineCommentSyntaxes.set(syntax, reading)

	return reading
}

/**
 * Asks whether a double slash standing in the text of a node opens a comment there.
 *
 * The two spellings are identical, so the text cannot answer this and the syntax has to: a double slash of plain CSS is code — part of an address, most often, `myurl(//a)` or `a//b` — and reading it as a comment silences everything behind it on the line. Answering costs a parse of a probe — two of them, since {@link inlineCommentReading} asks a second question of a second stylesheet — and the answers are kept against the syntax they were given by, which is once per file rather than once per run, since Stylelint builds a fresh syntax for every file unless the syntax was named to it as a string.
 *
 * This is the one answer of the reading most callers want: eight of them scan a text for the comments it holds, while `function-whitespace-after` reads this as whether the file is written in a language that spells arithmetic of its own. A caller standing in front of a fix wants the whole of the reading, and asks {@link inlineCommentReading} instead.
 * @param node - The node whose text is being read.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns True where a double slash in that node's text opens a comment.
 */
export function readsInlineComments (node: Node, result: PostcssResult): boolean {
	return syntaxSpellsInlineComments(nodeSyntax(node, result))
}

/**
 * What the syntax that parsed a node makes of a comment opened by a double slash: whether it spells one at all, and whether it leaves one standing in the value a rule reads.
 * @param node - The node whose text is being read.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns What that syntax makes of such a comment.
 */
export function inlineCommentReading (node: Node, result: PostcssResult): InlineCommentReading {
	return probeSyntax(nodeSyntax(node, result))
}

/**
 * Asks whether a double slash opens a comment in a syntax at all, by handing it one and looking at what comes back. Naming the syntaxes that qualify would miss every custom one, and a syntax passed as an object has no name to go by in the first place.
 *
 * A syntax that makes nothing of the probe is answered `true`. A host language reads a stylesheet out of a page, a template or a tagged literal and finds none in a bare one, and a syntax that throws says nothing at all; taking either for plain CSS would read the comments of a file as code and let a fix write the rest of a line into one. Only a syntax that read the probe as the stylesheet it is, and spelled no comment with a double slash in it, is plain CSS as far as this goes.
 * @param syntax - The syntax the stylesheet was parsed with.
 * @returns True if a double slash spells a comment in this syntax.
 */
export function syntaxSpellsInlineComments (syntax?: unknown): boolean {
	return probeSyntax(syntax).spells
}

/**
 * Asks whether a double slash left standing in a value is a comment. Two answers are needed and neither suffices alone: a syntax without inline comments spells no comment that way, and one that rewrites them into block comments as it parses leaves nothing behind in the value for a scan to find — it says where they were in a copy of its own instead, and whatever double slash survives in the value is part of an address.
 * @param syntax - The syntax the stylesheet was parsed with.
 * @returns True if a double slash in a value of this syntax opens a comment.
 */
export function syntaxKeepsInlineComments (syntax?: unknown): boolean {
	let reading = probeSyntax(syntax)

	return reading.spells && reading.keeps
}
