import type { Rule } from "postcss"

import type { SyntaxRaw } from "../typeGuards/index.ts"

/**
 * Sets the selector of a rule, in the copy of it the syntax prints.
 *
 * Where PostCSS keeps a raw of the selector beside the copy with the comments taken out, the raw is the one that is printed, so the fix goes there. Assigning `rule.selector` would have PostCSS throw the raw away, and every comment the selector holds with it. The pair a preprocessor keeps beside it is its own namespace\u2019s to write.
 * @param rule - The rule node.
 * @param selector - The new selector to set.
 * @returns The rule that was passed in.
 */
export function setRuleSelector (rule: Rule, selector: string): Rule {
	let syntaxRaw: SyntaxRaw | undefined = rule.raws.selector

	if (syntaxRaw) {
		syntaxRaw.raw = selector
	}
	else {
		rule.selector = selector
	}

	return rule
}
