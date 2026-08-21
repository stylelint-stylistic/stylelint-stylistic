/** @typedef {{ spells: boolean, keeps: boolean }} InlineCommentVerdict The two answers one probe of a syntax gives. */

/** @type {WeakMap<object, InlineCommentVerdict>} The verdict of {@link probeSyntax}, per syntax. */
let inlineCommentSyntaxes = new WeakMap()

/** A stylesheet holding an inline comment in both of the places the verdict turns on. */
const INLINE_COMMENT_PROBE = `a {}\n// comment\na { b: 'x', // comment\n  'y'; }\n`

/**
 * Hands a syntax a stylesheet spelling an inline comment in the two places the verdicts turn on, and reads the answers off what comes back.
 * @param {any} syntax - The syntax the stylesheet was parsed with.
 * @returns {InlineCommentVerdict} What that syntax made of the probe.
 */
function probeSyntax (syntax) {
	// No syntax at all is plain CSS, which spells no comment with a double slash
	if (!syntax) return { spells: false, keeps: false }

	// Something is there that cannot be asked, so it is answered as anything else that says nothing
	if (typeof syntax.parse !== `function`) return { spells: true, keeps: false }

	let known = inlineCommentSyntaxes.get(syntax)

	if (known !== undefined) return known

	// A syntax that makes nothing of the probe has said nothing, and the answer that costs nothing is the one that reads a comment as a comment
	let verdict = { spells: true, keeps: false }

	try {
		let probe = syntax.parse(INLINE_COMMENT_PROBE, { from: undefined })
		let readsTheProbe = false

		probe.walk((node) => {
			if (node.type === `rule` || node.type === `decl`) readsTheProbe = true
		})

		if (readsTheProbe) {
			verdict.spells = false

			probe.walkComments((comment) => {
				if (comment.inline || comment.raws.inline) verdict.spells = true
			})
		}
		// The raw is the copy a syntax rewrites the comments of a value in, and the second question is asked only where that copy is the one the rule reads, so a double slash surviving there is what it turns on — not one the syntax has left standing in a copy beside it
		probe.walkDecls((decl) => {
			let raws = decl.raws

			if (((raws.value && raws.value.raw) || decl.value).includes(`//`)) verdict.keeps = true
		})
	}
	catch {
		// A syntax that cannot parse the probe has said nothing about it, and the verdict standing is the one that reads a comment as a comment
	}

	inlineCommentSyntaxes.set(syntax, verdict)

	return verdict
}

/**
 * Asks whether a double slash standing in the text of a node opens a comment there.
 *
 * The two spellings are identical, so the text cannot answer this and the syntax has to: a double slash of plain CSS is code — part of an address, most often, `myurl(//a)` or `a//b` — and reading it as a comment silences everything behind it on the line. Answering costs one parse of a probe, and the answer is kept against the syntax it was given by — which is once per file rather than once per run, since Stylelint builds a fresh syntax for every file unless the syntax was named to it as a string.
 *
 * A stylesheet embedded in a page carries the syntax of its own block, and it is that one the question belongs to: the syntax the file was opened with parses the page rather than the style, and one page may hold blocks written in several languages.
 * @param {import('postcss').Node} node - The node whose text is being read.
 * @param {import('stylelint').PostcssResult} result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns {boolean} True where a double slash in that node's text opens a comment.
 */
export function readsInlineComments (node, result) {
	let root = node.root()
	let syntax = (root.source && /** @type {{ syntax?: any }} */ (root.source).syntax) || (result.opts && result.opts.syntax)

	return syntaxSpellsInlineComments(syntax)
}

/**
 * Asks whether a double slash opens a comment in a syntax at all, by handing it one and looking at what comes back. Naming the syntaxes that qualify would miss every custom one, and a syntax passed as an object has no name to go by in the first place.
 *
 * A syntax that makes nothing of the probe is answered `true`. A host language reads a stylesheet out of a page, a template or a tagged literal and finds none in a bare one, and a syntax that throws says nothing at all; taking either for plain CSS would read the comments of a file as code and let a fix write the rest of a line into one. Only a syntax that read the probe as the stylesheet it is, and spelled no comment with a double slash in it, is plain CSS as far as this goes.
 * @param {any} syntax - The syntax the stylesheet was parsed with.
 * @returns {boolean} True if a double slash spells a comment in this syntax.
 */
export function syntaxSpellsInlineComments (syntax) {
	return probeSyntax(syntax).spells
}

/**
 * Asks whether a double slash left standing in a value is a comment. Two answers are needed and neither suffices alone: a syntax without inline comments spells no comment that way, and one that rewrites them into block comments as it parses leaves nothing behind in the value for a scan to find — it says where they were in a copy of its own instead, and whatever double slash survives in the value is part of an address.
 * @param {any} syntax - The syntax the stylesheet was parsed with.
 * @returns {boolean} True if a double slash in a value of this syntax opens a comment.
 */
export function syntaxKeepsInlineComments (syntax) {
	let verdict = probeSyntax(syntax)

	return verdict.spells && verdict.keeps
}
