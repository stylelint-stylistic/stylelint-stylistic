import { findInlineCommentSpans } from "../findInlineCommentSpans/index.ts"
import { rewriteInlineComments } from "../rewriteInlineComments/index.ts"
import { syncLessVariableValue } from "../syncLessVariableValue/index.ts"

type AtRule = import("postcss").AtRule

/**
 * Sets the params of an at-rule, in the copy of them the syntax prints.
 *
 * Where `postcss-scss` keeps two copies of a set of parameters, the raw one it rewrote the `//` comments in and the one spelled as the file spells it, the second is the one that is printed, so the fix goes there. The raw is kept beside it in step, for the rules that come after: rewriting the comments of the fixed parameters the way the syntax rewrites them is what fills it, so a rule reading the pair is still handed the two copies of one text.
 * @param atRule - The at-rule node.
 * @param params - The new params to set.
 * @returns The at-rule that was passed in.
 */
export function setAtRuleParams (atRule: AtRule, params: string): AtRule {
	let syntaxRaw: import("../typeGuards/index.ts").SyntaxRaw | undefined = atRule.raws.params

	if (syntaxRaw) {
		if (typeof syntaxRaw.scss === `string`) {
			syntaxRaw.scss = params
			syntaxRaw.raw = rewriteInlineComments(params, findInlineCommentSpans(params, true))
		}
		else {
			syntaxRaw.raw = params
		}
	}
	else {
		atRule.params = params
	}

	syncLessVariableValue(atRule, params)

	return atRule
}

export type { AtRule }
