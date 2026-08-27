import { FORM_FEED } from "../../regexps.js"

/** @typedef {{ spells: boolean, keeps: boolean, endsOnFormFeed: boolean | undefined }} InlineCommentReading What the probes of a syntax say about a comment opened by a double slash: whether the syntax spells one at all, whether it leaves one standing in the value a rule reads, and which line breaks close one — the last of them undefined where the syntax has said nothing about the form feed. */

/** @type {WeakMap<object, InlineCommentReading>} The reading of {@link probeSyntax}, per syntax. */
let inlineCommentSyntaxes = new WeakMap()

/** A stylesheet holding an inline comment in both of the places the first two answers turn on. */
const INLINE_COMMENT_PROBE = `a {}\n// comment\na { b: 'x', // comment\n  'y'; }\n`

/** A stylesheet holding an inline comment a form feed stands in the middle of, with a rule of its own written behind that form feed. A syntax reading a line in the character has a comment and two rules here; one reading none has a comment holding the second rule, and one rule. */
const FORM_FEED_PROBE = `a {}\n// c\fb {}\n`

/**
 * Reads off a syntax which line breaks close an inline comment in it, by handing it one a form feed stands in the middle of.
 *
 * Sass ends such a comment on a form feed, on a line feed and on a carriage return alike; Less normalises the line endings of a file before parsing it and reads no line in a form feed at all. Both compilers were asked, and both parsers answer as their compiler does. So the character is the one thing the two languages disagree about, and neither of the two answers describes both.
 *
 * A syntax that says neither thing is left undefined rather than answered by a guess: naming a reading it has not given would let a fix write into a comment of a language nobody asked about, and the callers owe both readings where the language is unnamed.
 * @param {any} syntax - The syntax the stylesheet was parsed with.
 * @returns {boolean | undefined} True where a form feed closes an inline comment of that syntax, false where it does not, and undefined where the syntax has not said.
 */
function probeFormFeed (syntax) {
	/** @type {boolean | undefined} */
	let endsOnFormFeed

	try {
		let probe = syntax.parse(FORM_FEED_PROBE, { from: undefined })

		probe.walk((node) => {
			// The comment runs past the form feed and takes the rule behind it into its text, which is a syntax reading no line in the character
			if (node.type === `comment` && FORM_FEED.test(node.text)) endsOnFormFeed = false

			// The rule behind the form feed was read as a rule, which the syntax can only have done by closing the comment on that character
			if (endsOnFormFeed === undefined && node.type === `rule` && node.selector === `b`) endsOnFormFeed = true
		})
	}
	catch {
		// A syntax that cannot parse this probe has said nothing about the character, and both readings stay owed
	}

	return endsOnFormFeed
}

/**
 * Hands a syntax the stylesheets spelling an inline comment in the places the answers turn on, and reads them off what comes back.
 *
 * The form feed is handed over in a stylesheet of its own, parsed under a `try` of its own, so that a syntax stumbling over the character says nothing about it rather than unsaying the two answers the first probe has already given.
 * @param {any} syntax - The syntax the stylesheet was parsed with.
 * @returns {InlineCommentReading} What that syntax made of the probes.
 */
function probeSyntax (syntax) {
	// No syntax at all is plain CSS, which spells no comment with a double slash, so no break of any kind closes one
	if (!syntax) return { spells: false, keeps: false, endsOnFormFeed: false }

	// Something is there that cannot be asked, so it is answered as anything else that says nothing
	if (typeof syntax.parse !== `function`) return { spells: true, keeps: false, endsOnFormFeed: undefined }

	let known = inlineCommentSyntaxes.get(syntax)

	if (known !== undefined) return known

	// A syntax that makes nothing of the probe has said nothing, and the answer that costs nothing is the one that reads a comment as a comment
	/** @type {InlineCommentReading} */
	let reading = { spells: true, keeps: false, endsOnFormFeed: undefined }

	try {
		let probe = syntax.parse(INLINE_COMMENT_PROBE, { from: undefined })
		let readsTheProbe = false

		probe.walk((node) => {
			if (node.type === `rule` || node.type === `decl`) readsTheProbe = true
		})

		if (readsTheProbe) {
			reading.spells = false

			probe.walkComments((comment) => {
				if (comment.inline || comment.raws.inline) reading.spells = true
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

	reading.endsOnFormFeed = probeFormFeed(syntax)

	inlineCommentSyntaxes.set(syntax, reading)

	return reading
}

/**
 * The syntax a node was parsed with.
 *
 * A stylesheet embedded in a page carries the syntax of its own block, and it is that one the question belongs to: the syntax the file was opened with parses the page rather than the style, and one page may hold blocks written in several languages.
 * @param {import('postcss').Node} node - The node whose text is being read.
 * @param {import('stylelint').PostcssResult} result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns {any} That syntax, undefined where the file was read as plain CSS.
 */
function syntaxOf (node, result) {
	let root = node.root()

	return (root.source && /** @type {{ syntax?: any }} */ (root.source).syntax) || (result.opts && result.opts.syntax)
}

/**
 * Asks whether a double slash standing in the text of a node opens a comment there.
 *
 * The two spellings are identical, so the text cannot answer this and the syntax has to: a double slash of plain CSS is code — part of an address, most often, `myurl(//a)` or `a//b` — and reading it as a comment silences everything behind it on the line. Answering costs a parse of a probe — two of them, since {@link inlineCommentReading} asks a second question of a second stylesheet — and the answers are kept against the syntax they were given by, which is once per file rather than once per run, since Stylelint builds a fresh syntax for every file unless the syntax was named to it as a string.
 *
 * This is the one answer of the reading, and the callers left here want no other: eight of them scan a text for the comments it holds, and put where such a comment ends to {@link endsInlineCommentOnFormFeed} for the node rather than to the syntax, while `function-whitespace-after` reads this as whether the file is written in a language that spells arithmetic of its own. A caller standing in front of a fix wants the whole of the reading, and asks {@link inlineCommentReading} instead.
 * @param {import('postcss').Node} node - The node whose text is being read.
 * @param {import('stylelint').PostcssResult} result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns {boolean} True where a double slash in that node's text opens a comment.
 */
export function readsInlineComments (node, result) {
	return syntaxSpellsInlineComments(syntaxOf(node, result))
}

/**
 * What the syntax that parsed a node makes of a comment opened by a double slash: whether it spells one at all, and which line breaks close one.
 *
 * A guard standing in front of a fix reads a text of the node for the comment it may end inside, and both halves of that are the syntax's to answer. Handing the guard the whole reading is what keeps the two apart from each other: the older shape passed one boolean out of the two, and the scan behind it then closed a comment on a line feed and on a carriage return and on nothing else — which is Less's reading entire, handed to every caller whatever language the file was in.
 * @param {import('postcss').Node} node - The node whose text is being read.
 * @param {import('stylelint').PostcssResult} result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns {InlineCommentReading} What that syntax makes of such a comment.
 */
export function inlineCommentReading (node, result) {
	return probeSyntax(syntaxOf(node, result))
}

/**
 * The readings of a form feed a text is still owed, one of them where the reading names the language and both where it does not.
 *
 * Each of the two is a whole language: a line feed and a carriage return are what Less reads a line in, and Sass reads one in a form feed as well. Where the language is unnamed, neither of the two describes the file, and neither may be trusted alone — the two are not even ordered by how much they let through. An early close hands the characters behind it to the code, and code can open a string or a comment the other reading never saw: `// A \f " \n B " // C "` ends outside every comment under Less's reading and inside one under Sass's.
 * @param {InlineCommentReading} reading - What the syntax makes of such a comment.
 * @returns {boolean[]} Whether a form feed closes a comment, once per reading still owed.
 */
export function formFeedReadingsOwed (reading) {
	return reading.endsOnFormFeed === undefined ? [false, true] : [reading.endsOnFormFeed]
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
	let reading = probeSyntax(syntax)

	return reading.spells && reading.keeps
}
