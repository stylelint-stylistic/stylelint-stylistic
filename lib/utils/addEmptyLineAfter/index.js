import { CAPTURED_LINE_BREAK, LINE_BREAK } from "../../regexps.js"
import { blankComments } from "../blankComments/index.js"
import { findCommentSpans } from "../findCommentSpans/index.js"

/**
 * Adds an empty line after a node. Mutates the node.
 * @template {import('postcss').Rule | import('postcss').AtRule} T
 * @param {T} node - The PostCSS node to modify.
 * @param {string} newline - The newline to write where none of the whitespace the file keeps around the node and its tree holds a break: an empty line is otherwise spelled with a break the file already uses.
 * @returns {T} The modified node.
 */
export function addEmptyLineAfter (node, newline) {
	let { raws } = node

	if (typeof raws.after !== `string`) return node

	// A stray semicolon standing here is not the node's, and the empty line belongs behind it rather than in front: the text after the last one is where the break is looked for and where it is written
	let start = raws.after.lastIndexOf(`;`) + 1
	let after = raws.after.slice(start)

	// The break already standing is written twice over, so that the empty line is spelled the way the file spells its lines rather than the way `context.newline` reads them — those two part company wherever a file ends its lines with a bare carriage return or a form feed, neither of which that reading knows
	if (LINE_BREAK.test(after)) {
		raws.after = raws.after.slice(0, start) + after.replace(CAPTURED_LINE_BREAK, `$1$1`)

		return node
	}

	// Nothing to copy in that tail, so a break standing in the whitespace of the tree is written twice instead. Five raws hold whitespace the file keeps between one thing and the next — what stands in front of a node, behind its name, between it and what follows that name, inside its block at the end, and in the semicolon a nested block may be followed by — and a node whose own children open no line may still hold one that does, `a {b {\rcolor: pink;\r}}` for one, so the whole tree is asked and not the children alone
	let texts = [raws.before, raws.afterName, raws.between, raws.ownSemicolon, raws.after]

	node.walk((child) => texts.push(child.raws.before, child.raws.afterName, child.raws.between, child.raws.ownSemicolon, child.raws.after))

	// A comment stands in these raws beside the whitespace, and a break inside one says nothing about how the file ends its lines: `a {color/*\r*/: pink;\ntop: 0;}` is broken with line feeds however its comment is spelled. Every comment is blanked out before the break is looked for — a form feed among the breaks that close an inline one, since Sass ends a comment on that character and blanking it away with the comment would lose the very break the file is broken with
	let spelled = texts
		.filter((text) => typeof text === `string`)
		.map((text) => blankComments(text, findCommentSpans(text, true)).match(CAPTURED_LINE_BREAK))
		.find(Boolean)

	// Where none of that whitespace holds a break — a single-line block, and a block whose only break stands in a selector, a value, a set of parameters, a comment or an `!important` — `context.newline` is all there is to write
	raws.after += (spelled ? spelled[0] : newline).repeat(2)

	return node
}
