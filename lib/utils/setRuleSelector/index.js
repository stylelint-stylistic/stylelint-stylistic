import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"
import { rewriteInlineComments } from "../rewriteInlineComments/index.js"

/** @typedef {import('postcss').Rule} Rule */

/**
 * Sets the selector of a rule, in the copy of it the syntax prints.
 *
 * Where `postcss-scss` keeps two copies of a selector, the raw one it rewrote the `//` comments in and the one spelled as the file spells it, the second is the one that is printed, so the fix goes there. The raw is kept beside it in step, for the rules that come after: rewriting the comments of the fixed selector the way the syntax rewrites them is what fills it, so a rule reading the pair is still handed the two copies of one text. Assigning `rule.selector` would have PostCSS throw both raws away, and every comment the selector holds with them.
 * @param {Rule} rule - The rule node.
 * @param {string} selector - The new selector to set.
 * @returns {Rule} The rule that was passed in.
 */
export function setRuleSelector (rule, selector) {
	let raws = rule.raws

	if (raws.selector) {
		if (typeof raws.selector.scss === `string`) {
			raws.selector.scss = selector
			raws.selector.raw = rewriteInlineComments(selector, findInlineCommentSpans(selector, true))
		}
		else {
			raws.selector.raw = selector
		}
	}
	else {
		rule.selector = selector
	}

	return rule
}
