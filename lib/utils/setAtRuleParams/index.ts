import type { AtRule } from "postcss"

import type { SyntaxRaw } from "../typeGuards/index.ts"

/**
 * Sets the params of an at-rule, in the copy of them the syntax prints.
 *
 * Where PostCSS keeps a raw of the parameters beside the copy with the comments taken out, the raw is the one that is printed, so the fix goes there. The pair a preprocessor keeps beside it is its own namespace\u2019s to write.
 * @param atRule - The at-rule node.
 * @param params - The new params to set.
 * @returns The at-rule that was passed in.
 */
export function setAtRuleParams (atRule: AtRule, params: string): AtRule {
	let syntaxRaw: SyntaxRaw | undefined = atRule.raws.params

	if (syntaxRaw) {
		syntaxRaw.raw = params
	}
	else {
		atRule.params = params
	}

	return atRule
}
