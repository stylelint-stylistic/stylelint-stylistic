import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"
import { rewriteInlineComments } from "../rewriteInlineComments/index.js"

/** @typedef {import('postcss').Declaration} Declaration */

/**
 * Sets the value of a CSS declaration, in the copy of it the syntax prints.
 *
 * Where `postcss-scss` keeps two copies of a value, the raw one it rewrote the `//` comments in and
 * the one spelled as the file spells it, the second is the one that is printed, so the fix goes
 * there. The raw is kept beside it in step, for the rules that come after: rewriting the comments of
 * the fixed value the way the syntax rewrites them is what fills it, so a rule reading the pair is
 * still handed the two copies of one text.
 * @param {Declaration} decl - The CSS declaration node.
 * @param {string} value - The new value to set.
 * @returns {Declaration} The declaration that was passed in.
 */
export function setDeclarationValue (decl, value) {
	let raws = decl.raws

	if (raws.value) {
		if (typeof raws.value.scss === `string`) {
			raws.value.scss = value
			raws.value.raw = rewriteInlineComments(value, findInlineCommentSpans(value, true))
		}
		else {
			raws.value.raw = value
		}
	}
	else {
		decl.value = value
	}

	return decl
}
