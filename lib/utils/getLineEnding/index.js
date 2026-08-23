import { CAPTURED_LINE_BREAK } from "../../regexps.js"
import { blankComments } from "../blankComments/index.js"
import { findCommentSpans } from "../findCommentSpans/index.js"
import { withoutQuotedTextAndComments } from "../withoutQuotedTextAndComments/index.js"

/** @type {WeakMap<import('postcss').Input, string | undefined>} What each file was found to end its lines with, kept against the input it was read out of, so that a file is scanned once however many fixes ask about it. */
let lineEndings = new WeakMap()

/**
 * Reads what a file ends its lines with, off the text the syntax was handed rather than off anything PostCSS prints back.
 *
 * `context.newline`, which Stylelint hands a rule, is no answer to this: it reads the file for a line feed with an optional carriage return in front of it and falls back to the line ending of the machine, so it knows a line feed and a Windows pair and neither of the two other breaks a stylesheet is written with. A fixer writing that into a file spelled with bare carriage returns or with form feeds writes a character the file holds nowhere else.
 *
 * Asking the whitespace a node keeps around itself is no answer either, which is what six readings of the branch of #245 were between them: whitespace is not the only place a break stands, and a break standing in a selector, in a value, in a set of parameters or in `raws.important` is invisible to every one of them. The question is about the file, so the file is what is read.
 *
 * A break standing inside a comment or inside a quoted string does not count. It ends a line and says nothing about how the file spells its lines — `a {color/*\r*\/: pink;\ntop: 0;}` is broken with line feeds whatever its comment holds — so every comment and the text of every string is blanked out before the search. The blanking keeps the length of what it replaces, and a comment written with a double slash keeps the break that closes it, since that break is the file's and not the comment's.
 *
 * The first break is the answer rather than the commonest one. A file spelling its lines two ways is a file no reading can tell the truth about, and one sentence that always holds beats a count that is right more often; it is also how the reading above this plugin works, so the two part company only where they must.
 * @param {import('postcss').Node} node - A node of the file being asked about.
 * @returns {string | undefined} The break the file ends its lines with, or `undefined` where nothing can be read: a file written on one line, a file whose only breaks stand inside its comments and its strings, and a node standing in no file at all, which is one made by hand and one taken out of its tree before the tree was parsed.
 */
export function getLineEnding (node) {
	let input = node.root().source?.input

	if (!input) return

	if (lineEndings.has(input)) return lineEndings.get(input)

	// A form feed closes an inline comment here whatever syntax wrote the file, as it does for Sass alone: read the other way, the break Sass ends the comment on would be blanked away with the comment, and it is the very break such a file is broken with
	let code = withoutQuotedTextAndComments(blankComments(input.css, findCommentSpans(input.css, true)))
	let spelled = code.match(CAPTURED_LINE_BREAK)
	let ending = spelled ? spelled[0] : undefined

	lineEndings.set(input, ending)

	return ending
}
