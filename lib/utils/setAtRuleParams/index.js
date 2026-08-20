import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"
import { rewriteInlineComments } from "../rewriteInlineComments/index.js"
import { syncLessVariableValue } from "../syncLessVariableValue/index.js"

/** @typedef {import('postcss').AtRule} AtRule */

/**
 * Sets the params of an at-rule, in the copy of them the syntax prints.
 *
 * Where `postcss-scss` keeps two copies of a set of parameters, the raw one it rewrote the `//` comments in and the one spelled as the file spells it, the second is the one that is printed, so the fix goes there. The raw is kept beside it in step, for the rules that come after: rewriting the comments of the fixed parameters the way the syntax rewrites them is what fills it, so a rule reading the pair is still handed the two copies of one text.
 * @param {AtRule} atRule - The at-rule node.
 * @param {string} params - The new params to set.
 * @returns {AtRule} The at-rule that was passed in.
 */
export function setAtRuleParams (atRule, params) {
	let raws = atRule.raws

	if (raws.params) {
		if (typeof raws.params.scss === `string`) {
			raws.params.scss = params
			raws.params.raw = rewriteInlineComments(params, findInlineCommentSpans(params, true))
		}
		else {
			raws.params.raw = params
		}
	}
	else {
		atRule.params = params
	}

	syncLessVariableValue(atRule, params)

	return atRule
}
